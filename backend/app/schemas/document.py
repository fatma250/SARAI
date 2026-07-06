from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class DocumentBase(BaseModel):
    filename: str
    original_filename: str
    file_path: str
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[str] = None


class DocumentCreate(DocumentBase):
    project_id: int
    uploaded_by: Optional[int] = None


class DocumentResponse(DocumentBase):
    id: int
    project_id: int
    uploaded_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
