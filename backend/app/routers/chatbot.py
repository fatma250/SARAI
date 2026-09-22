from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_optional, get_current_user
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.services.chatbot_service import (
    route_question,
    query_projects,
    query_stakeholders,
    query_analytics,
    query_semantic,
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


class HistoryItem(BaseModel):
    id: int
    question: str
    answer: str
    intent_type: str | None = None
    source: str | None = None
    created_at: str


@router.get("/history", response_model=list[HistoryItem])
def get_chat_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return [
        HistoryItem(
            id=r.id,
            question=r.question,
            answer=r.answer,
            intent_type=r.intent_type,
            source=r.source,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@router.delete("/history")
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"message": "History cleared"}


@router.post("/ask", response_model=ChatbotResponse)
async def ask_chatbot(
    req: ChatbotRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # The LLM router classifies the question and extracts its parameters in
    # one shot (see chatbot_service.route_question) — it also writes the
    # reply itself for small talk / out-of-scope questions.
    route = route_question(question)
    action = route.get("action")

    # ── 1. Fetch relevant data from DB ──
    data = None
    if action == "search_projects":
        data = query_projects(
            db,
            sector=route.get("sector"),
            technology=route.get("technology"),
            country=route.get("country"),
            sdg=route.get("sdg"),
        )
    elif action == "search_stakeholders":
        data = query_stakeholders(
            db,
            stakeholder_type=route.get("stakeholder_type"),
            country=route.get("country"),
        )
    elif action == "analytics":
        data = query_analytics(db, route.get("analytics_subtype") or "overview")
    elif action == "semantic_search":
        data = query_semantic(db, question)

    # ── 2. Try Ollama with conversation history ──
    # Small talk / out-of-scope / general_info already got their final reply
    # from the router itself (route["reply"]) — no need for (and no benefit
    # from) a second Ollama call.
    answer = None
    source = "template"
    if action not in ("small_talk", "out_of_scope", "general_info"):
        context = format_results_for_prompt(action, data)
        history_dicts = [{"role": m.role, "text": m.text} for m in req.history]
        answer = await call_ollama(question, context, history=history_dicts)
        if answer:
            source = "ollama"

    # ── 3. Fallback: template-based response (always works) ──
    if not answer:
        answer = generate_template_response(action, route, data)

    # ── 4. Follow-up suggestions ──
    followups = get_followup_suggestions(action, route, data)

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

    # ── 6. Persist the exchange for logged-in users ──
    if current_user is not None:
        db.add(ChatMessage(
            user_id=current_user.id,
            question=question,
            answer=answer,
            intent_type=action,
            source=source,
        ))
        db.commit()

    return ChatbotResponse(
        answer=answer,
        data=raw,
        source=source,
        intent_type=action,
        followups=followups,
    )
