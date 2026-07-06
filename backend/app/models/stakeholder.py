from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.database.vector import VectorColumn
from datetime import datetime, timezone

class Stakeholder(Base):
    """
    Represents organizations in the AI ecosystem (startups, universities, etc.)
    """
    __tablename__ = "stakeholders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    
    # type: startup, university, government, NGO, lab, company
    type = Column(String(100), nullable=False)
    
    country = Column(String(100), nullable=True)
    country_id = Column(Integer, ForeignKey("countries.id", ondelete="SET NULL"), nullable=True)
    city = Column(String(100), nullable=True)
    website = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    
    # AI embedding for semantic search (pgvector)
    embedding = Column(VectorColumn(), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    country_rel = relationship("Country", back_populates="organizations")
    project_associations = relationship("ProjectStakeholder", back_populates="stakeholder", cascade="all, delete-orphan")
    
    # Users can still be linked to a stakeholder (previously organization)
    users = relationship("User", back_populates="stakeholder")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "country": self.country,
            "city": self.city,
            "website": self.website,
            "description": self.description,
            "contact_email": self.contact_email,
            "created_at": self.created_at,
        }
