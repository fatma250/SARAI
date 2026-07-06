"""
Many-to-many relationship tables for projects
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class ProjectSDG(Base):
    """
    Many-to-many relationship between Projects and SDGs
    A project can align with multiple SDGs
    """
    __tablename__ = "project_sdgs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sdg_id = Column(Integer, ForeignKey("sdgs.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    project = relationship("Project", back_populates="sdg_associations")
    sdg = relationship("SDG")
    
    __table_args__ = (
        UniqueConstraint("project_id", "sdg_id", name="uq_project_sdg"),
        Index("idx_project_sdgs_project_id", "project_id"),
        Index("idx_project_sdgs_sdg_id", "sdg_id"),
    )


class ProjectTechnology(Base):
    """
    Many-to-many relationship between Projects and AI Technologies
    A project can use multiple AI technologies
    """
    __tablename__ = "project_technologies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    technology_id = Column(Integer, ForeignKey("ai_technologies.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    project = relationship("Project", back_populates="technology_associations")
    technology = relationship("AITechnology")
    
    __table_args__ = (
        UniqueConstraint("project_id", "technology_id", name="uq_project_technology"),
        Index("idx_project_technologies_project_id", "project_id"),
        Index("idx_project_technologies_technology_id", "technology_id"),
    )


class ProjectTag(Base):
    """
    Many-to-many relationship between Projects and Tags
    Flexible tagging system for categorization
    """
    __tablename__ = "project_tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    project = relationship("Project", back_populates="tag_associations")
    tag = relationship("Tag")
    
    __table_args__ = (
        UniqueConstraint("project_id", "tag_id", name="uq_project_tag"),
        Index("idx_project_tags_project_id", "project_id"),
        Index("idx_project_tags_tag_id", "tag_id"),
    )
