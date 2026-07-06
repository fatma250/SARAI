"""
Generate embeddings for all entities using Ollama nomic-embed-text.
Stores embeddings in PostgreSQL via pgvector (or SQLite fallback).

Usage:
    python -m scripts.generate_embeddings

Requires:
    - Ollama running with nomic-embed-text model pulled
    - PostgreSQL with pgvector extension (or SQLite fallback)
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

import logging
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

from app.database import SessionLocal, using_postgresql
from app.database.vector import is_pgvector_available, VectorColumn
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.resource import Resource
from app.services.ollama_service import generate_embedding, check_ollama

BATCH_SIZE = 5


def enable_pgvector():
    if not using_postgresql:
        logger.info("SQLite mode - skipping pgvector setup")
        return True
    try:
        from app.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
        logger.info("pgvector extension enabled")
        return True
    except Exception as e:
        logger.warning(f"Could not enable pgvector: {e}")
        return False


def generate_and_store():
    if not check_ollama():
        logger.error("Ollama is not available. Start it with: ollama serve")
        logger.error("Then pull the model: ollama pull nomic-embed-text")
        sys.exit(1)

    enable_pgvector()

    db = SessionLocal()
    try:
        _generate_project_embeddings(db)
        _generate_stakeholder_embeddings(db)
        _generate_resource_embeddings(db)
        logger.info("All embeddings generated successfully!")
    finally:
        db.close()


def _text_for_project(p):
    parts = [
        p.title or "",
        p.description or "",
        p.sector or "",
        p.ai_technology or "",
    ]
    if p.country:
        parts.append(p.country.name or "")
    return ". ".join(parts)


def _text_for_stakeholder(s):
    return ". ".join(filter(None, [
        s.name or "",
        s.description or "",
        s.type or "",
        s.country or "",
    ]))


def _text_for_resource(r):
    return ". ".join(filter(None, [
        r.title or "",
        r.description or "",
        r.type or "",
        r.category or "",
    ]))


def _generate_project_embeddings(db):
    projects = db.query(Project).filter(Project.status.notin_(['pending', 'rejected'])).all()
    logger.info(f"Generating embeddings for {len(projects)} projects...")
    count = 0
    for i, p in enumerate(projects):
        if p.embedding is not None:
            continue
        text = _text_for_project(p)
        if not text.strip():
            continue
        emb = generate_embedding(text)
        if emb:
            p.embedding = emb
            count += 1
        if (i + 1) % BATCH_SIZE == 0:
            db.commit()
            logger.info(f"  Progress: {i+1}/{len(projects)} projects")
    db.commit()
    logger.info(f"  Generated {count} project embeddings")


def _generate_stakeholder_embeddings(db):
    stakeholders = db.query(Stakeholder).all()
    logger.info(f"Generating embeddings for {len(stakeholders)} stakeholders...")
    count = 0
    for i, s in enumerate(stakeholders):
        if s.embedding is not None:
            continue
        text = _text_for_stakeholder(s)
        if not text.strip():
            continue
        emb = generate_embedding(text)
        if emb:
            s.embedding = emb
            count += 1
        if (i + 1) % BATCH_SIZE == 0:
            db.commit()
            logger.info(f"  Progress: {i+1}/{len(stakeholders)} stakeholders")
    db.commit()
    logger.info(f"  Generated {count} stakeholder embeddings")


def _generate_resource_embeddings(db):
    resources = db.query(Resource).all()
    logger.info(f"Generating embeddings for {len(resources)} resources...")
    count = 0
    for i, r in enumerate(resources):
        if r.embedding is not None:
            continue
        text = _text_for_resource(r)
        if not text.strip():
            continue
        emb = generate_embedding(text)
        if emb:
            r.embedding = emb
            count += 1
        if (i + 1) % BATCH_SIZE == 0:
            db.commit()
            logger.info(f"  Progress: {i+1}/{len(resources)} resources")
    db.commit()
    logger.info(f"  Generated {count} resource embeddings")


def rebuild_all():
    """Delete all embeddings and regenerate."""
    if not check_ollama():
        logger.error("Ollama not available")
        return
    enable_pgvector()
    db = SessionLocal()
    try:
        db.query(Project).update({"embedding": None})
        db.query(Stakeholder).update({"embedding": None})
        db.query(Resource).update({"embedding": None})
        db.commit()
        logger.info("Cleared all embeddings")

        _generate_project_embeddings(db)
        _generate_stakeholder_embeddings(db)
        _generate_resource_embeddings(db)
        logger.info("All embeddings regenerated!")
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate AI embeddings for search")
    parser.add_argument("--rebuild", action="store_true", help="Rebuild all embeddings from scratch")
    args = parser.parse_args()
    if args.rebuild:
        rebuild_all()
    else:
        generate_and_store()
