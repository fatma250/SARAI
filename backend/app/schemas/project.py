from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.schemas.stakeholder import ProjectStakeholderResponse
from app.schemas.user import UserResponse
from app.schemas.country import CountryResponse
from app.schemas.document import DocumentResponse


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    sector: Optional[str] = None
    ai_technology: Optional[str] = None
    sdg_alignment: Optional[str] = None
    status: str = "pending"
    country_id: Optional[int] = None
    website: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    coverage: Optional[str] = None
    planned_tasks: Optional[str] = None
    expected_impact: Optional[str] = None
    budget: Optional[str] = None
    planned_duration: Optional[str] = None


class ProjectCreate(ProjectBase):
    user_id: int


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    ai_technology: Optional[str] = None
    sdg_alignment: Optional[str] = None
    status: Optional[str] = None
    country_id: Optional[int] = None
    website: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    coverage: Optional[str] = None
    planned_tasks: Optional[str] = None
    expected_impact: Optional[str] = None
    budget: Optional[str] = None
    planned_duration: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_featured: Optional[int] = 0
    is_published: Optional[int] = 1
    views_count: Optional[int] = 0

    # Nested relations — all optional to prevent serialization crashes
    stakeholder_associations: List[ProjectStakeholderResponse] = []
    owner: Optional[UserResponse] = None
    country: Optional[CountryResponse] = None
    documents: List[DocumentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)
