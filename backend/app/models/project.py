from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.database.vector import VectorColumn
from datetime import datetime, timezone


class Project(Base):
    """
    AI Projects/Initiatives in the Arab region.
    Core entity of the SARAI platform.
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Basic information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Categorization
    sector = Column(String(100), nullable=True)
    ai_technology = Column(String(100), nullable=True)
    sdg_alignment = Column(String(255), nullable=True)
    
    # Status: pending, approved, rejected
    status = Column(
        String(50),
        default="pending",
        nullable=False,
        comment="pending / approved / rejected"
    )
    
    # Geographic information
    country_id = Column(Integer, ForeignKey("countries.id", ondelete="SET NULL"), nullable=True)
    
    # New Normalized Fields
    stakeholder_id = Column(Integer, ForeignKey("stakeholders.id", ondelete="SET NULL"), nullable=True)
    sector_id = Column(Integer, ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)
    
    # Ownership (User who created the entry)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Moderation metadata
    submitted_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Metadata
    website = Column(String(500), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)

    # Planning & Impact fields
    coverage = Column(String(300), nullable=True)
    planned_tasks = Column(Text, nullable=True)
    expected_impact = Column(Text, nullable=True)
    budget = Column(String(150), nullable=True)
    planned_duration = Column(String(100), nullable=True)
    
    # Metrics & Visibility
    is_featured = Column(Integer, default=0, nullable=False)
    is_published = Column(Integer, default=1, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    
    # AI embedding for semantic search (pgvector)
    embedding = Column(VectorColumn(), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", foreign_keys=[user_id], back_populates="projects")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    country = relationship("Country")
    stakeholder = relationship("Stakeholder", foreign_keys=[stakeholder_id])
    sector_rel = relationship("Sector", foreign_keys=[sector_id])
    documents = relationship("ProjectDocument", backref="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    
    # Many-to-Many Relationships
    stakeholder_associations = relationship(
        "ProjectStakeholder", 
        back_populates="project", 
        cascade="all, delete-orphan"
    )
    
    sdg_associations = relationship("ProjectSDG", cascade="all, delete-orphan")
    technology_associations = relationship("ProjectTechnology", cascade="all, delete-orphan")
    tag_associations = relationship("ProjectTag", cascade="all, delete-orphan")

    @property
    def stakeholders(self):
        return [assoc.stakeholder for assoc in self.stakeholder_associations]

    @property
    def technologies_list(self):
        return [assoc.technology for assoc in self.technology_associations]

    @property
    def sdgs_list(self):
        return [assoc.sdg for assoc in self.sdg_associations]

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "sector": self.sector,
            "sector_id": self.sector_id,
            "ai_technology": self.ai_technology,
            "sdg_alignment": self.sdg_alignment,
            "status": self.status,
            "country_id": self.country_id,
            "stakeholder_id": self.stakeholder_id,
            "user_id": self.user_id,
            "submitted_at": self.submitted_at,
            "reviewed_at": self.reviewed_at,
            "reviewed_by": self.reviewed_by,
            "rejection_reason": self.rejection_reason,
            "website": self.website,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "coverage": self.coverage,
            "planned_tasks": self.planned_tasks,
            "expected_impact": self.expected_impact,
            "budget": self.budget,
            "planned_duration": self.planned_duration,
            "is_featured": self.is_featured,
            "is_published": self.is_published,
            "views_count": self.views_count,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "documents": [d.to_dict() for d in self.documents]
        }

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'idea', 'prototype', 'production', 'ongoing', 'completed')",
            name="chk_project_status_v2"
        ),
        Index("idx_projects_title", "title"),
        Index("idx_projects_status", "status"),
        Index("idx_projects_country_id", "country_id"),
    )
