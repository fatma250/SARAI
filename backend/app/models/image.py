from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, BigInteger, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class ProjectImage(Base):
    """
    Images attached to projects (screenshots, logos, diagrams, etc.)
    """
    __tablename__ = "project_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False, comment="Relative or absolute path to image")
    file_url = Column(String(500), nullable=True, comment="Public URL if hosted externally")
    file_size = Column(BigInteger, nullable=True, comment="File size in bytes")
    mime_type = Column(String(100), nullable=True, comment="e.g., image/jpeg, image/png")
    
    # Image metadata
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    alt_text = Column(String(255), nullable=True, comment="Accessibility alt text")
    caption = Column(Text, nullable=True)
    
    # Display order and featured status
    display_order = Column(Integer, default=0, nullable=False)
    is_featured = Column(Integer, default=0, nullable=False, comment="1=featured/primary image, 0=regular")
    
    # Upload information
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships removed
    uploader = relationship("User", foreign_keys=[uploaded_by])
    
    __table_args__ = (
        CheckConstraint("is_featured IN (0, 1)", name="chk_is_featured"),
        Index("idx_project_images_project_id", "project_id"),
        Index("idx_project_images_uploaded_by", "uploaded_by"),
        Index("idx_project_images_is_featured", "is_featured"),
        Index("idx_project_images_display_order", "display_order"),
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
            "width": self.width,
            "height": self.height,
            "alt_text": self.alt_text,
            "caption": self.caption,
            "display_order": self.display_order,
            "is_featured": self.is_featured,
            "uploaded_by": self.uploaded_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
