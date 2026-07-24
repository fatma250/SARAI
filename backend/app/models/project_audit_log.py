from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class ProjectAuditLog(Base):
    """
    Traceability trail for project edits and deletions.

    project_id/project_title/actor_name are snapshotted (not FK-cascaded) so a
    deleted project or a later-deleted user doesn't erase its own audit trail.
    """
    __tablename__ = "project_audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, nullable=False)
    project_title = Column(String(255), nullable=False)
    action = Column(String(20), nullable=False, comment="edited / deleted")
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_name = Column(String(255), nullable=True)
    details = Column(Text, nullable=True, comment="e.g. comma-separated list of changed fields")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    actor = relationship("User", foreign_keys=[actor_id])

    __table_args__ = (
        Index("idx_project_audit_log_created_at", "created_at"),
        Index("idx_project_audit_log_project_id", "project_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "project_title": self.project_title,
            "action": self.action,
            "actor_id": self.actor_id,
            "actor_name": self.actor_name,
            "details": self.details,
            "created_at": self.created_at,
        }
