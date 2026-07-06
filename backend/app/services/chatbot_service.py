import os
import httpx
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.country import Country

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_MODEL   = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = (
    "You are SARAI, an AI assistant for the Arab AI Repository, a platform that tracks "
    "AI projects, stakeholders, and initiatives across 22 Arab nations. "
    "Answer clearly and concisely using the provided database results. "
    "Use bullet points for lists. Be friendly, professional and brief (max 5 sentences). "
    "If no results exist, say so politely and suggest alternative queries."
)

# ─── Aliases & Normalization ──────────────────────────────────────────────────

COUNTRY_ALIASES = {
    'tunisie': 'tunisia', 'maroc': 'morocco', 'algérie': 'algeria', 'algerie': 'algeria',
    'egypte': 'egypt', 'égypte': 'egypt', 'libye': 'libya', 'soudan': 'sudan',
    'mauritanie': 'mauritania', 'liban': 'lebanon', 'jordanie': 'jordan',
    'syrie': 'syria', 'irak': 'iraq', 'yémen': 'yemen', 'yemen': 'yemen',
    'emirats': 'uae', 'émirats': 'uae', 'emirats arabes unis': 'uae',
    'arabie saoudite': 'saudi arabia', 'koweït': 'kuwait', 'koweit': 'kuwait',
    'djibouti': 'djibouti', 'comores': 'comoros', 'somalie': 'somalia',
    'palestine': 'palestine', 'bahreïn': 'bahrain', 'bahrain': 'bahrain',
    'oman': 'oman', 'qatar': 'qatar',
}

SECTOR_ALIASES = {
    # French
    'santé': 'health', 'éducation': 'education', 'education': 'education',
    'agriculture': 'agriculture', 'finance': 'finance', 'transport': 'transportation',
    'transports': 'transportation', 'énergie': 'energy', 'energie': 'energy',
    'sécurité': 'security', 'securite': 'security', 'environnement': 'environment',
    'villes intelligentes': 'smart cities', 'télécommunications': 'telecommunications',
    # English
    'health': 'health', 'education': 'education', 'fintech': 'finance',
    'transportation': 'transportation', 'energy': 'energy', 'security': 'security',
    'environment': 'environment', 'smart cities': 'smart cities', 'govtech': 'govtech',
    'agritech': 'agriculture', 'climate': 'climate',
    'entrepreneuriat': 'entrepreneuriat', 'entrepreneurship': 'entrepreneuriat',
    'startup': 'entrepreneuriat', 'startups': 'entrepreneuriat', 'innovation': 'entrepreneuriat',
}

TECH_ALIASES = {
    'nlp': 'nlp', 'natural language': 'nlp', 'traitement du langage': 'nlp',
    'computer vision': 'computer vision', 'vision par ordinateur': 'computer vision',
    'robotics': 'robotics', 'robotique': 'robotics',
    'machine learning': 'machine learning', 'apprentissage automatique': 'machine learning',
    'deep learning': 'deep learning', 'apprentissage profond': 'deep learning',
    'predictive analytics': 'predictive analytics', 'analyse prédictive': 'predictive analytics',
    'llm': 'llms', 'large language': 'llms', 'gpt': 'llms',
    'speech recognition': 'speech recognition', 'reconnaissance vocale': 'speech recognition',
}

TYPE_ALIASES = {
    'startup': ['startup', 'startups', 'start-up'],
    'university': ['university', 'universities', 'université', 'universités'],
    'ngo': ['ngo', 'ngos', 'non-profit', 'ong', 'association'],
    'government': ['government', 'governmental', 'gouvernement', 'ministère', 'ministry', 'public sector'],
    'company': ['company', 'companies', 'corporation', 'entreprise', 'société'],
    'lab': ['lab', 'research lab', 'laboratory', 'laboratoire', 'research center', 'centre de recherche'],
}


def _normalize(q: str, aliases: dict) -> str | None:
    for alias, canonical in sorted(aliases.items(), key=lambda x: -len(x[0])):
        if alias in q:
            return canonical
    return None


# ─── Intent Detection ────────────────────────────────────────────────────────

def detect_intent(question: str) -> dict:
    q = question.lower().strip()

    # Normalize country aliases
    found_country = _normalize(q, COUNTRY_ALIASES)
    if not found_country:
        known = [
            'tunisia', 'algeria', 'morocco', 'egypt', 'uae', 'saudi arabia',
            'qatar', 'oman', 'bahrain', 'kuwait', 'lebanon', 'jordan', 'iraq',
            'syria', 'palestine', 'yemen', 'libya', 'mauritania', 'sudan',
            'djibouti', 'comoros', 'somalia',
        ]
        found_country = next((c for c in known if c in q), None)

    found_sector = _normalize(q, SECTOR_ALIASES)
    found_tech   = _normalize(q, TECH_ALIASES)
    found_type   = next(
        (k for k, v in TYPE_ALIASES.items() if any(x in q for x in v)), None
    )

    # SDG detection
    import re
    sdg_match = re.search(r'sdg\s*(\d+)|objectif\s*(\d+)|goal\s*(\d+)', q)
    sdg_num = None
    if sdg_match:
        sdg_num = next(g for g in sdg_match.groups() if g is not None)

    # Analytics triggers
    analytics_kw_country = ['most active country', 'top country', 'leading country', 'which country', 'pays le plus actif', 'quel pays']
    analytics_kw_sector  = ['most projects', 'top sector', 'leading sector', 'which sector', 'secteur principal', 'quel secteur']
    analytics_kw_overview = ['overview', 'summary', 'stats', 'statistics', 'how many', 'total', 'combien', 'résumé', 'aperçu', 'bilan']

    if any(w in q for w in analytics_kw_country):
        return {'intent': 'analytics_query', 'subtype': 'most_active_country'}
    if any(w in q for w in analytics_kw_sector):
        return {'intent': 'analytics_query', 'subtype': 'most_active_sector'}
    if any(w in q for w in analytics_kw_overview):
        return {'intent': 'analytics_query', 'subtype': 'overview'}

    # SDG search
    if sdg_num:
        return {'intent': 'search_projects', 'sdg': sdg_num, 'sector': None, 'technology': None, 'country': found_country}

    # Project triggers
    if found_tech and found_country:
        return {'intent': 'search_projects', 'sector': None, 'technology': found_tech, 'country': found_country, 'sdg': None}
    if found_tech:
        return {'intent': 'search_projects', 'sector': None, 'technology': found_tech, 'country': None, 'sdg': None}
    if found_sector and found_country:
        return {'intent': 'search_projects', 'sector': found_sector, 'technology': None, 'country': found_country, 'sdg': None}
    if found_sector:
        return {'intent': 'search_projects', 'sector': found_sector, 'technology': None, 'country': None, 'sdg': None}
    if found_country and any(w in q for w in ['project', 'initiative', 'ai', 'program', 'projet', 'programme']):
        return {'intent': 'search_projects', 'sector': None, 'technology': None, 'country': found_country, 'sdg': None}

    # Stakeholder triggers
    if found_type and found_country:
        return {'intent': 'search_stakeholders', 'type': found_type, 'country': found_country}
    if found_type:
        return {'intent': 'search_stakeholders', 'type': found_type, 'country': None}
    if found_country and any(w in q for w in ['stakeholder', 'actor', 'organization', 'organisation', 'partner', 'partenaire', 'acteur']):
        return {'intent': 'search_stakeholders', 'type': None, 'country': found_country}
    if found_country:
        return {'intent': 'search_projects', 'sector': None, 'technology': None, 'country': found_country, 'sdg': None}

    if any(w in q for w in ['project', 'initiative', 'program', 'projet', 'programme']):
        return {'intent': 'search_projects', 'sector': None, 'technology': None, 'country': None, 'sdg': None}
    if any(w in q for w in ['stakeholder', 'organization', 'organisation', 'actor', 'partner', 'partenaire', 'acteur']):
        return {'intent': 'search_stakeholders', 'type': None, 'country': None}

    return {'intent': 'analytics_query', 'subtype': 'overview'}


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


# ─── Follow-up suggestion generator ─────────────────────────────────────────

def get_followup_suggestions(intent_type: str, intent: dict, data) -> list[str]:
    """Return 3 contextual follow-up suggestion chips."""
    suggestions = []
    country = intent.get('country', '')
    sector  = intent.get('sector', '')
    tech    = intent.get('technology', '')

    if intent_type == 'search_projects':
        if country:
            suggestions.append(f"Show stakeholders in {country.title()}")
        if sector:
            suggestions.append(f"{sector.title()} projects stats")
        if tech:
            suggestions.append(f"More {tech} projects")
        if not suggestions:
            suggestions = ["Show overview stats", "Most active country", "Top sectors"]
        suggestions.append("Platform overview")

    elif intent_type == 'search_stakeholders':
        if country:
            suggestions.append(f"AI projects in {country.title()}")
        suggestions += ["Show universities", "Government organizations", "Platform overview"]

    elif intent_type == 'analytics_query':
        suggestions = [
            "Show health sector projects",
            "Most active country",
            "Find NLP projects",
            "Show startups in Morocco",
        ]

    return suggestions[:3]


# ─── Template-based Response ─────────────────────────────────────────────────

def generate_template_response(intent_type: str, intent: dict, data) -> str:
    if intent_type == 'search_projects':
        if not data:
            filters = [v for k, v in intent.items()
                       if k in ('sector', 'technology', 'country', 'sdg') and v]
            desc = ", ".join(str(f) for f in filters) if filters else "your query"
            return f"No projects found for {desc}.\nTry broadening your search or check a different country or sector."

        lines = []
        for p in data:
            country_name = p.country.name if hasattr(p, 'country') and p.country else None
            meta = " · ".join(filter(None, [p.sector, p.ai_technology, country_name]))
            lines.append(f"• **{p.title}**" + (f"\n  {meta}" if meta else ""))

        filters = [str(v).title() for k, v in intent.items()
                   if k in ('sector', 'technology', 'country') and v]
        header = f"Found **{len(data)}** AI project(s)"
        header += (f" — {', '.join(filters)}" if filters else "") + ":\n\n"
        return header + "\n".join(lines)

    if intent_type == 'search_stakeholders':
        if not data:
            filters = [v for k, v in intent.items() if k in ('type', 'country') and v]
            desc = ", ".join(str(f) for f in filters) if filters else "your query"
            return f"No organizations found for {desc}.\nTry a different type or country."

        lines = []
        for s in data:
            meta = " · ".join(filter(None, [s.type and s.type.title(), s.country]))
            lines.append(f"• **{s.name}**" + (f"  ({meta})" if meta else ""))

        header = f"Found **{len(data)}** organization(s):\n\n"
        return header + "\n".join(lines)

    if intent_type == 'analytics_query':
        subtype = intent.get('subtype', 'overview')

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

    return "I could not find data for that query. Try asking about projects, sectors, countries, or organizations."


# ─── Prompt formatter (for Ollama) ───────────────────────────────────────────

def format_results_for_prompt(intent: str, data) -> str:
    if not data or (isinstance(data, list) and not data):
        return "No matching records found in the database."

    if intent == 'search_projects':
        lines = [
            f"- {p.title} | Sector: {p.sector or 'N/A'} | Tech: {p.ai_technology or 'N/A'} | "
            f"Country: {p.country.name if hasattr(p, 'country') and p.country else 'N/A'}"
            for p in data
        ]
        return f"{len(data)} project(s):\n" + "\n".join(lines)

    if intent == 'search_stakeholders':
        lines = [f"- {s.name} | Type: {s.type} | Country: {s.country or 'N/A'}" for s in data]
        return f"{len(data)} stakeholder(s):\n" + "\n".join(lines)

    if intent == 'analytics_query':
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
        async with httpx.AsyncClient(timeout=10) as client:
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
