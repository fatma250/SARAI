from sqlalchemy import Column, Integer, String, Text, DateTime, Index, CheckConstraint
from app.database import Base
from datetime import datetime, timezone


class SDG(Base):
    """
    UN Sustainable Development Goals (SDGs)
    17 goals for sustainable development
    """
    __tablename__ = "sdgs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    goal_number = Column(Integer, nullable=False, unique=True, comment="SDG number (1-17)")
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon_url = Column(String(500), nullable=True)
    color_code = Column(String(7), nullable=True, comment="Hex color code for UI")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships removed

    __table_args__ = (
        CheckConstraint("goal_number >= 1 AND goal_number <= 17", name="chk_sdg_goal_number"),
        Index("idx_sdgs_goal_number", "goal_number"),
        Index("idx_sdgs_name", "name"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "goal_number": self.goal_number,
            "name": self.name,
            "description": self.description,
            "icon_url": self.icon_url,
            "color_code": self.color_code,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
