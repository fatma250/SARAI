from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, case
from typing import Optional
import logging
import time
import re

from app.database import get_db
from app.services.query_parser import parse_query
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.resource import Resource
from app.models.country import Country

router = APIRouter()
logger = logging.getLogger(__name__)

REGIONS = {
    "North Africa": ["Algeria", "Morocco", "Tunisia", "Libya", "Mauritania", "Egypt"],
    "Gulf":         ["Saudi Arabia", "United Arab Emirates", "Qatar", "Oman", "Bahrain", "Kuwait"],
    "Levant":       ["Jordan", "Lebanon", "Palestine", "Syria", "Iraq"],
    "East Africa":  ["Sudan", "Somalia", "Djibouti", "Comoros"],
}


def _split_keywords(text: str) -> list[str]:
    """Split into meaningful words (≥2 chars), preserving the full string as fallback."""
    words = [w for w in re.split(r"\s+", text.strip()) if len(w) >= 2]
    return words or [text.strip()]


def _apply_country_filter(query, model, p_country: str):
    if p_country in REGIONS:
        return query.filter(model.ilike(f"%{r}%") if isinstance(model, str) else model.in_(REGIONS[p_country]))
    return query.filter(model.ilike(f"%{p_country}%"))


@router.get("/api/ai-search")
def ai_search(
    q: str = Query(..., description="Natural language search query"),
    entity: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    technology: Optional[str] = Query(None),
    sort_by: str = Query("relevance", description="relevance | date | name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Intelligent search: parses natural language, applies multi-keyword AND logic,
    supports real pagination and sort, returns per-type totals.
    """
    start_time = time.time()
    offset = (page - 1) * page_size

    # 1. Parse query (LLM or regex fallback)
    parsed = parse_query(q)
    if entity:     parsed["entity"]     = entity
    if country:    parsed["country"]    = country
    if sector:     parsed["sector"]     = sector
    if technology: parsed["technology"] = technology

    target_entity = parsed.get("entity")
    keywords_str  = str(parsed.get("keywords") or q).strip()
    keywords      = _split_keywords(keywords_str)
    p_country     = parsed.get("country")
    p_sector      = parsed.get("sector")
    p_tech        = parsed.get("technology")

    out = {
        "projects": [], "stakeholders": [], "resources": [],
        "total": 0,
        "total_projects": 0, "total_stakeholders": 0, "total_resources": 0,
        "parsed": parsed,
        "time_ms": 0,
        "page": page, "page_size": page_size,
    }

    # ── PROJECTS ────────────────────────────────────────────────────────────
    if not target_entity or target_entity == "project":
        pq = db.query(Project).filter(Project.status.notin_(["pending", "rejected"]))

        if p_country:
            countries_in_region = REGIONS.get(p_country, [])
            if countries_in_region:
                pq = pq.join(Country, Project.country_id == Country.id, isouter=True)\
                       .filter(Country.name.in_(countries_in_region))
            else:
                pq = pq.join(Country, Project.country_id == Country.id, isouter=True)\
                       .filter(Country.name.ilike(f"%{p_country}%"))

        if p_sector:
            pq = pq.filter(Project.sector.ilike(f"%{p_sector}%"))
        if p_tech:
            pq = pq.filter(Project.ai_technology.ilike(f"%{p_tech}%"))

        # AND logic: every keyword must match at least one field
        for kw in keywords:
            pq = pq.filter(or_(
                Project.title.ilike(f"%{kw}%"),
                Project.description.ilike(f"%{kw}%"),
                Project.sector.ilike(f"%{kw}%"),
                Project.ai_technology.ilike(f"%{kw}%"),
            ))

        total_projects = pq.count()

        if sort_by == "date":
            pq = pq.order_by(Project.start_date.desc())
        elif sort_by == "name":
            pq = pq.order_by(Project.title.asc())
        else:
            # Relevance: title matches first, then newest
            if keywords:
                first = keywords[0]
                pq = pq.order_by(
                    case((Project.title.ilike(f"%{first}%"), 0), else_=1),
                    Project.created_at.desc(),
                )
            else:
                pq = pq.order_by(Project.created_at.desc())

        projects = pq.offset(offset).limit(page_size).all()
        out["total_projects"] = total_projects
        out["projects"] = [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "sector": p.sector,
                "ai_technology": p.ai_technology,
                "country": p.country.name if p.country else "Regional",
                "status": p.status,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "sdg_alignment": p.sdg_alignment,
            }
            for p in projects
        ]

    # ── STAKEHOLDERS ────────────────────────────────────────────────────────
    if not target_entity or target_entity == "stakeholder":
        sq = db.query(Stakeholder)

        if p_country:
            countries_in_region = REGIONS.get(p_country, [])
            if countries_in_region:
                sq = sq.filter(Stakeholder.country.in_(countries_in_region))
            else:
                sq = sq.filter(Stakeholder.country.ilike(f"%{p_country}%"))

        for kw in keywords:
            sq = sq.filter(or_(
                Stakeholder.name.ilike(f"%{kw}%"),
                Stakeholder.description.ilike(f"%{kw}%"),
                Stakeholder.type.ilike(f"%{kw}%"),
                Stakeholder.country.ilike(f"%{kw}%"),
            ))

        total_stakeholders = sq.count()

        if sort_by == "name":
            sq = sq.order_by(Stakeholder.name.asc())
        elif sort_by == "date":
            sq = sq.order_by(Stakeholder.created_at.desc())
        else:
            if keywords:
                first = keywords[0]
                sq = sq.order_by(
                    case((Stakeholder.name.ilike(f"%{first}%"), 0), else_=1),
                    Stakeholder.name.asc(),
                )
            else:
                sq = sq.order_by(Stakeholder.name.asc())

        stakeholders = sq.offset(offset).limit(page_size).all()
        out["total_stakeholders"] = total_stakeholders
        out["stakeholders"] = [
            {
                "id": s.id,
                "name": s.name,
                "type": s.type,
                "country": s.country,
                "description": s.description,
                "website": s.website,
            }
            for s in stakeholders
        ]

    # ── RESOURCES ───────────────────────────────────────────────────────────
    if not target_entity or target_entity == "resource":
        rq = db.query(Resource)

        if p_sector:
            rq = rq.filter(Resource.category.ilike(f"%{p_sector}%"))

        for kw in keywords:
            rq = rq.filter(or_(
                Resource.title.ilike(f"%{kw}%"),
                Resource.description.ilike(f"%{kw}%"),
                Resource.type.ilike(f"%{kw}%"),
                Resource.category.ilike(f"%{kw}%"),
            ))

        total_resources = rq.count()

        if sort_by == "date":
            rq = rq.order_by(Resource.publication_date.desc())
        elif sort_by == "name":
            rq = rq.order_by(Resource.title.asc())
        else:
            if keywords:
                first = keywords[0]
                rq = rq.order_by(
                    case((Resource.title.ilike(f"%{first}%"), 0), else_=1),
                    Resource.title.asc(),
                )
            else:
                rq = rq.order_by(Resource.title.asc())

        resources = rq.offset(offset).limit(page_size).all()
        out["total_resources"] = total_resources
        out["resources"] = [
            {
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "type": r.type,
                "category": r.category,
                "file_url": r.file_url,
                "author": getattr(r, "author", None),
                "publication_date": (
                    r.publication_date.isoformat()
                    if getattr(r, "publication_date", None) else None
                ),
            }
            for r in resources
        ]

    out["total"] = out["total_projects"] + out["total_stakeholders"] + out["total_resources"]
    out["time_ms"] = int((time.time() - start_time) * 1000)
    return out
