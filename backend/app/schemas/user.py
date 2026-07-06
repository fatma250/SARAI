from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import datetime
from typing import Optional


VALID_ORG_TYPES = {"NGO", "Startup", "Company", "Government", "University", "Research Lab"}
VALID_ROLES = {"organization", "admin", "moderator"}


class UserBase(BaseModel):
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    role: str = "organization"


class UserCreate(UserBase):
    password: str

    @field_validator("organization_type")
    @classmethod
    def validate_org_type(cls, v):
        if v is not None and v not in VALID_ORG_TYPES:
            raise ValueError(f"organization_type must be one of: {', '.join(sorted(VALID_ORG_TYPES))}")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(VALID_ROLES)}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        return v


class UserUpdate(BaseModel):
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

    @field_validator("organization_type")
    @classmethod
    def validate_org_type(cls, v):
        if v is not None and v not in VALID_ORG_TYPES:
            raise ValueError(f"organization_type must be one of: {', '.join(sorted(VALID_ORG_TYPES))}")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v is not None and v not in VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(VALID_ROLES)}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 6:
                raise ValueError("Password must be at least 6 characters")
            if len(v) > 128:
                raise ValueError("Password must not exceed 128 characters")
        return v


class UserResponse(BaseModel):
    id: int
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    role: Optional[str] = None
    is_active: int = 1
    is_email_verified: int = 0
    is_admin_approved: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
