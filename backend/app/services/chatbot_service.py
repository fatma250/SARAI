import os
import re
import json
import httpx
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.country import Country
from app.services.embedding_service import generate_embedding, search_by_vector
from app.services.ollama_service import ask_llm

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_MODEL   = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = (
    "You are SARAI, an AI assistant for the Arab AI Repository, a platform that tracks "
    "AI projects, stakeholders, and initiatives across 22 Arab nations. "
    "Answer clearly and concisely using the provided database results. "
    "Use bullet points for lists. Be friendly, professional and brief (max 5 sentences). "
    "If no results exist, say so politely and suggest alternative queries. "
    "Always reply in the same language the user used in their question "
    "(French, English or Arabic) — never switch language on your own."
)

# ─── LLM router ──────────────────────────────────────────────────────────────
# The model itself decides what the user wants and extracts the parameters,
# in one JSON call — instead of a hand-maintained cascade of keyword lists
# that has to be patched for every new typo, phrasing or country someone
# tries. This is the same "let the LLM understand, don't out-guess it with
# regexes" approach as app.services.query_parser (used by /api/ai-search).

ROUTER_SYSTEM_PROMPT = """You are the routing brain for SARAI, a platform that catalogs AI projects, stakeholders and resources across the 22 Arab League countries: Algeria, Bahrain, Comoros, Djibouti, Egypt, Iraq, Jordan, Kuwait, Lebanon, Libya, Mauritania, Morocco, Oman, Palestine, Qatar, Saudi Arabia, Somalia, Sudan, Syria, Tunisia, United Arab Emirates, Yemen.

Read the user's message and decide which ONE action fits best, then reply with ONLY a single JSON object — no markdown, no explanation, no extra text.

Fields to always include:
- "action": one of "search_projects", "search_stakeholders", "analytics", "semantic_search", "small_talk", "out_of_scope"
- "country": one of the 22 Arab League countries above, in English, or null. Recognize the country even if misspelled or written in French or Arabic (e.g. "marroc", "Maroc", "المغرب" all mean "Morocco").
- "sector": a sector such as Health, Education, Agriculture, Finance, Energy, Transportation, Security, Smart Cities, Climate, GovTech, Telecommunications — or null.
- "technology": an AI technology such as NLP, Computer Vision, Machine Learning, Deep Learning, LLMs, Robotics, Predictive Analytics — or null.
- "sdg": a Sustainable Development Goal number (1-17) as a string, or null.
- "stakeholder_type": one of "startup", "university", "ngo", "government", "company", "lab", or null.
- "analytics_subtype": "overview", "most_active_country", or "most_active_sector" — only meaningful when action is "analytics", else null.
- "lang": the language the user wrote in — "fr", "en", or "ar".
- "reply": ONLY used when action is "small_talk" or "out_of_scope", else null.
  - "small_talk": greetings, thanks, goodbyes, or anything unrelated to AI projects/stakeholders. Write a short, friendly reply yourself, in the user's language ("lang").
  - "out_of_scope": the user names a real country or region that is NOT one of the 22 Arab League countries above (e.g. France, USA, China, Germany). Write a short, polite reply yourself, in the user's language, explaining SARAI only covers the Arab region.

Use "search_projects"/"search_stakeholders" whenever a country/sector/technology/type is recognized. Use "semantic_search" when the question is clearly about AI initiatives but doesn't map to a specific filter (e.g. a thematic question like "projects fighting drought"). Use "analytics" for statistics questions.

Examples:
User: "bonjour"
{"action": "small_talk", "country": null, "sector": null, "technology": null, "sdg": null, "stakeholder_type": null, "analytics_subtype": null, "lang": "fr", "reply": "Bonjour ! Je suis l'assistant SARAI. Je peux vous aider à trouver des projets, des parties prenantes ou des statistiques sur l'écosystème d'IA de la région arabe. Que souhaitez-vous savoir ?"}

User: "donne moi les projet au marroc"
{"action": "search_projects", "country": "Morocco", "sector": null, "technology": null, "sdg": null, "stakeholder_type": null, "analytics_subtype": null, "lang": "fr", "reply": null}

User: "donne moi les projet en france"
{"action": "out_of_scope", "country": null, "sector": null, "technology": null, "sdg": null, "stakeholder_type": null, "analytics_subtype": null, "lang": "fr", "reply": "SARAI ne couvre que les pays de la Ligue arabe. La France n'entre pas dans son périmètre actuel — essayez plutôt un pays comme le Maroc ou l'Égypte."}

User: "which country has the most AI projects?"
{"action": "analytics", "country": null, "sector": null, "technology": null, "sdg": null, "stakeholder_type": null, "analytics_subtype": "most_active_country", "lang": "en", "reply": null}

User: "projects fighting drought"
{"action": "semantic_search", "country": null, "sector": null, "technology": null, "sdg": null, "stakeholder_type": null, "analytics_subtype": null, "lang": "en", "reply": null}

Respond with ONLY the JSON object."""

# Last-resort safety net, used only when Ollama itself can't be reached at
# all (so the router call above never returns anything to parse). Everything
# else — typos, language, greetings, out-of-scope countries — is handled by
# the LLM router, not by a hand-written list.
_FALLBACK_GREETING_WORDS = ['bonjour', 'salut', 'hello', 'hi', 'hey', 'merci', 'thanks', 'مرحبا', 'شكرا']
_FALLBACK_REPLIES = {
    'fr': "Bonjour ! Je suis l'assistant SARAI, mais je ne peux pas traiter votre demande pour le moment (le modèle local est indisponible). Réessayez dans un instant.",
    'en': "Hello! I'm the SARAI assistant, but I can't process your request right now (the local model is unavailable). Please try again shortly.",
}
FOLLOWUPS_BY_LANG = {
    'fr': ["Aperçu de la plateforme", "Pays le plus actif", "Principaux secteurs"],
    'en': ["Platform overview", "Most active country", "Top sectors"],
    'ar': ["نظرة عامة على المنصة", "الدولة الأكثر نشاطاً", "أهم القطاعات"],
}


def _extract_json(text: str) -> dict | None:
    text = text.strip()
    if text.startswith("```"):
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("{") and part.endswith("}"):
                text = part
                break
            if part.lower().startswith("json"):
                text = part[4:].strip()
                break
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                return None
    return None


def _fallback_route(question: str) -> dict:
    """Only reached when Ollama is completely unreachable, so route_question's
    own LLM call couldn't run. Degraded on purpose: no typo tolerance, no real
    language detection — just enough to avoid crashing until Ollama is back."""
    q = question.lower().strip()
    if len(q.split()) <= 5 and any(re.search(rf'\b{re.escape(w)}\b', q) for w in _FALLBACK_GREETING_WORDS):
        return {'action': 'small_talk', 'lang': 'en', 'reply': _FALLBACK_REPLIES['en']}
    return {
        'action': 'search_projects', 'country': None, 'sector': None,
        'technology': None, 'sdg': None, 'lang': 'en', 'reply': None,
    }


def route_question(question: str) -> dict:
    """Single LLM call that classifies the question and extracts its
    parameters in one shot — the LLM is the router, not a lookup table."""
    raw = ask_llm(prompt=question.strip(), system_prompt=ROUTER_SYSTEM_PROMPT, format_json=True)
    parsed = _extract_json(raw) if raw else None
    if isinstance(parsed, dict) and parsed.get('action'):
        return parsed
    return _fallback_route(question)


# ─── DB Queries ───────────────────────────────────────────────────────────────

def query_projects(db: Session, sector=None, technology=None, country=None, sdg=None, limit=8):
    query = db.query(Project).options(
        joinedload(Project.country)
    ).filter(Project.status.notin_(['pending', 'rejected']))

    if sector:
        query = query.filter(Project.sector.ilike(f'%{sector}%'))
    if technology:
        query = query.filter(Project.ai_technology.ilike(f'%{technology}%'))
    if country:
        query = query.join(Country, isouter=True).filter(
            func.lower(Country.name).contains(country.lower())
        )
    if sdg:
        query = query.filter(Project.sdg_alignment.ilike(f'%SDG {sdg}%'))

    return query.order_by(Project.submitted_at.desc()).limit(limit).all()


def query_stakeholders(db: Session, stakeholder_type=None, country=None, limit=8):
    query = db.query(Stakeholder)

    if stakeholder_type:
        query = query.filter(func.lower(Stakeholder.type) == stakeholder_type.lower())
    if country:
        query = query.filter(func.lower(Stakeholder.country).contains(country.lower()))

    return query.order_by(Stakeholder.name).limit(limit).all()


def query_analytics(db: Session, subtype: str):
    if subtype == 'most_active_country':
        rows = (
            db.query(Country.name, func.count(Project.id).label('count'))
            .join(Project, Project.country_id == Country.id)
            .filter(Project.status.notin_(['pending', 'rejected']))
            .group_by(Country.name)
            .order_by(func.count(Project.id).desc())
            .limit(5).all()
        )
        return [{'country': r[0], 'project_count': r[1]} for r in rows]

    if subtype == 'most_active_sector':
        rows = (
            db.query(Project.sector, func.count(Project.id).label('count'))
            .filter(Project.status.notin_(['pending', 'rejected']), Project.sector.isnot(None))
            .group_by(Project.sector)
            .order_by(func.count(Project.id).desc())
            .limit(5).all()
        )
        return [{'sector': r[0], 'project_count': r[1]} for r in rows]

    # overview
    total_projects = db.query(Project).filter(Project.status.notin_(['pending', 'rejected'])).count()
    total_stakeholders = db.query(Stakeholder).count()
    total_countries = (
        db.query(Country.id)
        .join(Project, Project.country_id == Country.id)
        .filter(Project.status.notin_(['pending', 'rejected']))
        .distinct().count()
    )
    sector_counts = (
        db.query(Project.sector, func.count(Project.id).label('count'))
        .filter(Project.status.notin_(['pending', 'rejected']), Project.sector.isnot(None))
        .group_by(Project.sector)
        .order_by(func.count(Project.id).desc())
        .limit(5).all()
    )
    tech_counts = (
        db.query(Project.ai_technology, func.count(Project.id).label('count'))
        .filter(Project.status.notin_(['pending', 'rejected']), Project.ai_technology.isnot(None))
        .group_by(Project.ai_technology)
        .order_by(func.count(Project.id).desc())
        .limit(3).all()
    )
    return {
        'total_projects': total_projects,
        'total_stakeholders': total_stakeholders,
        'total_countries': total_countries,
        'top_sectors': [{'sector': r[0], 'count': r[1]} for r in sector_counts],
        'top_technologies': [{'technology': r[0], 'count': r[1]} for r in tech_counts],
    }


def query_semantic(db: Session, question: str, limit: int = 6) -> list[dict]:
    """RAG lookup: embeds the free-form question and retrieves the closest
    projects/stakeholders/resources by cosine distance in pgvector. Returns
    [] when semantic search is disabled, Ollama is unreachable, or pgvector
    isn't available — the caller then falls back to the template response."""
    emb = generate_embedding(question)
    if not emb:
        return []
    return search_by_vector(db, emb, entity_type=None, limit=limit)


# ─── Follow-up suggestion generator ─────────────────────────────────────────

def get_followup_suggestions(action: str, route: dict, data) -> list[str]:
    """Return 3 contextual follow-up suggestion chips."""
    suggestions = []
    country = route.get('country') or ''
    sector  = route.get('sector') or ''
    tech    = route.get('technology') or ''

    if action == 'search_projects':
        if country:
            suggestions.append(f"Show stakeholders in {country.title()}")
        if sector:
            suggestions.append(f"{sector.title()} projects stats")
        if tech:
            suggestions.append(f"More {tech} projects")
        if not suggestions:
            suggestions = ["Show overview stats", "Most active country", "Top sectors"]
        suggestions.append("Platform overview")

    elif action == 'search_stakeholders':
        if country:
            suggestions.append(f"AI projects in {country.title()}")
        suggestions += ["Show universities", "Government organizations", "Platform overview"]

    elif action == 'analytics':
        suggestions = [
            "Show health sector projects",
            "Most active country",
            "Find NLP projects",
            "Show startups in Morocco",
        ]

    elif action == 'semantic_search':
        suggestions = ["Platform overview", "Most active country", "Top sectors"]

    elif action in ('small_talk', 'out_of_scope'):
        suggestions = FOLLOWUPS_BY_LANG.get(route.get('lang'), FOLLOWUPS_BY_LANG['en'])

    return suggestions[:3]


# ─── Template-based Response ─────────────────────────────────────────────────

def generate_template_response(action: str, route: dict, data) -> str:
    if action in ('small_talk', 'out_of_scope'):
        return route.get('reply') or _FALLBACK_REPLIES.get(route.get('lang'), _FALLBACK_REPLIES['en'])

    if action == 'search_projects':
        if not data:
            filters = [v for k, v in route.items()
                       if k in ('sector', 'technology', 'country', 'sdg') and v]
            desc = ", ".join(str(f) for f in filters) if filters else "your query"
            return f"No projects found for {desc}.\nTry broadening your search or check a different country or sector."

        lines = []
        for p in data:
            country_name = p.country.name if hasattr(p, 'country') and p.country else None
            meta = " · ".join(filter(None, [p.sector, p.ai_technology, country_name]))
            lines.append(f"• **{p.title}**" + (f"\n  {meta}" if meta else ""))

        filters = [str(v).title() for k, v in route.items()
                   if k in ('sector', 'technology', 'country') and v]
        header = f"Found **{len(data)}** AI project(s)"
        header += (f" — {', '.join(filters)}" if filters else "") + ":\n\n"
        return header + "\n".join(lines)

    if action == 'search_stakeholders':
        if not data:
            filters = [v for k, v in route.items() if k in ('stakeholder_type', 'country') and v]
            desc = ", ".join(str(f) for f in filters) if filters else "your query"
            return f"No organizations found for {desc}.\nTry a different type or country."

        lines = []
        for s in data:
            meta = " · ".join(filter(None, [s.type and s.type.title(), s.country]))
            lines.append(f"• **{s.name}**" + (f"  ({meta})" if meta else ""))

        header = f"Found **{len(data)}** organization(s):\n\n"
        return header + "\n".join(lines)

    if action == 'analytics':
        subtype = route.get('analytics_subtype') or 'overview'

        if subtype == 'most_active_country':
            if not data:
                return "No country data available yet."
            lines = [f"{i+1}. **{r['country']}** — {r['project_count']} project(s)" for i, r in enumerate(data)]
            return "🏆 Most active Arab countries by AI projects:\n\n" + "\n".join(lines)

        if subtype == 'most_active_sector':
            if not data:
                return "No sector data available yet."
            lines = [f"{i+1}. **{r['sector']}** — {r['project_count']} project(s)" for i, r in enumerate(data)]
            return "📊 Top sectors by number of AI projects:\n\n" + "\n".join(lines)

        if isinstance(data, dict):
            sectors = ", ".join(f"{s['sector']} ({s['count']})" for s in data.get('top_sectors', [])) or "N/A"
            techs   = ", ".join(f"{t['technology']} ({t['count']})" for t in data.get('top_technologies', [])) or "N/A"
            return (
                f"📈 **SARAI Platform Overview**\n\n"
                f"• **{data['total_projects']}** AI projects tracked\n"
                f"• **{data['total_stakeholders']}** organizations registered\n"
                f"• **{data['total_countries']}** Arab countries represented\n"
                f"• Top sectors: {sectors}\n"
                f"• Top technologies: {techs}"
            )

    if action == 'semantic_search':
        if not data:
            return (
                "I could not find anything closely related to your question. "
                "Try rephrasing it, or ask about a specific country, sector or technology."
            )
        lines = []
        for r in data:
            etype = (r.get('entity_type') or 'item').capitalize()
            name = r.get('title') or r.get('name') or 'Untitled'
            desc = (r.get('description') or '').strip()
            if len(desc) > 150:
                desc = desc[:150].rsplit(' ', 1)[0] + "…"
            lines.append(f"• **{name}** ({etype})" + (f"\n  {desc}" if desc else ""))
        return "Here is what I found related to your question:\n\n" + "\n".join(lines)

    return "I could not find data for that query. Try asking about projects, sectors, countries, or organizations."


# ─── Prompt formatter (for Ollama) ───────────────────────────────────────────

def format_results_for_prompt(action: str, data) -> str:
    if not data or (isinstance(data, list) and not data):
        return "No matching records found in the database."

    if action == 'search_projects':
        lines = []
        for p in data:
            desc = (p.description or '').strip()
            if len(desc) > 200:
                desc = desc[:200].rsplit(' ', 1)[0] + "…"
            lines.append(
                f"- {p.title} | Sector: {p.sector or 'N/A'} | Tech: {p.ai_technology or 'N/A'} | "
                f"Country: {p.country.name if hasattr(p, 'country') and p.country else 'N/A'}"
                + (f" | About: {desc}" if desc else "")
            )
        return f"{len(data)} project(s):\n" + "\n".join(lines)

    if action == 'search_stakeholders':
        lines = []
        for s in data:
            desc = (s.description or '').strip()
            if len(desc) > 200:
                desc = desc[:200].rsplit(' ', 1)[0] + "…"
            lines.append(
                f"- {s.name} | Type: {s.type} | Country: {s.country or 'N/A'}"
                + (f" | About: {desc}" if desc else "")
            )
        return f"{len(data)} stakeholder(s):\n" + "\n".join(lines)

    if action == 'semantic_search':
        lines = []
        for r in data:
            etype = r.get('entity_type', 'item')
            name = r.get('title') or r.get('name') or 'Untitled'
            desc = (r.get('description') or '').strip()
            if len(desc) > 200:
                desc = desc[:200].rsplit(' ', 1)[0] + "…"
            lines.append(f"- [{etype}] {name}" + (f" | About: {desc}" if desc else ""))
        return f"{len(data)} record(s) found by semantic search:\n" + "\n".join(lines)

    if action == 'analytics':
        if isinstance(data, list):
            if data and 'country' in data[0]:
                return "Countries:\n" + "\n".join(f"{r['country']}: {r['project_count']}" for r in data)
            if data and 'sector' in data[0]:
                return "Sectors:\n" + "\n".join(f"{r['sector']}: {r['project_count']}" for r in data)
        if isinstance(data, dict):
            sectors = ", ".join(f"{s['sector']}({s['count']})" for s in data.get('top_sectors', []))
            return (
                f"Projects: {data['total_projects']}, Orgs: {data['total_stakeholders']}, "
                f"Countries: {data['total_countries']}, Sectors: {sectors}"
            )
    return str(data)


# ─── Ollama call ──────────────────────────────────────────────────────────────

async def call_ollama(question: str, context: str, history: list[dict] | None = None) -> str | None:
    history = history or []
    history_text = ""
    if history:
        history_text = "\n".join(
            f"{'User' if m['role'] == 'user' else 'SARAI'}: {m['text']}"
            for m in history[-6:]
        )
        history_text = f"\nConversation so far:\n{history_text}\n"

    prompt = (
        f"{SYSTEM_PROMPT}{history_text}\n\n"
        f"User question: {question}\n\n"
        f"Database results:\n{context}\n\n"
        f"Answer concisely:"
    )
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(
                f"{OLLAMA_API_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            )
            if resp.status_code == 200:
                text = resp.json().get("response", "").strip()
                return text or None
            return None
    except Exception:
        return None
