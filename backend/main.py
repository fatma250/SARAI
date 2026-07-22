import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routers import (
    stakeholders, projects, resources, analytics, countries,
    users, admin, notifications, chatbot, search, ai_search, auth, sdgs
)
import os

# Import tous les modèles AVANT create_all
from app.models.user import User
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.resource import Resource
from app.models.country import Country
from app.models.notification import Notification
from app.models.sdg import SDG

def _run_migrations():
    from sqlalchemy import text, inspect as sa_inspect
    try:
        with engine.connect() as conn:
            insp = sa_inspect(engine)
            existing = [c["name"] for c in insp.get_columns("projects")]
            new_cols = [
                ("coverage",         "VARCHAR(300)"),
                ("planned_tasks",    "TEXT"),
                ("expected_impact",  "TEXT"),
                ("budget",           "VARCHAR(150)"),
                ("planned_duration", "VARCHAR(100)"),
            ]
            for col, typ in new_cols:
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col} {typ}"))
                    conn.commit()
                    logger.info(f"[DB] Added column: projects.{col}")
            logger.info("[DB] Migration check done.")
    except Exception as e:
        logger.error(f"[DB] Migration error (non-fatal): {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        logger.info("[DB] Creating tables if they don't exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("[DB] Tables ready.")
    except Exception as e:
        logger.error(f"[DB] create_all error: {e}")
    _run_migrations()
    yield
    # Shutdown (nothing to do)

app = FastAPI(
    title="SARAI API",
    description="Stocktaking of Arab Regional AI Initiatives - Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS CONFIGURATION
logger.info("[CORS] Configuring CORS middleware...")

# Origines de dev toujours autorisées en local.
_DEV_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Origines de production ajoutées via variable d'environnement, ex:
#   CORS_EXTRA_ORIGINS=http://vps-eb207a4e.vps.ovh.net,https://sarai-aicto.org
_extra = os.getenv("CORS_EXTRA_ORIGINS", "")
_EXTRA_ORIGINS = [o.strip() for o in _extra.split(",") if o.strip()]

CORS_ORIGINS = _DEV_ORIGINS + _EXTRA_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)
logger.info(f"[CORS] Allowed origins: {CORS_ORIGINS}")

# Serve uploads
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir, html=True), name="static")

# Routers
app.include_router(stakeholders.router, prefix="/api/stakeholders", tags=["Stakeholders"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(countries.router, prefix="/api/countries", tags=["Countries"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(auth.router)
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(search.router, tags=["Search"])
app.include_router(ai_search.router, tags=["AI Search"])
app.include_router(sdgs.router, prefix="/api/sdgs", tags=["SDGs"])

@app.get("/")
def root():
    return {"message": "SARAI API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
