from app.database import engine, Base
from sqlalchemy import text, inspect
import logging

# Import models
from app.models.project import Project

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if 'projects' not in tables:
        logger.info("Table 'projects' does not exist. Running create_all...")
        Base.metadata.create_all(bind=engine)
        return

    with engine.connect() as conn:
        columns = [c['name'] for c in inspector.get_columns('projects')]
        
        # New columns
        new_columns = [
            ("start_date", "TIMESTAMP"),
            ("end_date", "TIMESTAMP")
        ]
        
        for col_name, col_type in new_columns:
            if col_name not in columns:
                logger.info(f"Adding column '{col_name}' to projects table...")
                try:
                    conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    logger.info(f"Successfully added {col_name}")
                except Exception as e:
                    logger.error(f"Failed to add {col_name}: {e}")
            else:
                logger.info(f"Column '{col_name}' already exists.")
        
        # Update status check constraint
        logger.info("Updating status check constraint...")
        try:
            # For PostgreSQL
            conn.execute(text("ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_project_status_v2"))
            conn.execute(text("ALTER TABLE projects ADD CONSTRAINT chk_project_status_v2 CHECK (status IN ('idea', 'prototype', 'production', 'pending', 'approved', 'rejected', 'ongoing', 'completed'))"))
            conn.commit()
            logger.info("Successfully updated status check constraint")
        except Exception as e:
            logger.warning(f"Failed to update constraint via ALTER TABLE (might be SQLite or constraint name differs): {e}")
            # If SQLite, we'd need to recreate the table, but let's hope it's PG or SQLite doesn't complain too much if we don't have it.
        
        # Check if year_of_implementation exists and drop it (optional)
        if "year_of_implementation" in columns:
            logger.info("Column 'year_of_implementation' exists. Keeping it for compatibility but it's no longer used in models.")

if __name__ == "__main__":
    migrate()
