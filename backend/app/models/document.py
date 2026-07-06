from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class ProjectDocument(Base):
    """
    Documents attached to projects (PDFs, reports, white papers, etc.)
    """
    __tablename__ = "project_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False, comment="Relative or absolute path to file")
    file_url = Column(String(500), nullable=True, comment="Public URL if hosted externally")
    file_size = Column(BigInteger, nullable=True, comment="File size in bytes")
    mime_type = Column(String(100), nullable=True)
    
    # Metadata
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    document_type = Column(String(100), nullable=True, comment="e.g., Report, White Paper, Dataset, Policy")
    
    # Upload information
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships removed
    uploader = relationship("User", foreign_keys=[uploaded_by])
    
    __table_args__ = (
        Index("idx_project_documents_project_id", "project_id"),
        Index("idx_project_documents_uploaded_by", "uploaded_by"),
        Index("idx_project_documents_document_type", "document_type"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_path": self.file_path,
            "file_url": self.file_url,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "title": self.title,
            "description": self.description,
            "document_type": self.document_type,
            "uploaded_by": self.uploaded_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
