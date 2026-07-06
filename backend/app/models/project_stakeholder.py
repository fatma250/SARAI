from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone

class ProjectStakeholder(Base):
    """
    Join table for Many-to-Many relationship between Projects and Stakeholders.
    Includes the specific role of the stakeholder in the project.
    """
    __tablename__ = "project_stakeholders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    stakeholder_id = Column(Integer, ForeignKey("stakeholders.id", ondelete="CASCADE"), nullable=False)
    
    # Role: developer, research, funding, partner, etc.
    role = Column(String(100), nullable=False, default="partner")
    
    added_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="stakeholder_associations")
    stakeholder = relationship("Stakeholder", back_populates="project_associations")

    __table_args__ = (
        UniqueConstraint("project_id", "stakeholder_id", name="uq_project_stakeholder"),
    )
