from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.chatbot_service import (
    detect_intent,
    query_projects,
    query_stakeholders,
    query_analytics,
    format_results_for_prompt,
    generate_template_response,
    get_followup_suggestions,
    call_ollama,
)

router = APIRouter()

# ─── Classify ────────────────────────────────────────────────────────────────

_SECTOR_MAP = {
    'Agriculture': ['agriculture', 'farming', 'crop', 'irrigation', 'food', 'harvest', 'agri', 'livestock'],
    'Health': ['health', 'medical', 'hospital', 'disease', 'clinic', 'patient', 'diagnostic', 'drug', 'medicine', 'telemedicine'],
    'Education': ['education', 'learning', 'school', 'student', 'training', 'teaching', 'university', 'academic', 'edtech'],
    'Finance': ['finance', 'banking', 'fintech', 'payment', 'investment', 'insurance', 'credit', 'loan', 'microfinance'],
    'Transportation': ['transport', 'traffic', 'vehicle', 'road', 'logistics', 'fleet', 'autonomous', 'driving', 'mobility'],
    'Energy': ['energy', 'solar', 'wind', 'electricity', 'power', 'renewable', 'grid', 'battery'],
    'Security': ['security', 'surveillance', 'fraud', 'threat', 'cybersecurity', 'intrusion', 'detection', 'identity'],
    'Smart Cities': ['smart city', 'smart cities', 'urban', 'municipality', 'infrastructure', 'waste', 'water management'],
    'Climate': ['climate', 'environment', 'carbon', 'pollution', 'emission', 'sustainability', 'ecological'],
    'GovTech': ['government', 'public sector', 'ministry', 'policy', 'citizen', 'e-government', 'administrative', 'govtech'],
    'Telecommunications': ['telecom', 'network', 'connectivity', 'mobile', 'internet', 'communication', '5g', 'broadband'],
}

_TECH_MAP = {
    'NLP': ['nlp', 'natural language', 'text analysis', 'speech', 'language model', 'sentiment', 'translation', 'chatbot', 'dialogue', 'summarization'],
    'Computer Vision': ['computer vision', 'image recognition', 'object detection', 'video', 'face recognition', 'segmentation', 'visual'],
    'Machine Learning': ['machine learning', 'prediction', 'classification', 'regression', 'random forest', 'supervised', 'unsupervised'],
    'Deep Learning': ['deep learning', 'neural network', 'cnn', 'rnn', 'lstm', 'transformer', 'convolutional'],
    'LLMs': ['llm', 'large language model', 'gpt', 'generative ai', 'foundation model', 'llama', 'bert'],
    'Predictive Analytics': ['predictive analytics', 'forecasting', 'time series', 'business intelligence', 'data analysis', 'insight', 'anomaly'],
    'Robotics': ['robot', 'robotic', 'automation', 'drone', 'uav', 'autonomous system', 'actuator'],
}

_SDG_MAP = {
    'SDG 1: Pas de pauvreté': ['poverty', 'pauvreté', 'poor', 'financial inclusion'],
    'SDG 2: Faim zéro': ['hunger', 'faim', 'food security', 'nutrition', 'farming'],
    'SDG 3: Bonne santé et bien-être': ['health', 'santé', 'disease', 'medical', 'hospital', 'wellbeing'],
    "SDG 4: Éducation de qualité": ['education', 'éducation', 'learning', 'school', 'literacy'],
    "SDG 7: Énergie propre et d'un coût abordable": ['energy', 'énergie', 'renewable', 'solar', 'clean energy'],
    'SDG 8: Travail décent et croissance économique': ['employment', 'economy', 'job', 'economic growth', 'labor'],
    'SDG 9: Industrie, innovation et infrastructure': ['innovation', 'infrastructure', 'technology', 'industry', 'manufacturing'],
    'SDG 11: Villes et communautés durables': ['urban', 'city', 'transport', 'municipality', 'smart city'],
    'SDG 13: Mesures relatives à la lutte contre les changements climatiques': ['climate', 'carbon', 'emission', 'environment', 'pollution'],
}


def _match(text: str, mapping: dict) -> str | None:
    t = text.lower()
    best, best_hits = None, 0
    for key, kws in mapping.items():
        hits = sum(1 for kw in kws if kw in t)
        if hits > best_hits:
            best, best_hits = key, hits
    return best if best_hits > 0 else None


class ClassifyRequest(BaseModel):
    title: str = ''
    description: str = ''


class ClassifyResponse(BaseModel):
    sector: str | None = None
    technology: str | None = None
    sdg: str | None = None
    confidence: str = 'low'


@router.post("/classify", response_model=ClassifyResponse)
def classify_project(req: ClassifyRequest):
    text = f"{req.title} {req.description}".strip()
    if not text:
        raise HTTPException(status_code=400, detail="title or description required")

    sector = _match(text, _SECTOR_MAP)
    technology = _match(text, _TECH_MAP)
    sdg = _match(text, _SDG_MAP)

    hits = sum(1 for x in [sector, technology, sdg] if x)
    confidence = 'high' if hits >= 2 else ('medium' if hits == 1 else 'low')

    return ClassifyResponse(sector=sector, technology=technology, sdg=sdg, confidence=confidence)


class HistoryMessage(BaseModel):
    role: str   # "user" | "bot"
    text: str


class ChatbotRequest(BaseModel):
    question: str
    history: list[HistoryMessage] = []


class ChatbotResponse(BaseModel):
    answer: str
    data: list | dict | None = None
    source: str = "template"
    intent_type: str | None = None
    followups: list[str] = []


@router.post("/ask", response_model=ChatbotResponse)
async def ask_chatbot(req: ChatbotRequest, db: Session = Depends(get_db)):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    intent = detect_intent(question)
    intent_type = intent.get("intent")

    # ── 1. Fetch relevant data from DB ──
    data = None
    if intent_type == "search_projects":
        data = query_projects(
            db,
            sector=intent.get("sector"),
            technology=intent.get("technology"),
            country=intent.get("country"),
            sdg=intent.get("sdg"),
        )
    elif intent_type == "search_stakeholders":
        data = query_stakeholders(
            db,
            stakeholder_type=intent.get("type"),
            country=intent.get("country"),
        )
    elif intent_type == "analytics_query":
        data = query_analytics(db, intent.get("subtype", "overview"))

    # ── 2. Try Ollama with conversation history ──
    answer = None
    source = "template"
    context = format_results_for_prompt(intent_type, data)
    history_dicts = [{"role": m.role, "text": m.text} for m in req.history]
    answer = await call_ollama(question, context, history=history_dicts)
    if answer:
        source = "ollama"

    # ── 3. Fallback: template-based response (always works) ──
    if not answer:
        answer = generate_template_response(intent_type, intent, data)

    # ── 4. Follow-up suggestions ──
    followups = get_followup_suggestions(intent_type, intent, data)

    # ── 5. Serialize data for the response ──
    raw = None
    if data is not None:
        if isinstance(data, list):
            raw = []
            for d in data:
                if hasattr(d, "to_dict"):
                    raw.append(d.to_dict())
                elif hasattr(d, "__dict__"):
                    item = {k: v for k, v in d.__dict__.items() if not k.startswith("_")}
                    # Add country name if available
                    if hasattr(d, "country") and d.country:
                        item["country_name"] = d.country.name
                    raw.append(item)
                else:
                    raw.append(d)
        else:
            raw = data

    return ChatbotResponse(
        answer=answer,
        data=raw,
        source=source,
        intent_type=intent_type,
        followups=followups,
    )
