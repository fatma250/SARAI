"""
Migrate stakeholders from SQLite (sarai.db) to PostgreSQL
"""
import sqlite3
from sqlalchemy import text
from app.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_data():
    # 1. Connect to SQLite
    sqlite_conn = sqlite3.connect('sarai.db')
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute("SELECT name, type, category, country, description, website, contact_email FROM stakeholders")
    rows = sqlite_cursor.fetchall()
    logger.info(f"Found {len(rows)} stakeholders in SQLite")

    # 2. Connect to PostgreSQL
    with engine.connect() as pg_conn:
        # Clear existing small data to avoid duplicates if re-run, or just add new ones
        # For simplicity, we'll clear the table first
        logger.info("Clearing existing stakeholders in PostgreSQL...")
        pg_conn.execute(text("TRUNCATE TABLE stakeholders RESTART IDENTITY CASCADE"))
        
        logger.info("Migrating data to PostgreSQL...")
        for row in rows:
            pg_conn.execute(text("""
                INSERT INTO stakeholders (name, type, category, country, description, website, contact_email)
                VALUES (:name, :type, :category, :country, :description, :website, :contact_email)
            """), {
                "name": row[0],
                "type": row[1],
                "category": row[2],
                "country": row[3],
                "description": row[4],
                "website": row[5],
                "contact_email": row[6]
            })
        
        pg_conn.commit()
        logger.info("Migration successful!")

    sqlite_conn.close()

if __name__ == "__main__":
    migrate_data()
