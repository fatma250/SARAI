"""
Canonical label normalization for free-text taxonomy fields
(Project.sector, Project.ai_technology, Stakeholder.type).

These columns have no DB-level enum, so inconsistent casing/wording produces
duplicate categories in the analytics charts (e.g. "Health" vs "Healthcare",
"University" vs "university"). Applying the same alias maps at write time
(here) and once over existing rows (see main.py._run_migrations) keeps a
single canonical spelling per category.

Canonical spellings match the taxonomy already used elsewhere in the app
(app/routers/chatbot.py's _SECTOR_MAP / _TECH_MAP), e.g. "GovTech" is the
established sector name, not "Government".
"""

SECTOR_ALIASES = {
    "healthcare": "Health",
    "government": "GovTech",
}

TECHNOLOGY_ALIASES = {
    "natural language processing": "NLP",
}

STAKEHOLDER_TYPE_ALIASES = {
    "university": "University",
    "government": "Government",
}


def _normalize(value: str | None, aliases: dict) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    if not stripped:
        return stripped
    return aliases.get(stripped.lower(), stripped)


def normalize_sector(value: str | None) -> str | None:
    return _normalize(value, SECTOR_ALIASES)


def normalize_technology(value: str | None) -> str | None:
    return _normalize(value, TECHNOLOGY_ALIASES)


def normalize_stakeholder_type(value: str | None) -> str | None:
    return _normalize(value, STAKEHOLDER_TYPE_ALIASES)
