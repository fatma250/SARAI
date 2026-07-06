from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from app.database import Base
from datetime import datetime, timezone


class Sector(Base):
    """
    Normalized sector taxonomy for AI projects
    Examples: Healthcare, Education, Finance, Agriculture, Transportation, etc.
    """
    __tablename__ = "sectors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships removed or updated
    
    __table_args__ = (
        Index("idx_sectors_name", "name"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon_url": self.icon_url,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
