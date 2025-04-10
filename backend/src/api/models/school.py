from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator


class SchoolCreate(BaseModel):
    """Schema for creating a new school."""

    name: str = Field(..., description="School name")
    code: str = Field(..., description="Unique school code for identification")
    address: str = Field(default="", description="School address")
    city: str = Field(default="", description="School city")
    region: str = Field(..., description="School region")
    school_type: str = Field(
        ..., description="School type (public, private, mission, international)"
    )
    education_levels: List[str] = Field(
        default=[],
        description="Education levels offered (primary, college, lycee, university)",
    )
    contact_email: EmailStr = Field(..., description="School contact email")
    contact_phone: str = Field(default="", description="School contact phone")
    website: Optional[str] = Field(default=None, description="School website URL")

    @validator("school_type")
    def validate_school_type(cls, v):
        valid_types = ["public", "private", "mission", "international"]
        if v not in valid_types:
            raise ValueError(f"School type must be one of: {', '.join(valid_types)}")
        return v

    @validator("education_levels")
    def validate_education_levels(cls, v):
        valid_levels = ["primary", "college", "lycee", "university"]
        for level in v:
            if level not in valid_levels:
                raise ValueError(
                    f"Education level must be one of: {', '.join(valid_levels)}"
                )
        return v

    @validator("code")
    def validate_code(cls, v):
        if len(v) < 3:
            raise ValueError("School code must be at least 3 characters")
        return v


class SchoolResponse(BaseModel):
    """Schema for school response."""

    id: int
    name: str
    code: str
    address: str
    city: str
    region: str
    school_type: str
    education_levels: List[str]
    contact_email: str
    contact_phone: str
    website: Optional[str]
    is_active: bool
    subscription_type: str
    admin_user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True


class AdminLinkRequest(BaseModel):
    """Schema for linking an admin to a school."""

    admin_id: int = Field(..., description="ID of the user to set as school admin")
