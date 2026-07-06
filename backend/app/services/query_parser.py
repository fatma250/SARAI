"""
AI Query Parser using Ollama LLM.
Transforms natural language queries into structured search filters.
"""
import json
import logging
import re
from typing import Optional, Dict, Any

from app.services.ollama_service import ask_llm

logger = logging.getLogger(__name__)

QUERY_PARSER_SYSTEM_PROMPT = """You are an advanced AI query parser for an Arab Regional AI Initiatives Stocktaking platform.
Your task is to transform natural language queries into structured search filters.
Return ONLY a valid JSON object with NO markdown tags or extra text.

Available fields:
- "entity": one of "project", "stakeholder", "resource", or null for any
- "country": specific country name or region (Tunisia, Algeria, Morocco, Egypt, UAE, Saudi Arabia, Qatar, Oman, Bahrain, Kuwait, Lebanon, Jordan, Iraq, Syria, Palestine, Yemen, Libya, Mauritania, Sudan, Somalia, Djibouti, Comoros, "North Africa", "Gulf", "Levant")
- "sector": high-level sector (Agriculture, Finance, Healthcare, Education, Smart City, Cybersecurity, Energy, Transport, Government, Environment)
- "technology": AI technology (Computer Vision, NLP, Machine Learning, Deep Learning, Robotics, LLM, Generative AI, Predictive Analytics, Chatbot)
- "date_from": start year (e.g., "2022")
- "date_to": end year (e.g., "2024")
- "keywords": specific search terms not captured by other filters

Examples:
Q: "Tell me about agricultural AI projects in Egypt"
{"entity": "project", "country": "Egypt", "sector": "Agriculture", "technology": null, "date_from": null, "date_to": null, "keywords": "agricultural"}

Q: "Who are the AI startups in the Gulf?"
{"entity": "stakeholder", "country": "Gulf", "sector": null, "technology": null, "date_from": null, "date_to": null, "keywords": "startups"}

Q: "Latest LLM research from 2023"
{"entity": "resource", "country": null, "sector": null, "technology": "LLM", "date_from": "2023", "date_to": null, "keywords": "latest research"}

Q: "North Africa initiatives in computer vision"
{"entity": "project", "country": "North Africa", "sector": null, "technology": "Computer Vision", "date_from": null, "date_to": null, "keywords": ""}

IMPORTANT: Always prioritize accuracy. If a field is not explicitly mentioned or clearly implied, leave it as null."""

FALLBACK_COUNTRIES = [
    "tunisia", "algeria", "morocco", "egypt", "uae", "united arab emirates",
    "saudi arabia", "saudi", "qatar", "oman", "bahrain", "kuwait",
    "lebanon", "jordan", "iraq", "syria", "palestine", "yemen",
    "libya", "mauritania", "sudan", "somalia", "djibouti", "comoros"
]

FALLBACK_SECTORS = [
    "health", "healthcare", "education", "edutech", "agriculture", "agritech",
    "finance", "fintech", "transport", "logistics", "energy", "smart city",
    "smart cities", "government", "govtech", "cybersecurity", "security",
    "retail", "manufacturing", "media", "environment", "climate", "legal",
    "entrepreneuriat", "entrepreneurship", "startup", "innovation"
]

FALLBACK_TECHNOLOGIES = [
    "computer vision", "vision", "image recognition", "nlp", "natural language",
    "machine learning", "deep learning", "reinforcement learning",
    "robotics", "autonomous", "chatbot", "conversational ai",
    "generative ai", "llm", "large language model", "predictive analytics",
    "speech recognition", "data mining", "pattern recognition"
]

ENTITY_KEYWORDS = {
    "project": ["project", "projects", "initiative", "initiatives"],
    "stakeholder": ["stakeholder", "stakeholders", "organization", "organizations", "who", "startup", "company", "university", "lab"],
    "resource": ["resource", "resources", "dataset", "datasets", "document", "documents", "paper", "research"]
}

COUNTRY_MAP = {
    "uae": "United Arab Emirates", "united arab emirates": "United Arab Emirates",
    "saudi": "Saudi Arabia", "ksa": "Saudi Arabia", "kingdom of saudi arabia": "Saudi Arabia",
    "north africa": "North Africa", "maghreb": "North Africa",
    "gulf": "Gulf", "gcc": "Gulf",
    "levant": "Levant",
    "egyptian": "Egypt", "tunisian": "Tunisia", "moroccan": "Morocco", "algerian": "Algeria",
    "emirati": "United Arab Emirates", "qatari": "Qatar", "kuwaiti": "Kuwait"
}

SECTOR_MAP = {
    "health": "Healthcare", "healthcare": "Healthcare", "medical": "Healthcare", "medicine": "Healthcare",
    "education": "Education", "edutech": "Education", "learning": "Education", "school": "Education", "university": "Education",
    "agriculture": "Agriculture", "agritech": "Agriculture", "farming": "Agriculture", "crop": "Agriculture", "water": "Agriculture",
    "finance": "Finance", "fintech": "Finance", "banking": "Finance", "investment": "Finance", "economy": "Finance",
    "smart city": "Smart City", "smart cities": "Smart City", "urban": "Smart City",
    "cybersecurity": "Cybersecurity", "security": "Cybersecurity", "defense": "Cybersecurity",
    "environment": "Environment", "climate": "Environment", "sustainability": "Environment", "green": "Environment",
    "energy": "Energy", "power": "Energy", "solar": "Energy", "oil": "Energy", "gas": "Energy",
    "transport": "Transport", "transportation": "Transport", "logistics": "Transport", "mobility": "Transport", "traffic": "Transport",
    "government": "Government", "govtech": "Government", "public": "Government", "administration": "Government",
    "entrepreneuriat": "Entrepreneuriat", "entrepreneurship": "Entrepreneuriat", "startup": "Entrepreneuriat", "startups": "Entrepreneuriat", "innovation": "Entrepreneuriat"
}

TECH_MAP = {
    "computer vision": "Computer Vision", "vision": "Computer Vision", "image": "Computer Vision", "video": "Computer Vision", "recognition": "Computer Vision",
    "nlp": "NLP", "natural language": "NLP", "text": "NLP", "speech": "NLP", "voice": "NLP", "language": "NLP",
    "machine learning": "Machine Learning", "ml": "Machine Learning",
    "deep learning": "Deep Learning", "neural": "Deep Learning",
    "llm": "LLM", "large language model": "LLM", "gpt": "LLM", "llama": "LLM",
    "generative ai": "Generative AI", "genai": "Generative AI", "diffusion": "Generative AI",
    "chatbot": "Chatbot", "conversational": "Chatbot", "assistant": "Chatbot",
    "robotics": "Robotics", "robot": "Robotics", "automation": "Robotics",
    "autonomous": "Autonomous Systems", "self-driving": "Autonomous Systems", "driverless": "Autonomous Systems",
    "predictive analytics": "Predictive Analytics", "forecasting": "Predictive Analytics", "prediction": "Predictive Analytics"
}


def parse_query(query: str) -> Dict[str, Any]:
    if not query or not query.strip():
        return {"entity": None, "country": None, "sector": None,
                "technology": None, "date_from": None, "date_to": None,
                "keywords": ""}

    llm_result = None
    try:
        llm_response = ask_llm(
            prompt=query.strip(),
            system_prompt=QUERY_PARSER_SYSTEM_PROMPT,
            format_json=True
        )
        if llm_response:
            llm_result = _parse_llm_json(llm_response)
    except Exception as e:
        logger.warning(f"LLM query parsing failed: {e}")

    if llm_result:
        logger.info(f"LLM parsed: {llm_result}")
        # Normalize result keys to ensure entity exists
        if "entity_type" in llm_result and "entity" not in llm_result:
            llm_result["entity"] = llm_result["entity_type"]
        return llm_result

    return _fallback_parse(query)


def _parse_llm_json(text: str) -> Optional[dict]:
    text = text.strip()
    if text.startswith("```"):
        # Handle cases with or without "json" label
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("{") and part.endswith("}"):
                text = part
                break
            if part.startswith("json"):
                text = part[4:].strip()
                break
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            # Slower but robust regex match for JSON
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group())
        except (json.JSONDecodeError, AttributeError):
            pass
    return None


def _fallback_parse(query: str) -> Dict[str, Any]:
    q = query.lower().strip()
    parsed = {
        "entity": None, "country": None, "sector": None,
        "technology": None, "date_from": None, "date_to": None,
        "keywords": q
    }

    # Better entity detection
    for entity_type, keywords in ENTITY_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            parsed["entity"] = entity_type
            break

    # Better country and region detection
    for country_raw, country_name in COUNTRY_MAP.items():
        if country_raw in q:
            parsed["country"] = country_name
            break
    
    if not parsed["country"]:
        for c in FALLBACK_COUNTRIES:
            if re.search(rf'\b{c}\b', q):
                parsed["country"] = c.title()
                break

    # Better sector detection
    for sector_raw, sector_name in SECTOR_MAP.items():
        if re.search(rf'\b{sector_raw}\b', q):
            parsed["sector"] = sector_name
            break

    # Better technology detection
    for tech_raw, tech_name in TECH_MAP.items():
        if tech_raw in q:
            parsed["technology"] = tech_name
            break

    # Enhanced date extraction
    date_match = re.search(r'(?:after|since|from|>)\s*(\d{4})', q)
    if date_match:
        parsed["date_from"] = date_match.group(1)
    date_match = re.search(r'(?:before|until|<\s*)\s*(\d{4})', q)
    if date_match:
        parsed["date_to"] = date_match.group(1)

    return parsed
