"""
Migration: Update existing projects to 'approved' status.
Old projects were visible before the approval system, so we mark them as approved.
Run: python migrate_project_status.py
"""
from app.database import SessionLocal, engine, Base
from app.models.project import Project
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status'"
        ))
        if not result.fetchone():
            print("Adding 'status' column to projects table...")
            db.execute(text(
                "ALTER TABLE projects ADD COLUMN status VARCHAR(50) DEFAULT 'pending'"
            ))
            db.commit()
            print("Column added.")

        print("Updating existing projects to 'approved'...")
        db.execute(text(
            "UPDATE projects SET status = 'approved' WHERE status = 'active' OR status IS NULL"
        ))
        db.commit()

        count = db.query(Project).filter(Project.status == "approved").count()
        print(f"Done. {count} projects marked as approved.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
