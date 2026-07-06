from pydantic import BaseModel, ConfigDict
from typing import Optional


class CountryBase(BaseModel):
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None
    flag_url: Optional[str] = None


class CountryCreate(CountryBase):
    pass


class CountryUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None
    flag_url: Optional[str] = None


class CountryResponse(CountryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
