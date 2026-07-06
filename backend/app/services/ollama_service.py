import os
import logging
import httpx
from typing import Optional, List

logger = logging.getLogger(__name__)

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
LLM_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

OLLAMA_AVAILABLE = False


def check_ollama():
    global OLLAMA_AVAILABLE
    try:
        resp = httpx.get(f"{OLLAMA_API_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            logger.info(f"Ollama available. Models: {models}")
            OLLAMA_AVAILABLE = True
            return True
    except Exception as e:
        logger.warning(f"Ollama not available: {e}")
    OLLAMA_AVAILABLE = False
    return False


def generate_embedding(text: str) -> Optional[List[float]]:
    if not OLLAMA_AVAILABLE:
        check_ollama()
    if not OLLAMA_AVAILABLE:
        return None
    try:
        resp = httpx.post(
            f"{OLLAMA_API_URL}/api/embeddings",
            json={"model": EMBEDDING_MODEL, "prompt": text},
            timeout=30
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("embedding")
        logger.error(f"Ollama embedding error: {resp.status_code} {resp.text}")
        return None
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return None


def generate_embeddings_batch(texts: List[str]) -> Optional[List[List[float]]]:
    return [generate_embedding(t) for t in texts]


def ask_llm(prompt: str, system_prompt: str = None, format_json: bool = False) -> Optional[str]:
    if not OLLAMA_AVAILABLE:
        check_ollama()
    if not OLLAMA_AVAILABLE:
        return None
    try:
        payload = {
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False,
        }
        if system_prompt:
            payload["system"] = system_prompt
        if format_json:
            payload["format"] = "json"

        resp = httpx.post(
            f"{OLLAMA_API_URL}/api/generate",
            json=payload,
            timeout=60
        )
        if resp.status_code == 200:
            return resp.json().get("response", "").strip()
        logger.error(f"Ollama LLM error: {resp.status_code} {resp.text}")
        return None
    except Exception as e:
        logger.error(f"Failed to query Ollama LLM: {e}")
        return None
