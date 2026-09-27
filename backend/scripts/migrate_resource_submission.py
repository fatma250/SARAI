"""
Migration: Add the resource submission/approval workflow.

- resources: status, submitted_by, submitted_at, rejection_reason, reviewed_at, reviewed_by
- notifications: resource_id + allow 'resource_approved' / 'resource_rejected' as notification types

Existing resources are marked 'approved' since they were already public before this
workflow existed (same reasoning as migrate_project_status.py for projects).

Run: python scripts/migrate_resource_submission.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from sqlalchemy import text


def _column_exists(db, table, column):
    result = db.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name = :table AND column_name = :column"
    ), {"table": table, "column": column})
    return result.fetchone() is not None


def _constraint_exists(db, name):
    result = db.execute(text("SELECT conname FROM pg_constraint WHERE conname = :name"), {"name": name})
    return result.fetchone() is not None


def migrate():
    db = SessionLocal()
    try:
        if not _column_exists(db, "resources", "status"):
            print("Adding 'status' column to resources table...")
            db.execute(text("ALTER TABLE resources ADD COLUMN status VARCHAR(50) DEFAULT 'approved'"))
            db.commit()

        if not _column_exists(db, "resources", "submitted_by"):
            print("Adding 'submitted_by' column to resources table...")
            db.execute(text(
                "ALTER TABLE resources ADD COLUMN submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL"
            ))
            db.commit()

        if not _column_exists(db, "resources", "submitted_at"):
            print("Adding 'submitted_at' column to resources table...")
            db.execute(text("ALTER TABLE resources ADD COLUMN submitted_at TIMESTAMPTZ"))
            db.commit()

        if not _column_exists(db, "resources", "rejection_reason"):
            print("Adding 'rejection_reason' column to resources table...")
            db.execute(text("ALTER TABLE resources ADD COLUMN rejection_reason TEXT"))
            db.commit()

        if not _column_exists(db, "resources", "reviewed_at"):
            print("Adding 'reviewed_at' column to resources table...")
            db.execute(text("ALTER TABLE resources ADD COLUMN reviewed_at TIMESTAMPTZ"))
            db.commit()

        if not _column_exists(db, "resources", "reviewed_by"):
            print("Adding 'reviewed_by' column to resources table...")
            db.execute(text(
                "ALTER TABLE resources ADD COLUMN reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL"
            ))
            db.commit()

        print("Marking existing resources without a status as 'approved' (they were already public)...")
        db.execute(text("UPDATE resources SET status = 'approved' WHERE status IS NULL"))
        db.commit()

        if not _constraint_exists(db, "chk_resource_status"):
            print("Adding CHECK constraint on resources.status...")
            db.execute(text(
                "ALTER TABLE resources ADD CONSTRAINT chk_resource_status "
                "CHECK (status IN ('pending', 'approved', 'rejected'))"
            ))
            db.commit()

        if not _column_exists(db, "notifications", "resource_id"):
            print("Adding 'resource_id' column to notifications table...")
            db.execute(text(
                "ALTER TABLE notifications ADD COLUMN resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE"
            ))
            db.commit()

        print("Refreshing notifications.chk_notification_type to allow resource_approved / resource_rejected...")
        db.execute(text("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notification_type"))
        db.execute(text(
            "ALTER TABLE notifications ADD CONSTRAINT chk_notification_type "
            "CHECK (type IN ('project_approved', 'project_rejected', 'comment_added', 'mention', "
            "'system', 'revision_requested', 'resource_approved', 'resource_rejected'))"
        ))
        db.commit()

        count = db.execute(text("SELECT COUNT(*) FROM resources WHERE status = 'approved'")).scalar()
        print(f"Done. {count} resources marked as approved.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
