from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, Index, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class User(Base):
    """
    User accounts for authentication and authorization
    Can be linked to an organization or be standalone admin
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Authentication
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile (kept for backward compatibility, but organization data should be in organizations table)
    organization_name = Column(String(255), nullable=True)
    organization_type = Column(
        String(50),
        nullable=True,
        comment="NGO / Startup / Company / Government / University / Research Lab",
    )
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)
    sector = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    logo = Column(Text, nullable=True)
    
    # Stakeholder link (previously organization)
    stakeholder_id = Column(Integer, ForeignKey("stakeholders.id", ondelete="SET NULL"), nullable=True)
    
    # Role and permissions
    role = Column(String(50), nullable=False, default="organization")
    is_active = Column(Integer, default=1, nullable=False, comment="1=active, 0=inactive")
    is_email_verified = Column(Integer, default=0, nullable=False, comment="1=verified, 0=not verified")
    is_admin_approved = Column(Integer, default=0, nullable=False, comment="1=approved, 0=pending")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    stakeholder = relationship("Stakeholder", back_populates="users")
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan", foreign_keys="[Project.user_id]")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "organization_type IN ('NGO', 'Startup', 'Company', 'Government', 'University', 'Research Lab')",
            name="chk_organization_type",
        ),
        CheckConstraint(
            "role IN ('organization', 'admin', 'moderator')",
            name="chk_role",
        ),
        CheckConstraint("is_active IN (0, 1)", name="chk_is_active"),
        CheckConstraint("is_email_verified IN (0, 1)", name="chk_is_email_verified"),
        CheckConstraint("is_admin_approved IN (0, 1)", name="chk_is_admin_approved"),
        Index("idx_users_email", "email"),
        Index("idx_users_organization_type", "organization_type"),
        Index("idx_users_role", "role"),
        Index("idx_users_country", "country"),
        Index("idx_users_stakeholder_id", "stakeholder_id"),
        Index("idx_users_is_active", "is_active"),
        Index("idx_users_is_email_verified", "is_email_verified"),
        Index("idx_users_is_admin_approved", "is_admin_approved"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "organization_name": self.organization_name,
            "organization_type": self.organization_type,
            "email": self.email,
            "phone": self.phone,
            "website": self.website,
            "country": self.country,
            "city": self.city,
            "address": self.address,
            "sector": self.sector,
            "description": self.description,
            "logo": self.logo,
            "stakeholder_id": self.stakeholder_id,
            "role": self.role,
            "is_active": self.is_active,
            "is_email_verified": self.is_email_verified,
            "is_admin_approved": self.is_admin_approved,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login": self.last_login,
        }
