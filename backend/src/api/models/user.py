from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base schema for user information."""

    email: EmailStr
    username: str
    full_name: str
    user_type: str  # "student", "parent", "supervisor", "admin"


class UserCreate(UserBase):
    """Schema for user creation with password."""

    password: str
    grade_level: Optional[str] = None  # Required only if user_type is "student"
    school_type: Optional[str] = None  # Required only if user_type is "student"
    preferences: Optional[Dict[str, Any]] = None


class UserRead(UserBase):
    """Schema for reading user data."""

    id: int
    grade_level: Optional[str] = None
    school_type: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True


class UserDetailedRead(UserRead):
    """Schema for reading detailed user data with preferences."""

    preferences: Optional[Dict[str, Any]] = None
    updated_at: datetime

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    """Schema for updating user data."""

    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""

    learning_style: Optional[str] = None
    preferred_study_time: Optional[str] = None
    study_session_duration: Optional[int] = None
    subjects_of_interest: Optional[List[str]] = None
    subjects_of_difficulty: Optional[List[str]] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None


class UserEducationUpdate(BaseModel):
    """Schema for updating user education information."""

    grade_level: Optional[str] = None
    school_type: Optional[str] = None
    academic_year_start: Optional[datetime] = None


class GuardianBase(BaseModel):
    """Base schema for guardian relationship."""

    student_id: int
    parent_id: int
    relationship: str  # "parent", "guardian", "teacher", "counselor"
    can_view: bool = True
    can_edit: bool = False


class GuardianCreate(GuardianBase):
    """Schema for creating guardian relationship."""

    pass


class GuardianRead(GuardianBase):
    """Schema for reading guardian relationship."""

    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class GuardianUpdate(BaseModel):
    """Schema for updating guardian relationship."""

    relationship: Optional[str] = None
    can_view: Optional[bool] = None
    can_edit: Optional[bool] = None


class GuardianWithStudentInfo(GuardianRead):
    """Schema for reading guardian relationship with student info."""

    student: UserRead

    class Config:
        orm_mode = True


class Token(BaseModel):
    """Schema for JWT token."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token data."""

    username: Optional[str] = None
    user_type: Optional[str] = None
