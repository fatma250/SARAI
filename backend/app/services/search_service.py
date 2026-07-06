import re
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.resource import Resource
from app.models.country import Country

from app.services.elasticsearch_service import (
    search_across_indices, get_suggestions as es_get_suggestions,
    ELASTICSEARCH_ENABLED
)
from app.services.embedding_service import (
    generate_embedding, search_vector, EMBEDDING_ENABLED
)

logger = logging.getLogger(__name__)


COUNTRY_NAMES = [
    "algeria", "bahrain", "comoros", "djibouti", "egypt", "iraq", "jordan",
    "kuwait", "lebanon", "libya", "mauritania", "morocco", "oman", "palestine",
    "qatar", "saudi arabia", "saudi", "somalia", "sudan", "syria", "tunisia",
    "united arab emirates", "uae", "yemen"
]

SECTOR_KEYWORDS = [
    "healthcare", "health", "education", "finance", "banking", "agriculture",
    "transport", "logistics", "energy", "smart city", "smart cities", "government",
    "cybersecurity", "security", "retail", "manufacturing", "media",
    "environment", "climate", "legal", "hr", "human resources",
    "entrepreneuriat", "entrepreneurship", "startup", "innovation"
]

TECHNOLOGY_KEYWORDS = [
    "computer vision", "vision", "image recognition", "nlp", "natural language",
    "machine learning", "deep learning", "reinforcement learning",
    "robotics", "autonomous", "chatbot", "conversational ai", "recommender",
    "predictive analytics", "generative ai", "llm", "large language model",
    "speech recognition", "text analytics", "data mining", "pattern recognition"
]

ENTITY_TYPES = {
    "project": "project",
    "projects": "project",
    "stakeholder": "stakeholder",
    "stakeholders": "stakeholder",
    "startup": "stakeholder",
    "startups": "stakeholder",
    "resource": "resource",
    "resources": "resource",
    "dataset": "resource",
    "datasets": "resource",
    "policy": "resource",
    "document": "resource",
    "documents": "resource",
    "report": "resource",
    "reports": "resource"
}


class ParsedQuery:
    def __init__(self):
        self.country: Optional[str] = None
        self.sector: Optional[str] = None
        self.technology: Optional[str] = None
        self.date_from: Optional[str] = None
        self.date_to: Optional[str] = None
        self.entity_type: Optional[str] = None
        self.clean_query: str = ""

    def to_filters(self) -> dict:
        filters = {}
        if self.country:
            filters["country"] = self.country
        if self.sector:
            filters["sector"] = self.sector
        if self.technology:
            filters["ai_technology"] = self.technology
        if self.date_from:
            filters["date_from"] = self.date_from
        if self.date_to:
            filters["date_to"] = self.date_to
        if self.entity_type:
            filters["entity_type"] = self.entity_type
        return filters


def parse_query(query: str) -> ParsedQuery:
    parsed = ParsedQuery()
    query_lower = query.lower().strip()
    tokens = query_lower.split()

    for token in tokens:
        clean_token = token.strip(",.:;!?")
        if clean_token in ENTITY_TYPES:
            parsed.entity_type = ENTITY_TYPES[clean_token]

    for country in COUNTRY_NAMES:
        if country in query_lower:
            if country == "uae" or country == "saudi":
                parsed.country = "United Arab Emirates" if country == "uae" else "Saudi Arabia"
            else:
                parsed.country = country.title()
            break

    for sector in SECTOR_KEYWORDS:
        if sector in query_lower:
            if "city" in sector:
                parsed.sector = "Smart City"
            elif "security" in sector or "cyber" in sector:
                parsed.sector = "Cybersecurity"
            elif "health" in sector:
                parsed.sector = "Healthcare"
            else:
                parsed.sector = sector.title()
            break

    for tech in TECHNOLOGY_KEYWORDS:
        if tech in query_lower:
            if "vision" in tech:
                parsed.technology = "Computer Vision"
            elif "nlp" in tech or "natural language" in tech:
                parsed.technology = "NLP"
            elif "machine learning" in tech or "deep learning" in tech:
                parsed.technology = "Machine Learning"
            elif "llm" in tech or "large language model" in tech:
                parsed.technology = "LLM"
            elif "generative" in tech:
                parsed.technology = "Generative AI"
            elif "chatbot" in tech:
                parsed.technology = "Chatbot"
            else:
                parsed.technology = tech.title()
            break

    date_pattern = re.findall(r'(?:after|before|since|from|in)\s+(\d{4})', query_lower)
    if date_pattern:
        year = date_pattern[0]
        if "after" in query_lower or "since" in query_lower or "from" in query_lower:
            parsed.date_from = f"{year}-01-01"
        elif "before" in query_lower:
            parsed.date_to = f"{year}-12-31"

    for pattern in [r'projects?\s+(?:after|since|from)\s+(\d{4})', r'(\d{4})\s+(?:projects?)']:
        m = re.search(pattern, query_lower)
        if m:
            parsed.date_from = f"{m.group(1)}-01-01"

    parsed.clean_query = query_lower
    for country in COUNTRY_NAMES:
        parsed.clean_query = parsed.clean_query.replace(country, "")
    for sector in SECTOR_KEYWORDS:
        parsed.clean_query = parsed.clean_query.replace(sector, "")
    for tech in TECHNOLOGY_KEYWORDS:
        parsed.clean_query = parsed.clean_query.replace(tech, "")
    for etype in ENTITY_TYPES:
        parsed.clean_query = parsed.clean_query.replace(etype, "")
    parsed.clean_query = re.sub(r'\b(after|before|since|from|in|for|the|and|or|of|to|with)\b', '', parsed.clean_query)
    parsed.clean_query = re.sub(r'\d{4}', '', parsed.clean_query)
    parsed.clean_query = re.sub(r'\s+', ' ', parsed.clean_query).strip()

    return parsed


def search_db(
    query: str,
    db: Session,
    entity_type: Optional[str] = None,
    country: Optional[str] = None,
    sector: Optional[str] = None,
    ai_technology: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> Dict[str, Any]:
    results = {"projects": [], "stakeholders": [], "resources": [], "total": 0}
    query_lower = query.lower()

    if entity_type is None or entity_type == "project":
        q = db.query(Project).filter(Project.status.notin_(["pending", "rejected"]))
        if country:
            q = q.join(Country).filter(Country.name.ilike(f"%{country}%"))
        if sector:
            q = q.filter(Project.sector.ilike(f"%{sector}%"))
        if ai_technology:
            q = q.filter(Project.ai_technology.ilike(f"%{ai_technology}%"))
        if query:
            q = q.filter(
                (Project.title.ilike(f"%{query}%")) |
                (Project.description.ilike(f"%{query}%")) |
                (Project.sector.ilike(f"%{query}%")) |
                (Project.ai_technology.ilike(f"%{query}%"))
            )
        projects = q.order_by(Project.created_at.desc()).limit(limit).all()
        for p in projects:
            stakeholders = [s.stakeholder.name for s in p.stakeholder_associations if s.stakeholder]
            country_name = p.country.name if p.country else None
            results["projects"].append({
                "id": p.id, "title": p.title, "description": p.description,
                "sector": p.sector, "ai_technology": p.ai_technology, "country": country_name,
                "country_id": p.country_id, "status": p.status, "start_date": str(p.start_date) if p.start_date else None,
                "end_date": str(p.end_date) if p.end_date else None, "sdg_alignment": p.sdg_alignment,
                "stakeholders": stakeholders, "created_at": str(p.created_at) if p.created_at else None,
                "entity_type": "project", "_score": 1.0
            })

    if entity_type is None or entity_type == "stakeholder":
        q = db.query(Stakeholder)
        if country:
            q = q.filter(Stakeholder.country.ilike(f"%{country}%"))
        if query:
            q = q.filter(
                (Stakeholder.name.ilike(f"%{query}%")) |
                (Stakeholder.description.ilike(f"%{query}%"))
            )
        stakeholders = q.order_by(Stakeholder.created_at.desc()).limit(limit).all()
        for s in stakeholders:
            results["stakeholders"].append({
                "id": s.id, "name": s.name, "description": s.description,
                "type": s.type, "country": s.country, "country_id": s.country_id,
                "city": s.city, "website": s.website,
                "created_at": str(s.created_at) if s.created_at else None,
                "entity_type": "stakeholder", "_score": 1.0
            })

    if entity_type is None or entity_type == "resource":
        q = db.query(Resource)
        if query:
            q = q.filter(
                (Resource.title.ilike(f"%{query}%")) |
                (Resource.description.ilike(f"%{query}%"))
            )
        resources = q.order_by(Resource.created_at.desc()).limit(limit).all()
        for r in resources:
            results["resources"].append({
                "id": r.id, "title": r.title, "description": r.description,
                "type": r.type, "category": r.category, "language": r.language,
                "author": r.author, "publisher": r.publisher, "publication_date": str(r.publication_date) if r.publication_date else None,
                "created_at": str(r.created_at) if r.created_at else None,
                "entity_type": "resource", "_score": 1.0
            })

    results["total"] = len(results["projects"]) + len(results["stakeholders"]) + len(results["resources"])
    return results


def hybrid_search(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    db: Session = None,
    entity_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    parsed = parse_query(query)
    combined_filters = {**parsed.to_filters(), **(filters or {})}

    if entity_type:
        combined_filters["entity_type"] = entity_type

    es_results = []
    embedding_results = []

    if ELASTICSEARCH_ENABLED:
        try:
            es_results = search_across_indices(
                query=parsed.clean_query or query,
                filters=combined_filters,
                size=page_size * 2,
                from_=(page - 1) * page_size
            )
        except Exception as e:
            logger.error(f"ES search error: {e}")

    if EMBEDDING_ENABLED and query.strip():
        try:
            query_embedding = generate_embedding(query)
            if query_embedding:
                embedding_results = search_vector(query_embedding, top_k=page_size)
        except Exception as e:
            logger.error(f"Embedding search error: {e}")

    db_results = search_db(
        query=query,
        db=db,
        entity_type=entity_type or combined_filters.get("entity_type"),
        country=combined_filters.get("country"),
        sector=combined_filters.get("sector"),
        ai_technology=combined_filters.get("ai_technology"),
        skip=(page - 1) * page_size,
        limit=page_size
    )

    seen_ids = set()
    merged = []

    for r in es_results:
        key = (r.get("entity_type"), r.get("id"))
        if key not in seen_ids:
            seen_ids.add(key)
            merged.append(r)

    for r in db_results.get("projects", []):
        key = ("project", r["id"])
        if key not in seen_ids:
            seen_ids.add(key)
            r["_score"] = 0.5
            merged.append(r)

    for r in db_results.get("stakeholders", []):
        key = ("stakeholder", r["id"])
        if key not in seen_ids:
            seen_ids.add(key)
            r["_score"] = 0.5
            merged.append(r)

    for r in db_results.get("resources", []):
        key = ("resource", r["id"])
        if key not in seen_ids:
            seen_ids.add(key)
            r["_score"] = 0.5
            merged.append(r)

    merged.sort(key=lambda x: x.get("_score", 0), reverse=True)

    total = len(merged)
    paged = merged[(page - 1) * page_size: page * page_size]

    return {
        "results": paged,
        "total": total,
        "page": page,
        "page_size": page_size,
        "parsed_query": {
            "country": parsed.country,
            "sector": parsed.sector,
            "technology": parsed.technology,
            "date_from": parsed.date_from,
            "date_to": parsed.date_to,
            "entity_type": parsed.entity_type,
            "clean_query": parsed.clean_query
        },
        "facets": {
            "projects": db_results["projects"],
            "stakeholders": db_results["stakeholders"],
            "resources": db_results["resources"]
        }
    }


def get_autocomplete_suggestions(prefix: str, limit: int = 8) -> List[dict]:
    if ELASTICSEARCH_ENABLED:
        try:
            return es_get_suggestions(prefix, limit)
        except Exception as e:
            logger.error(f"ES suggest error: {e}")

    return []


def get_filter_options(db: Session) -> Dict[str, List[str]]:
    countries_q = db.query(Country.name).order_by(Country.name).all()
    countries = [c[0] for c in countries_q if c[0]]

    sectors_q = db.query(Project.sector).filter(
        Project.sector.isnot(None), Project.sector != ""
    ).distinct().order_by(Project.sector).all()
    sectors = sorted(set(s[0] for s in sectors_q if s[0]))

    tech_q = db.query(Project.ai_technology).filter(
        Project.ai_technology.isnot(None), Project.ai_technology != ""
    ).distinct().order_by(Project.ai_technology).all()
    technologies = sorted(set(t[0] for t in tech_q if t[0]))

    stakeholder_types = db.query(Stakeholder.type).distinct().order_by(Stakeholder.type).all()
    stypes = sorted(set(s[0] for s in stakeholder_types if s[0]))

    resource_types = db.query(Resource.type).distinct().order_by(Resource.type).all()
    rtypes = sorted(set(r[0] for r in resource_types if r[0]))

    return {
        "countries": countries,
        "sectors": sectors,
        "technologies": technologies,
        "stakeholder_types": stypes,
        "resource_types": rtypes
    }
