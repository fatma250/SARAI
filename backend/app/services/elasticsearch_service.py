import os
import logging
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

ELASTICSEARCH_HOST = os.getenv("ELASTICSEARCH_HOST", "http://localhost:9200")
ELASTICSEARCH_ENABLED = os.getenv("ELASTICSEARCH_ENABLED", "false").lower() == "true"

INDEX_PROJECTS = "sarai_projects"
INDEX_STAKEHOLDERS = "sarai_stakeholders"
INDEX_RESOURCES = "sarai_resources"

INDEX_SETTINGS = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "analysis": {
            "analyzer": {
                "sarai_analyzer": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": ["lowercase", "asciifolding", "trim"]
                }
            }
        }
    }
}

INDEX_MAPPINGS = {
    INDEX_PROJECTS: {
        "properties": {
            "id": {"type": "integer"},
            "title": {
                "type": "text",
                "analyzer": "sarai_analyzer",
                "fields": {"keyword": {"type": "keyword"}}
            },
            "description": {"type": "text", "analyzer": "sarai_analyzer"},
            "summary": {"type": "text", "analyzer": "sarai_analyzer"},
            "sector": {"type": "keyword"},
            "ai_technology": {"type": "keyword"},
            "sdg_alignment": {"type": "keyword"},
            "country": {"type": "keyword"},
            "country_id": {"type": "integer"},
            "status": {"type": "keyword"},
            "start_date": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "end_date": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "stakeholders": {"type": "text", "analyzer": "sarai_analyzer"},
            "stakeholder_ids": {"type": "integer"},
            "created_at": {"type": "date", "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "updated_at": {"type": "date", "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "entity_type": {"type": "keyword"},
            "suggest": {
                "type": "completion",
                "analyzer": "sarai_analyzer"
            }
        }
    },
    INDEX_STAKEHOLDERS: {
        "properties": {
            "id": {"type": "integer"},
            "name": {
                "type": "text",
                "analyzer": "sarai_analyzer",
                "fields": {"keyword": {"type": "keyword"}}
            },
            "type": {"type": "keyword"},
            "country": {"type": "keyword"},
            "country_id": {"type": "integer"},
            "city": {"type": "keyword"},
            "description": {"type": "text", "analyzer": "sarai_analyzer"},
            "expertise": {"type": "text", "analyzer": "sarai_analyzer"},
            "website": {"type": "keyword"},
            "created_at": {"type": "date", "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "updated_at": {"type": "date", "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "entity_type": {"type": "keyword"},
            "suggest": {
                "type": "completion",
                "analyzer": "sarai_analyzer"
            }
        }
    },
    INDEX_RESOURCES: {
        "properties": {
            "id": {"type": "integer"},
            "title": {
                "type": "text",
                "analyzer": "sarai_analyzer",
                "fields": {"keyword": {"type": "keyword"}}
            },
            "description": {"type": "text", "analyzer": "sarai_analyzer"},
            "type": {"type": "keyword"},
            "category": {"type": "keyword"},
            "country": {"type": "keyword"},
            "tags": {"type": "keyword"},
            "language": {"type": "keyword"},
            "author": {"type": "text", "analyzer": "sarai_analyzer"},
            "publisher": {"type": "text", "analyzer": "sarai_analyzer"},
            "publication_date": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "created_at": {"type": "date", "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "updated_at": {"type": "date", "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"},
            "entity_type": {"type": "keyword"},
            "suggest": {
                "type": "completion",
                "analyzer": "sarai_analyzer"
            }
        }
    }
}


def get_es_client():
    if not ELASTICSEARCH_ENABLED:
        return None
    try:
        from elasticsearch import Elasticsearch
        client = Elasticsearch(ELASTICSEARCH_HOST)
        if client.ping():
            logger.info(f"Connected to Elasticsearch at {ELASTICSEARCH_HOST}")
            return client
        else:
            logger.warning("Elasticsearch ping failed")
            return None
    except Exception as e:
        logger.warning(f"Elasticsearch unavailable: {e}")
        return None


def create_indices():
    client = get_es_client()
    if not client:
        logger.warning("Elasticsearch not available, skipping index creation")
        return False
    try:
        for index_name, mapping in INDEX_MAPPINGS.items():
            if not client.indices.exists(index=index_name):
                body = {**INDEX_SETTINGS, "mappings": mapping}
                client.indices.create(index=index_name, body=body)
                logger.info(f"Created index: {index_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to create indices: {e}")
        return False


def index_document(index: str, doc_id: str, body: dict):
    client = get_es_client()
    if not client:
        return None
    try:
        return client.index(index=index, id=doc_id, body=body, refresh="wait_for")
    except Exception as e:
        logger.error(f"Failed to index document {doc_id} in {index}: {e}")
        return None


def delete_document(index: str, doc_id: str):
    client = get_es_client()
    if not client:
        return None
    try:
        return client.delete(index=index, id=doc_id, ignore=[404])
    except Exception as e:
        logger.error(f"Failed to delete document {doc_id} from {index}: {e}")
        return None


def bulk_index(index: str, documents: List[dict]):
    client = get_es_client()
    if not client:
        return None
    try:
        from elasticsearch.helpers import bulk
        actions = []
        for doc in documents:
            doc_id = doc.get("id")
            actions.append({
                "_index": index,
                "_id": str(doc_id),
                "_source": doc
            })
        success, errors = bulk(client, actions, refresh=True)
        logger.info(f"Bulk indexed {success} documents into {index} ({errors} errors)")
        return success
    except Exception as e:
        logger.error(f"Bulk indexing failed for {index}: {e}")
        return None


def search_index(
    index: str,
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    size: int = 20,
    from_: int = 0
) -> dict:
    client = get_es_client()
    if not client:
        return {"hits": {"hits": [], "total": {"value": 0}}}
    try:
        must_conditions = []

        if query:
            must_conditions.append({
                "multi_match": {
                    "query": query,
                    "fields": ["title^3", "description^2", "summary^2", "name^3", "sector", "country", "ai_technology", "stakeholders", "expertise", "tags", "author", "publisher"],
                    "type": "best_fields",
                    "fuzziness": "AUTO",
                    "operator": "or",
                    "minimum_should_match": "70%"
                }
            })

        filter_conditions = []
        if filters:
            for field, value in filters.items():
                if value is None or value == "" or value == []:
                    continue
                if field == "date_from":
                    filter_conditions.append({"range": {"start_date": {"gte": value}}})
                elif field == "date_to":
                    filter_conditions.append({"range": {"end_date": {"lte": value}}})
                elif field == "entity_type":
                    if isinstance(value, list):
                        filter_conditions.append({"terms": {"entity_type": value}})
                    else:
                        filter_conditions.append({"term": {"entity_type": value}})
                elif isinstance(value, list):
                    filter_conditions.append({"terms": {field: value}})
                else:
                    filter_conditions.append({"term": {field: value}})

        body = {
            "query": {
                "bool": {
                    "must": must_conditions if must_conditions else [{"match_all": {}}],
                    "filter": filter_conditions
                }
            },
            "highlight": {
                "fields": {
                    "title": {"number_of_fragments": 0},
                    "description": {"fragment_size": 150, "number_of_fragments": 2},
                    "name": {"number_of_fragments": 0},
                    "summary": {"fragment_size": 150, "number_of_fragments": 2}
                },
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            },
            "size": size,
            "from": from_
        }

        resp = client.search(index=index, body=body)
        return resp
    except Exception as e:
        logger.error(f"Search failed for index {index}: {e}")
        return {"hits": {"hits": [], "total": {"value": 0}}}


def search_across_indices(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    indices: Optional[List[str]] = None,
    size: int = 20,
    from_: int = 0
) -> List[dict]:
    if indices is None:
        indices = [INDEX_PROJECTS, INDEX_STAKEHOLDERS, INDEX_RESOURCES]

    all_results = []
    for index in indices:
        resp = search_index(index, query, filters, size, from_)
        for hit in resp.get("hits", {}).get("hits", []):
            source = hit["_source"]
            source["_score"] = hit["_score"]
            source["_index"] = index
            if "highlight" in hit:
                source["_highlight"] = hit["highlight"]
            all_results.append(source)

    all_results.sort(key=lambda x: x.get("_score", 0), reverse=True)
    return all_results[:size]


def get_suggestions(prefix: str, size: int = 8) -> List[dict]:
    client = get_es_client()
    if not client:
        return []
    try:
        suggestions = []
        for index in [INDEX_PROJECTS, INDEX_STAKEHOLDERS, INDEX_RESOURCES]:
            body = {
                "suggest": {
                    "completion_suggest": {
                        "prefix": prefix,
                        "completion": {
                            "field": "suggest",
                            "size": size,
                            "fuzzy": {"fuzziness": 2}
                        }
                    }
                }
            }
            resp = client.search(index=index, body=body)
            for option in resp.get("suggest", {}).get("completion_suggest", [{}])[0].get("options", []):
                source = option.get("_source", {})
                suggestions.append({
                    "text": option.get("text", ""),
                    "entity_type": source.get("entity_type"),
                    "id": source.get("id"),
                    "score": option.get("score", 0)
                })

        suggestions.sort(key=lambda x: x.get("score", 0), reverse=True)
        return suggestions[:size]
    except Exception as e:
        logger.error(f"Suggestions failed: {e}")
        return []
