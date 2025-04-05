from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    user_type: str


class UserCreate(UserBase):
    password: str
    has_onboarded: Optional[bool] = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    user_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str


class UserRead(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    has_onboarded: bool
    created_at: datetime

    # Enhanced fields for onboarding
    education_level: Optional[str] = None
    school_type: Optional[str] = None
    region: Optional[str] = None
    academic_track: Optional[str] = None
    learning_style: Optional[str] = None
    study_habits: Optional[List[str]] = None
    academic_goals: Optional[List[str]] = None
    data_consent: Optional[bool] = None

    class Config:
        orm_mode = True


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    has_onboarded: bool
    created_at: datetime

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

    # Added new fields that can be updated
    education_level: Optional[str] = None
    school_type: Optional[str] = None
    region: Optional[str] = None
    academic_track: Optional[str] = None
    learning_style: Optional[str] = None
    study_habits: Optional[List[str]] = None
    academic_goals: Optional[List[str]] = None
    has_onboarded: Optional[bool] = None
    data_consent: Optional[bool] = None

    class Config:
        orm_mode = True


# New model specifically for onboarding data
class UserOnboardingUpdate(BaseModel):
    education_level: str
    school_type: str
    region: str
    academic_track: Optional[str] = None
    learning_style: str
    study_habits: List[str]
    academic_goals: List[str]
    data_consent: bool
    subjects: Optional[List[int]] = None  # IDs of subjects user is interested in

    class Config:
        orm_mode = True


class SubjectBase(BaseModel):
    name: str
    description: str
    grade_level: str
    subject_code: str

    class Config:
        orm_mode = True


class SubjectRead(SubjectBase):
    id: int
    icon: Optional[str] = None
    color_scheme: Optional[str] = None
    teaching_language: Optional[str] = None
    university_track: Optional[str] = None
    academic_track: Optional[str] = None


class SubjectCreate(SubjectBase):
    icon: Optional[str] = None
    color_scheme: Optional[str] = None
    teaching_language: Optional[str] = None
    university_track: Optional[str] = None
    academic_track: Optional[str] = None


class SubjectInterestCreate(BaseModel):
    user_id: int
    subject_id: int
    interest_level: int = Field(ge=1, le=5)  # Interest level from 1-5


class SubjectInterestRead(SubjectInterestCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
