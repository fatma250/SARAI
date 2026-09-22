"""
Embedding generation & pgvector-backed semantic search.

Single embedding pipeline for the whole platform: Ollama's `nomic-embed-text`
(768-dim, matches VECTOR_DIMENSION in app.database.vector) is used both to
index rows (embed_and_store, scripts/generate_embeddings.py) and to embed
incoming queries (search_by_vector) — index and query never drift onto two
different embedding spaces.

Disabled by default (EMBEDDING_ENABLED=false). When disabled, or when Ollama
is unreachable, every function here is a safe no-op and callers fall back to
the classic ILIKE search (see app.services.search_service.hybrid_search).
"""
import os
import logging
from typing import Any, Dict, List, Optional

from app.database.vector import VECTOR_DIMENSION, cosine_distance, is_pgvector_available
from app.services import ollama_service

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
EMBEDDING_ENABLED = os.getenv("EMBEDDING_ENABLED", "false").lower() == "true"
EMBEDDING_DIMENSION = VECTOR_DIMENSION


def generate_embedding(text: str) -> Optional[List[float]]:
    """Generate one embedding via Ollama. Returns None if disabled, Ollama is
    unreachable, or the model's output dimension doesn't match the pgvector
    column — callers always have a working ILIKE fallback so this is never fatal."""
    if not EMBEDDING_ENABLED or not text or not text.strip():
        return None
    emb = ollama_service.generate_embedding(text)
    if emb is None:
        return None
    if len(emb) != EMBEDDING_DIMENSION:
        logger.warning(
            f"Embedding dimension mismatch: model '{EMBEDDING_MODEL}' returned "
            f"{len(emb)} dims, expected {EMBEDDING_DIMENSION}. Discarding."
        )
        return None
    return emb


def generate_embeddings_batch(texts: List[str]) -> List[Optional[List[float]]]:
    return [generate_embedding(t) for t in texts]


# ─── Text builders ──────────────────────────────────────────────────────────
# Shared by live auto-indexing (embed_and_store) and the offline reindex
# script (scripts/generate_embeddings.py) so both ever produce the same text
# for the same row.

def text_for_project(p) -> str:
    parts = [p.title or "", p.description or "", p.sector or "", p.ai_technology or ""]
    if getattr(p, "country", None):
        parts.append(p.country.name or "")
    return ". ".join(part for part in parts if part)


def text_for_stakeholder(s) -> str:
    return ". ".join(filter(None, [s.name or "", s.description or "", s.type or "", s.country or ""]))


def text_for_resource(r) -> str:
    return ". ".join(filter(None, [r.title or "", r.description or "", r.type or "", r.category or ""]))


_TEXT_BUILDERS = {
    "project": text_for_project,
    "stakeholder": text_for_stakeholder,
    "resource": text_for_resource,
}


def _entity_model(entity_type: str):
    from app.models.project import Project
    from app.models.resource import Resource
    from app.models.stakeholder import Stakeholder
    return {"project": Project, "stakeholder": Stakeholder, "resource": Resource}[entity_type]


def embed_and_store(entity_type: str, entity_id: int) -> None:
    """
    Background-task entrypoint: (re)computes and persists the embedding for a
    single row, straight into its pgvector column. Opens its own DB session
    since it runs after the triggering request's session has already closed.

    No-op if semantic search is disabled or Ollama is unreachable — the row
    just keeps embedding=NULL and stays invisible to vector search while
    remaining fully searchable via the classic ILIKE path.
    """
    if not EMBEDDING_ENABLED:
        return
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        model = _entity_model(entity_type)
        text_fn = _TEXT_BUILDERS[entity_type]
        obj = db.get(model, entity_id)
        if not obj:
            return
        text = text_fn(obj)
        if not text.strip():
            return
        emb = generate_embedding(text)
        if emb:
            obj.embedding = emb
            db.commit()
    except Exception:
        logger.exception(f"embed_and_store failed for {entity_type}:{entity_id}")
        db.rollback()
    finally:
        db.close()


# ─── DB-side vector search ──────────────────────────────────────────────────
# Queries pgvector directly (ORDER BY embedding <=> query LIMIT n) instead of
# the old in-memory dict, so results survive across requests/workers and
# don't need a manual "/api/search/sync" pass to exist.

def search_by_vector(
    db, query_embedding: List[float], entity_type: Optional[str] = None, limit: int = 20
) -> List[Dict[str, Any]]:
    """Semantic search across projects/stakeholders/resources via pgvector
    cosine distance. Returns [] when pgvector isn't available (e.g. SQLite dev
    mode) — the caller's classic search still runs regardless."""
    if not is_pgvector_available():
        return []

    from app.models.project import Project
    from app.models.resource import Resource
    from app.models.stakeholder import Stakeholder

    scored: List[tuple] = []

    def _run(etype: str, model, extra_filter=None):
        distance = cosine_distance(model.embedding, query_embedding)
        if distance is None:
            return
        q = db.query(model, distance.label("_distance")).filter(model.embedding.isnot(None))
        if extra_filter is not None:
            q = q.filter(extra_filter)
        for obj, dist in q.order_by(distance).limit(limit).all():
            scored.append((etype, obj, max(0.0, 1.0 - float(dist))))

    if entity_type in (None, "project"):
        _run("project", Project, Project.status.notin_(["pending", "rejected"]))
    if entity_type in (None, "stakeholder"):
        _run("stakeholder", Stakeholder)
    if entity_type in (None, "resource"):
        _run("resource", Resource)

    scored.sort(key=lambda r: r[2], reverse=True)

    out: List[Dict[str, Any]] = []
    for etype, obj, score in scored[:limit]:
        if etype == "project":
            out.append({
                "id": obj.id, "title": obj.title, "description": obj.description,
                "sector": obj.sector, "ai_technology": obj.ai_technology,
                "country": obj.country.name if obj.country else None,
                "status": obj.status, "entity_type": "project", "_score": score,
            })
        elif etype == "stakeholder":
            out.append({
                "id": obj.id, "name": obj.name, "description": obj.description,
                "type": obj.type, "country": obj.country,
                "entity_type": "stakeholder", "_score": score,
            })
        else:
            out.append({
                "id": obj.id, "title": obj.title, "description": obj.description,
                "type": obj.type, "category": obj.category,
                "entity_type": "resource", "_score": score,
            })
    return out


def count_indexed() -> Dict[str, int]:
    """Rows per entity type that currently have a stored embedding — used to
    report reindexing progress instead of the old in-memory dict's len()."""
    from app.database import SessionLocal
    from app.models.project import Project
    from app.models.resource import Resource
    from app.models.stakeholder import Stakeholder

    db = SessionLocal()
    try:
        return {
            "projects": db.query(Project).filter(Project.embedding.isnot(None)).count(),
            "stakeholders": db.query(Stakeholder).filter(Stakeholder.embedding.isnot(None)).count(),
            "resources": db.query(Resource).filter(Resource.embedding.isnot(None)).count(),
        }
    finally:
        db.close()
