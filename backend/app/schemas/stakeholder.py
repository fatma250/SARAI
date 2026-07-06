from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class StakeholderBase(BaseModel):
    name: str
    type: str
    country: Optional[str] = None
    city: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None


class StakeholderCreate(StakeholderBase):
    pass


class StakeholderUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None


class StakeholderResponse(StakeholderBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Project Stakeholder Relation ---

class ProjectStakeholderBase(BaseModel):
    stakeholder_id: int
    role: str


class ProjectStakeholderResponse(ProjectStakeholderBase):
    id: int
    stakeholder: Optional[StakeholderResponse] = None
    added_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
