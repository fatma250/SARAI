from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ResourceBase(BaseModel):
    title: str
    type: str
    category: str
    language: Optional[str] = None
    file_size: Optional[int] = None
    description: Optional[str] = None
    file_url: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    file_size: Optional[int] = None
    description: Optional[str] = None
    file_url: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: int
    downloads: int
    views_count: int
    status: str
    submitted_by: Optional[int] = None
    submitted_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True