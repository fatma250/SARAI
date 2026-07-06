from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class Notification(Base):
    """
    User notifications for project approvals, comments, etc.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Notification details
    type = Column(
        String(50),
        nullable=False,
        comment="project_approved / project_rejected / comment_added / mention / system"
    )
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Related entities
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    
    # Link for action
    action_url = Column(String(500), nullable=True)
    
    # Status
    is_read = Column(Integer, default=0, nullable=False, comment="1=read, 0=unread")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    project = relationship("Project", foreign_keys=[project_id])
    comment = relationship("Comment", foreign_keys=[comment_id])
    
    __table_args__ = (
        CheckConstraint(
            "type IN ('project_approved', 'project_rejected', 'comment_added', 'mention', 'system', 'revision_requested')",
            name="chk_notification_type"
        ),
        CheckConstraint("is_read IN (0, 1)", name="chk_is_read"),
        Index("idx_notifications_user_id", "user_id"),
        Index("idx_notifications_type", "type"),
        Index("idx_notifications_is_read", "is_read"),
        Index("idx_notifications_created_at", "created_at"),
        Index("idx_notifications_project_id", "project_id"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "project_id": self.project_id,
            "comment_id": self.comment_id,
            "action_url": self.action_url,
            "is_read": self.is_read,
            "created_at": self.created_at,
            "read_at": self.read_at,
        }
