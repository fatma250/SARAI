from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class Comment(Base):
    """
    Comments on projects for feedback, moderation, and discussion
    """
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, comment="For threaded comments")
    
    # Content
    content = Column(Text, nullable=False)
    
    # Moderation
    is_approved = Column(Integer, default=1, nullable=False, comment="1=approved, 0=pending moderation")
    is_flagged = Column(Integer, default=0, nullable=False, comment="1=flagged for review, 0=normal")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships removed
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    
    __table_args__ = (
        CheckConstraint("is_approved IN (0, 1)", name="chk_is_approved"),
        CheckConstraint("is_flagged IN (0, 1)", name="chk_is_flagged"),
        Index("idx_comments_project_id", "project_id"),
        Index("idx_comments_user_id", "user_id"),
        Index("idx_comments_parent_id", "parent_id"),
        Index("idx_comments_is_approved", "is_approved"),
        Index("idx_comments_is_flagged", "is_flagged"),
        Index("idx_comments_created_at", "created_at"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "user_id": self.user_id,
            "parent_id": self.parent_id,
            "content": self.content,
            "is_approved": self.is_approved,
            "is_flagged": self.is_flagged,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
