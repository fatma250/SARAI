from sqlalchemy import Column, Integer, String, DateTime, Index
from app.database import Base
from datetime import datetime, timezone


class Tag(Base):
    """
    Flexible tagging system for projects
    Allows custom categorization and filtering
    """
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    color_code = Column(String(7), nullable=True, comment="Hex color for UI display")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships removed
    
    __table_args__ = (
        Index("idx_tags_name", "name"),
        Index("idx_tags_slug", "slug"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "color_code": self.color_code,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
