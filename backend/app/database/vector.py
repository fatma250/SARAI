"""
Vector column factory for pgvector with SQLite fallback.
"""
from sqlalchemy import Text, JSON
from app.database import using_postgresql

VECTOR_DIMENSION = 768  # must match the embedding model in app.services.embedding_service


def VectorColumn(*args, **kwargs):
    """Real pgvector column under PostgreSQL (enables HNSW/IVFFlat indexing and
    in-database cosine search); falls back to JSON/Text where pgvector isn't
    available so the app keeps running (dev on SQLite, or the extension missing)."""
    if using_postgresql:
        try:
            from pgvector.sqlalchemy import Vector
            return Vector(VECTOR_DIMENSION)
        except ImportError:
            return JSON()
    return Text()


def is_pgvector_available():
    if not using_postgresql:
        return False
    try:
        from pgvector.sqlalchemy import Vector
        _ = Vector(1)
        return True
    except ImportError:
        return False


def cosine_distance(embedding_column, query_embedding):
    if using_postgresql:
        try:
            from pgvector.sqlalchemy import Vector
            return embedding_column.cosine_distance(query_embedding)
        except ImportError:
            pass
    return None


def max_inner_product(embedding_column, query_embedding):
    if using_postgresql:
        try:
            from pgvector.sqlalchemy import Vector
            return embedding_column.max_inner_product(query_embedding)
        except ImportError:
            pass
    return None
