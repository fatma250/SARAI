"""
Sync database records to Elasticsearch and Embedding vector store.
Run: python -m scripts.sync_elasticsearch
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

from app.database import SessionLocal
from app.services.elasticsearch_service import (
    create_indices, bulk_index, INDEX_PROJECTS, INDEX_STAKEHOLDERS, INDEX_RESOURCES,
    ELASTICSEARCH_ENABLED
)
from app.services.embedding_service import (
    generate_embedding, store_embedding, clear_vector_store, EMBEDDING_ENABLED
)
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.resource import Resource


def sync_all():
    logger.info("Starting search index sync...")

    if ELASTICSEARCH_ENABLED:
        create_indices()
        logger.info("Elasticsearch indices ready")
    else:
        logger.info("Elasticsearch not enabled, skipping ES sync")

    clear_vector_store()

    db = SessionLocal()

    try:
        projects = db.query(Project).filter(
            Project.status.notin_(['pending', 'rejected'])
        ).all()
        project_docs = []
        for p in projects:
            stakeholders = []
            for assoc in p.stakeholder_associations:
                if assoc.stakeholder:
                    stakeholders.append(assoc.stakeholder.name)
            country_name = p.country.name if p.country else None
            doc = {
                "id": p.id, "title": p.title or "", "description": p.description or "",
                "summary": (p.description or "")[:300],
                "sector": p.sector or "", "ai_technology": p.ai_technology or "",
                "sdg_alignment": p.sdg_alignment or "",
                "country": country_name or "", "country_id": p.country_id,
                "status": p.status or "",
                "start_date": str(p.start_date) if p.start_date else None,
                "end_date": str(p.end_date) if p.end_date else None,
                "stakeholders": ", ".join(stakeholders),
                "stakeholder_ids": [assoc.stakeholder_id for assoc in p.stakeholder_associations],
                "created_at": str(p.created_at) if p.created_at else None,
                "updated_at": str(p.updated_at) if p.updated_at else None,
                "entity_type": "project",
                "suggest": {"input": [p.title] + stakeholders + ([p.sector] if p.sector else [])}
            }
            project_docs.append(doc)

            if EMBEDDING_ENABLED:
                text = f"{p.title} {p.description or ''} {p.sector or ''} {p.ai_technology or ''}"
                emb = generate_embedding(text)
                if emb:
                    store_embedding("project", p.id, emb, {
                        "title": p.title, "country": country_name, "sector": p.sector
                    })

        stakeholders_list = db.query(Stakeholder).all()
        stakeholder_docs = []
        for s in stakeholders_list:
            doc = {
                "id": s.id, "name": s.name or "", "type": s.type or "",
                "country": s.country or "", "country_id": s.country_id,
                "city": s.city or "", "description": s.description or "",
                "expertise": s.description or "", "website": s.website or "",
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
                "id": r.id, "title": r.title or "", "description": r.description or "",
                "type": r.type or "", "category": r.category or "", "country": "",
                "tags": [r.type or "", r.category or ""],
                "language": r.language or "", "author": r.author or "",
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

        if ELASTICSEARCH_ENABLED:
            b1 = bulk_index(INDEX_PROJECTS, project_docs)
            b2 = bulk_index(INDEX_STAKEHOLDERS, stakeholder_docs)
            b3 = bulk_index(INDEX_RESOURCES, resource_docs)
            logger.info(f"ES indexed: projects={b1}, stakeholders={b2}, resources={b3}")

        logger.info(f"DB records: projects={len(project_docs)}, stakeholders={len(stakeholder_docs)}, resources={len(resource_docs)}")

        if EMBEDDING_ENABLED:
            logger.info(f"Vector store entries: {len(VECTOR_STORE)}")

        logger.info("Sync completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    sync_all()
