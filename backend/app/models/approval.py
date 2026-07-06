from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class Approval(Base):
    """
    Tracks approval workflow for projects
    Maintains audit trail of approval/rejection decisions
    """
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Approval details
    status = Column(
        String(50),
        nullable=False,
        comment="pending / approved / rejected / revision_requested"
    )
    previous_status = Column(String(50), nullable=True, comment="Status before this action")
    
    # Feedback
    comments = Column(Text, nullable=True, comment="Reviewer comments/feedback")
    rejection_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships removed
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'revision_requested')",
            name="chk_approval_status"
        ),
        Index("idx_approvals_project_id", "project_id"),
        Index("idx_approvals_reviewer_id", "reviewer_id"),
        Index("idx_approvals_status", "status"),
        Index("idx_approvals_created_at", "created_at"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "reviewer_id": self.reviewer_id,
            "status": self.status,
            "previous_status": self.previous_status,
            "comments": self.comments,
            "rejection_reason": self.rejection_reason,
            "created_at": self.created_at,
            "reviewed_at": self.reviewed_at,
        }
