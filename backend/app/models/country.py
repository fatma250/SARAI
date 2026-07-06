from sqlalchemy import Column, Integer, String, Numeric, DateTime, Index, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class Country(Base):
    """
    Countries in the Arab region with geospatial data
    """
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    code_alpha2 = Column(String(2), nullable=True, unique=True, comment="ISO 3166-1 alpha-2 code")
    code_alpha3 = Column(String(3), nullable=True, unique=True, comment="ISO 3166-1 alpha-3 code")
    
    # Geospatial data
    latitude = Column(Numeric(9, 6), nullable=True, comment="Capital city latitude")
    longitude = Column(Numeric(9, 6), nullable=True, comment="Capital city longitude")
    region = Column(String(100), nullable=True, comment="Sub-region classification")
    
    # Additional metadata
    flag_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    organizations = relationship("Stakeholder", back_populates="country_rel")
    
    __table_args__ = (
        Index("idx_countries_name", "name"),
        Index("idx_countries_code_alpha2", "code_alpha2"),
        Index("idx_countries_code_alpha3", "code_alpha3"),
        Index("idx_countries_region", "region"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code_alpha2": self.code_alpha2,
            "code_alpha3": self.code_alpha3,
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
            "region": self.region,
            "flag_url": self.flag_url,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }