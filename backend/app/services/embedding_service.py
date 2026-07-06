import os
import logging
import numpy as np
from typing import List, Optional

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBEDDING_ENABLED = os.getenv("EMBEDDING_ENABLED", "false").lower() == "true"
EMBEDDING_DIMENSION = 384

_model = None
_encoder = None


def get_encoder():
    global _encoder
    if _encoder is not None:
        return _encoder
    if not EMBEDDING_ENABLED:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer(EMBEDDING_MODEL)
        logger.info(f"Loaded embedding model: {EMBEDDING_MODEL}")
        return _encoder
    except Exception as e:
        logger.warning(f"Failed to load embedding model: {e}")
        try:
            import openai
            openai_client = openai.OpenAI(
                api_key=os.getenv("OPENAI_API_KEY", ""),
                base_url=os.getenv("OPENAI_BASE_URL", os.getenv("OLLAMA_API_URL", "http://localhost:11434") + "/v1")
            )
            _encoder = openai_client
            logger.info("Using OpenAI-compatible API for embeddings")
            return _encoder
        except Exception as e2:
            logger.warning(f"Failed to load any embedding provider: {e2}")
            return None


def generate_embedding(text: str) -> Optional[List[float]]:
    encoder = get_encoder()
    if encoder is None:
        return None
    try:
        if hasattr(encoder, "encode"):
            emb = encoder.encode(text, normalize_embeddings=True)
            return emb.tolist()
        else:
            resp = encoder.embeddings.create(input=[text], model=EMBEDDING_MODEL)
            return resp.data[0].embedding
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return None


def generate_embeddings_batch(texts: List[str]) -> Optional[List[List[float]]]:
    encoder = get_encoder()
    if encoder is None:
        return None
    try:
        if hasattr(encoder, "encode"):
            embs = encoder.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            return embs.tolist()
        else:
            resp = encoder.embeddings.create(input=texts, model=EMBEDDING_MODEL)
            return [d.embedding for d in resp.data]
    except Exception as e:
        logger.error(f"Failed to generate batch embeddings: {e}")
        return None


def cosine_similarity(a: List[float], b: List[float]) -> float:
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


VECTOR_STORE = {}

def store_embedding(entity_type: str, entity_id: int, embedding: List[float], metadata: dict):
    key = f"{entity_type}:{entity_id}"
    VECTOR_STORE[key] = {
        "embedding": embedding,
        "metadata": metadata,
        "entity_type": entity_type,
        "entity_id": entity_id
    }


def clear_vector_store():
    VECTOR_STORE.clear()


def search_vector(query_embedding: List[float], top_k: int = 20) -> List[dict]:
    if not VECTOR_STORE:
        return []
    results = []
    for key, data in VECTOR_STORE.items():
        score = cosine_similarity(query_embedding, data["embedding"])
        results.append({
            "entity_type": data["entity_type"],
            "entity_id": data["entity_id"],
            "metadata": data["metadata"],
            "_score": score
        })
    results.sort(key=lambda x: x["_score"], reverse=True)
    return results[:top_k]
