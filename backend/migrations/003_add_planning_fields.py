"""
Migration 003 — Add planning fields to projects table
New columns: coverage, planned_tasks, expected_impact, budget, planned_duration
Run: python migrations/003_add_planning_fields.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, inspect
from app.database import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NEW_COLUMNS = [
    ("coverage",         "VARCHAR(300)"),
    ("planned_tasks",    "TEXT"),
    ("expected_impact",  "TEXT"),
    ("budget",           "VARCHAR(150)"),
    ("planned_duration", "VARCHAR(100)"),
]


def column_exists(engine, table: str, column: str) -> bool:
    inspector = inspect(engine)
    cols = [c["name"] for c in inspector.get_columns(table)]
    return column in cols


def run():
    engine = create_engine(DATABASE_URL)

    with engine.begin() as conn:
        for col_name, col_type in NEW_COLUMNS:
            if column_exists(engine, "projects", col_name):
                logger.info(f"  ✓ Column already exists: {col_name}")
            else:
                conn.execute(
                    text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}")
                )
                logger.info(f"  + Added column: {col_name} ({col_type})")

    logger.info("\n✅ Migration 003 complete.")


if __name__ == "__main__":
    run()
