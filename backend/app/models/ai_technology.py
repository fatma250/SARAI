from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from app.database import Base
from datetime import datetime, timezone


class AITechnology(Base):
    """
    AI Technology taxonomy
    Examples: Machine Learning, Deep Learning, NLP, Computer Vision, Robotics, etc.
    """
    __tablename__ = "ai_technologies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, comment="e.g., ML, DL, NLP, CV, Robotics")
    icon_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships removed

    __table_args__ = (
        Index("idx_ai_technologies_name", "name"),
        Index("idx_ai_technologies_category", "category"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "icon_url": self.icon_url,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
