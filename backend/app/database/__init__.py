from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from urllib.parse import quote_plus
import os

# Try PostgreSQL first, fallback to SQLite
password = os.getenv("DB_PASSWORD", "0000")
db_user = os.getenv("DB_USER", "postgres")
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "5432")
db_name = os.getenv("DB_NAME", "SARAI_DB")

import time

# Try PostgreSQL with retries
DATABASE_URL = f"postgresql+psycopg://{db_user}:{quote_plus(password)}@{db_host}:{db_port}/{db_name}"
SQLITE_URL = "sqlite:///./sarai.db"

engine = None
using_postgresql = True

# Max retries for PostgreSQL
MAX_RETRIES = 3
RETRY_DELAY = 2

for i in range(MAX_RETRIES):
    try:
        # Test PostgreSQL connection
        test_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            echo=False,
        )
        print(f"[DB] Connected to PostgreSQL at {db_host}:{db_port}/{db_name}")
        using_postgresql = True
        break
    except Exception as e:
        print(f"[DB] PostgreSQL connection attempt {i+1}/{MAX_RETRIES} failed: {e}")
        if i < MAX_RETRIES - 1:
            time.sleep(RETRY_DELAY)
        else:
            print(f"[DB] PostgreSQL unavailable after {MAX_RETRIES} attempts. Falling back to SQLite: ./sarai.db")
            using_postgresql = False
            DATABASE_URL = SQLITE_URL
            engine = create_engine(
                SQLITE_URL,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=False,
            )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
