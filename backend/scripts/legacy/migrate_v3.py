from app.database import engine, Base
from sqlalchemy import text, inspect
import logging
from datetime import datetime, timezone

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
            ("submitted_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
            ("reviewed_at", "TIMESTAMP WITH TIME ZONE"),
            ("reviewed_by", "INTEGER"),
            ("rejection_reason", "TEXT")
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
            # Drop old constraint
            conn.execute(text("ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_project_status_v2"))
            # Add new one
            conn.execute(text("ALTER TABLE projects ADD CONSTRAINT chk_project_status_v2 CHECK (status IN ('pending', 'approved', 'rejected', 'idea', 'prototype', 'production', 'ongoing', 'completed'))"))
            conn.commit()
            logger.info("Successfully updated status check constraint")
        except Exception as e:
            logger.warning(f"Failed to update constraint: {e}")

        # Migrate existing data to 'approved'
        logger.info("Migrating existing projects to 'approved' status...")
        try:
            # We assume existing projects were ongoing/completed/prototype etc and should now be 'approved' for public view
            conn.execute(text("UPDATE projects SET status = 'approved' WHERE status NOT IN ('pending', 'rejected')"))
            conn.commit()
            logger.info("Migration of existing projects complete")
        except Exception as e:
            logger.error(f"Failed to migrate project statuses: {e}")

if __name__ == "__main__":
    migrate()
