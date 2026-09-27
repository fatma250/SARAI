from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, Index, BigInteger, ForeignKey
from app.database import Base
from app.database.vector import VectorColumn
from datetime import datetime, timezone


class Resource(Base):
    """
    Resource library: Policy documents, white papers, datasets, reports
    """
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Basic information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Classification
    type = Column(
        String(100),
        nullable=False,
        comment="Policy Document / White Paper / Report / Dataset / Research Paper"
    )
    category = Column(
        String(100),
        nullable=False,
        comment="Strategy / Ethics / Governance / Research / Data / Regulation"
    )
    
    # File information
    file_url = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True, comment="File size in bytes")
    mime_type = Column(String(100), nullable=True)
    
    # Metadata
    language = Column(String(50), nullable=True)
    author = Column(String(255), nullable=True)
    publisher = Column(String(255), nullable=True)
    publication_date = Column(DateTime(timezone=True), nullable=True)
    
    # Metrics
    downloads = Column(Integer, default=0, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    
    # Status
    is_featured = Column(Integer, default=0, nullable=False, comment="1=featured, 0=regular")
    is_published = Column(Integer, default=1, nullable=False, comment="1=published, 0=draft")

    # Submission / admin approval workflow
    status = Column(String(50), nullable=False, default="approved", comment="pending / approved / rejected")
    submitted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # AI embedding for semantic search (pgvector)
    embedding = Column(VectorColumn(), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (
        CheckConstraint(
            "type IN ('Policy Document', 'White Paper', 'Report', 'Dataset', 'Research Paper', 'Guide', 'Toolkit')",
            name="chk_resource_type"
        ),
        CheckConstraint(
            "category IN ('Strategy', 'Ethics', 'Governance', 'Research', 'Data', 'Regulation', 'Education', 'Technical')",
            name="chk_resource_category"
        ),
        CheckConstraint("downloads >= 0", name="chk_downloads"),
        CheckConstraint("views_count >= 0", name="chk_views_count"),
        CheckConstraint("is_featured IN (0, 1)", name="chk_is_featured"),
        CheckConstraint("is_published IN (0, 1)", name="chk_is_published"),
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="chk_resource_status"),
        Index("idx_resources_title", "title"),
        Index("idx_resources_type", "type"),
        Index("idx_resources_category", "category"),
        Index("idx_resources_language", "language"),
        Index("idx_resources_is_featured", "is_featured"),
        Index("idx_resources_is_published", "is_published"),
        Index("idx_resources_created_at", "created_at"),
        Index("idx_resources_status", "status"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.type,
            "category": self.category,
            "file_url": self.file_url,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "language": self.language,
            "author": self.author,
            "publisher": self.publisher,
            "publication_date": self.publication_date,
            "downloads": self.downloads,
            "views_count": self.views_count,
            "is_featured": self.is_featured,
            "is_published": self.is_published,
            "status": self.status,
            "submitted_by": self.submitted_by,
            "submitted_at": self.submitted_at,
            "rejection_reason": self.rejection_reason,
            "reviewed_at": self.reviewed_at,
            "reviewed_by": self.reviewed_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }