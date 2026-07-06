from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SDBase(BaseModel):
    goal_number: int = Field(..., ge=1, le=17)
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    color_code: Optional[str] = None


class SDGCreate(SDBase):
    pass


class SDG(SDBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SDGStats(BaseModel):
    goal_number: int
    project_count: int
    stakeholder_count: int
    countries_count: int = 0
    top_sector: Optional[str] = None
