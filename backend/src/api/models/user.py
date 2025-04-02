from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from enum import Enum


# User types
class UserType(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


# School types
class SchoolType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    HOMESCHOOL = "homeschool"
    ONLINE = "online"


# Token models
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str


class TokenData(BaseModel):
    username: str


# User models for API
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    user_type: UserType
    grade_level: Optional[int] = Field(None, ge=0, le=12)
    school_type: Optional[SchoolType] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    def password_strength(cls, v):
        """Validate password strength"""
        # This validation will be replaced with the is_strong_password function
        # in the actual authentication flow
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    user_type: UserType


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    grade_level: Optional[int] = None
    school_type: Optional[SchoolType] = None

    class Config:
        orm_mode = True


class UserResponse(UserRead):
    """Response model for user creation and updates"""

    pass


# Admin user models with more fields
class UserAdminRead(UserRead):
    failed_login_attempts: Optional[int] = None
    last_login_attempt: Optional[datetime] = None
    token_revoked_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class UserAdminUpdate(UserUpdate):
    is_active: Optional[bool] = None
    user_type: Optional[UserType] = None

    class Config:
        orm_mode = True
