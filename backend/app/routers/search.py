from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.database import get_db
from app.services.search_service import (
    hybrid_search,
    get_autocomplete_suggestions,
    get_filter_options,
    parse_query
)
from app.services.elasticsearch_service import (
    create_indices, bulk_index,
    INDEX_PROJECTS, INDEX_STAKEHOLDERS, INDEX_RESOURCES,
    ELASTICSEARCH_ENABLED
)
from app.services.embedding_service import (
    generate_embedding, store_embedding, clear_vector_store,
    EMBEDDING_ENABLED
)
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.resource import Resource

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/api/search")
def search(
    q: str = Query("", description="Search query"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type: project, stakeholder, resource"),
    country: Optional[str] = Query(None, description="Filter by country"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    ai_technology: Optional[str] = Query(None, description="Filter by AI technology"),
    stakeholder_type: Optional[str] = Query(None, description="Filter by stakeholder type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db)
):
    filters = {}
    if country:
        filters["country"] = country
    if sector:
        filters["sector"] = sector
    if ai_technology:
        filters["ai_technology"] = ai_technology
    if stakeholder_type:
        filters["stakeholder_type"] = stakeholder_type
    if resource_type:
        filters["resource_type"] = resource_type

    result = hybrid_search(
        query=q,
        filters=filters,
        db=db,
        entity_type=entity_type,
        page=page,
        page_size=page_size
    )
    return result


@router.get("/api/search/suggestions")
def suggestions(
    q: str = Query("", description="Prefix for suggestions"),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    if not q or len(q.strip()) < 2:
        return {"suggestions": []}

    es_suggestions = get_autocomplete_suggestions(q.strip(), limit)
    if es_suggestions:
        return {"suggestions": es_suggestions}

    term = q.strip()
    results = []
    per_type = max(2, limit // 3)

    # Prefix matches first (starts with), then contains — for each type
    for Model, label, text_field in [
        (Project,     "project",     Project.title),
        (Stakeholder, "stakeholder", Stakeholder.name),
        (Resource,    "resource",    Resource.title),
    ]:
        base = db.query(Model)
        if Model is Project:
            base = base.filter(Project.status.notin_(["pending", "rejected"]))

        # Starts-with (higher relevance)
        starts = base.filter(text_field.ilike(f"{term}%")).limit(per_type).all()
        seen_ids = {r.id for r in starts}
        for r in starts:
            results.append({"text": getattr(r, "title", None) or getattr(r, "name", ""),
                            "entity_type": label, "id": r.id, "priority": 0})

        # Contains (lower relevance, fill remaining slots)
        remaining = per_type - len(starts)
        if remaining > 0:
            contains = base.filter(
                text_field.ilike(f"%{term}%"),
                ~text_field.ilike(f"{term}%"),
            ).limit(remaining).all()
            for r in contains:
                if r.id not in seen_ids:
                    results.append({"text": getattr(r, "title", None) or getattr(r, "name", ""),
                                    "entity_type": label, "id": r.id, "priority": 1})

    # Sort: starts-with first, then alphabetically
    results.sort(key=lambda x: (x["priority"], x["text"].lower()))
    for r in results:
        r.pop("priority", None)

    return {"suggestions": results[:limit]}


@router.get("/api/search/filters")
def search_filters(db: Session = Depends(get_db)):
    return get_filter_options(db)


@router.post("/api/search/parse")
def parse_search_query(q: str = Query("", description="Natural language query")):
    parsed = parse_query(q)
    return {
        "original": q,
        "parsed": {
            "country": parsed.country,
            "sector": parsed.sector,
            "technology": parsed.technology,
            "date_from": parsed.date_from,
            "date_to": parsed.date_to,
            "entity_type": parsed.entity_type,
            "clean_query": parsed.clean_query
        }
    }


@router.post("/api/search/sync")
def sync_search_index(db: Session = Depends(get_db)):
    if not ELASTICSEARCH_ENABLED and not EMBEDDING_ENABLED:
        create_indices()

    clear_vector_store()

    projects = db.query(Project).filter(
        Project.status.notin_(["pending", "rejected"])
    ).all()
    project_docs = []
    for p in projects:
        stakeholders = []
        for assoc in p.stakeholder_associations:
            if assoc.stakeholder:
                stakeholders.append(assoc.stakeholder.name)
        country_name = p.country.name if p.country else None
        doc = {
            "id": p.id,
            "title": p.title or "",
            "description": p.description or "",
            "summary": (p.description or "")[:300],
            "sector": p.sector or "",
            "ai_technology": p.ai_technology or "",
            "sdg_alignment": p.sdg_alignment or "",
            "country": country_name or "",
            "country_id": p.country_id,
            "status": p.status or "",
            "start_date": str(p.start_date) if p.start_date else None,
            "end_date": str(p.end_date) if p.end_date else None,
            "stakeholders": ", ".join(stakeholders),
            "stakeholder_ids": [assoc.stakeholder_id for assoc in p.stakeholder_associations],
            "created_at": str(p.created_at) if p.created_at else None,
            "updated_at": str(p.updated_at) if p.updated_at else None,
            "entity_type": "project",
            "suggest": {"input": [p.title] + (stakeholders) + ([p.sector] if p.sector else [])}
        }
        project_docs.append(doc)

        if EMBEDDING_ENABLED:
            text = f"{p.title} {p.description or ''} {p.sector or ''} {p.ai_technology or ''}"
            emb = generate_embedding(text)
            if emb:
                store_embedding("project", p.id, emb, {
                    "title": p.title, "country": country_name, "sector": p.sector
                })

    stakeholders = db.query(Stakeholder).all()
    stakeholder_docs = []
    for s in stakeholders:
        doc = {
            "id": s.id,
            "name": s.name or "",
            "type": s.type or "",
            "country": s.country or "",
            "country_id": s.country_id,
            "city": s.city or "",
            "description": s.description or "",
            "expertise": s.description or "",
            "website": s.website or "",
            "created_at": str(s.created_at) if s.created_at else None,
            "updated_at": str(s.updated_at) if s.updated_at else None,
            "entity_type": "stakeholder",
            "suggest": {"input": [s.name] + ([s.type] if s.type else [])}
        }
        stakeholder_docs.append(doc)

        if EMBEDDING_ENABLED:
            text = f"{s.name} {s.description or ''} {s.type or ''}"
            emb = generate_embedding(text)
            if emb:
                store_embedding("stakeholder", s.id, emb, {
                    "title": s.name, "country": s.country, "type": s.type
                })

    resources = db.query(Resource).all()
    resource_docs = []
    for r in resources:
        doc = {
            "id": r.id,
            "title": r.title or "",
            "description": r.description or "",
            "type": r.type or "",
            "category": r.category or "",
            "country": "",
            "tags": [r.type or "", r.category or ""],
            "language": r.language or "",
            "author": r.author or "",
            "publisher": r.publisher or "",
            "publication_date": str(r.publication_date) if r.publication_date else None,
            "created_at": str(r.created_at) if r.created_at else None,
            "updated_at": str(r.updated_at) if r.updated_at else None,
            "entity_type": "resource",
            "suggest": {"input": [r.title] + [r.type or ""] + [r.category or ""]}
        }
        resource_docs.append(doc)

        if EMBEDDING_ENABLED:
            text = f"{r.title} {r.description or ''} {r.type or ''} {r.category or ''}"
            emb = generate_embedding(text)
            if emb:
                store_embedding("resource", r.id, emb, {
                    "title": r.title, "type": r.type, "category": r.category
                })

    es_results = {"projects": 0, "stakeholders": 0, "resources": 0}
    embedding_count = 0

    if ELASTICSEARCH_ENABLED:
        es_results["projects"] = bulk_index(INDEX_PROJECTS, project_docs) or 0
        es_results["stakeholders"] = bulk_index(INDEX_STAKEHOLDERS, stakeholder_docs) or 0
        es_results["resources"] = bulk_index(INDEX_RESOURCES, resource_docs) or 0

    if EMBEDDING_ENABLED:
        from app.services.embedding_service import VECTOR_STORE as es_vector_store
        embedding_count = len(es_vector_store)

    return {
        "message": "Search index synced successfully",
        "indexed": {
            "projects": len(project_docs),
            "stakeholders": len(stakeholder_docs),
            "resources": len(resource_docs),
            "elasticsearch": es_results,
            "embeddings": embedding_count
        }
    }
