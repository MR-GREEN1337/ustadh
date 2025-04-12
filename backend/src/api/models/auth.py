from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel
from pydantic import EmailStr, field_validator
from pydantic import BaseModel


# ============ User Models ============


class UserBase(SQLModel):
    """Base model for all user types with common fields"""

    email: EmailStr
    username: str
    full_name: str
    user_type: (
        str  # "student", "teacher", "parent", "admin", "school_admin", "professor"
    )


class UserCreate(UserBase):
    """Model for creating a new user"""

    password: str
    has_onboarded: Optional[bool] = False

    # Validate password
    @field_validator("password")
    def password_validation(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserRead(UserBase):
    """Model for reading user data"""

    id: int
    is_active: bool
    has_onboarded: bool
    created_at: datetime
    # Education profile fields
    education_level: Optional[str] = None
    school_type: Optional[str] = None
    region: Optional[str] = None
    academic_track: Optional[str] = None
    learning_style: Optional[str] = None
    study_habits: Optional[List[str]] = None
    academic_goals: Optional[List[str]] = None


class UserResponse(UserRead):
    """Full user response model"""

    pass


class UserLogin(SQLModel):
    """Model for user login data"""

    email: EmailStr
    password: str
    user_type: str


class UserOnboardingUpdate(SQLModel):
    """Model for updating user onboarding data"""

    education_level: str
    school_type: str
    region: str
    academic_track: Optional[str] = None
    learning_style: str
    study_habits: List[str]
    academic_goals: List[str]
    data_consent: bool = False
    subjects: Optional[List[int]] = None  # Subject IDs


# ============ School Authentication Models ============


class SchoolAuthBase(SQLModel):
    """Base model for school authentication"""

    school_code: str
    user_identifier: str  # Could be student ID or employee ID
    password: str


class SchoolUserCreate(UserBase):
    """Model for creating a school-affiliated user"""

    password: str
    school_id: int
    school_identifier: str  # Student ID or employee ID
    role: str  # "student", "professor", "staff", "admin"

    # For professors/staff
    department_id: Optional[int] = None
    position: Optional[str] = None

    # For students
    class_id: Optional[int] = None
    grade_level: Optional[str] = None


class SchoolUserLogin(SQLModel):
    """Model for school user login"""

    school_code: str
    identifier: str  # Student ID or employee ID
    password: str
    user_type: str  # "school_student", "school_professor", "school_admin"


# ============ Token Models ============


# Token verification request model
class TokenVerifyRequest(BaseModel):
    token: str


# Password setting request model
class SetPasswordRequest(BaseModel):
    token: str
    password: str


# Resend activation request model
class ResendActivationRequest(BaseModel):
    email: str


# Token response model with additional info
class TokenVerifyResponse(BaseModel):
    email: str
    requires_password: bool = False


class Token(SQLModel):
    """JWT token model"""

    access_token: str
    token_type: str = "bearer"


class TokenData(SQLModel):
    """Token data for JWT payload"""

    username: Optional[str] = None
    user_id: Optional[int] = None
    user_type: Optional[str] = None
    school_id: Optional[int] = None


# ============ School Integration Models ============


class SchoolAuthSettings(SQLModel):
    """Settings for school authentication integration"""

    school_id: int
    enable_sso: bool = False
    sso_provider: Optional[str] = None
    sso_settings: Optional[Dict[str, Any]] = None
    enable_bulk_import: bool = True
    require_email_verification: bool = True
    default_password_policy: str = (
        "temp_password"  # "temp_password", "student_id", "custom"
    )
    custom_password_rule: Optional[str] = None


class SchoolUserBulkImport(SQLModel):
    """Model for bulk importing school users"""

    school_id: int
    user_type: str  # "student", "professor", "staff"
    data_format: str = "csv"  # "csv", "excel", "json"
    generate_passwords: bool = True
    send_welcome_emails: bool = False
    users: List[Dict[str, Any]]


class SchoolAPITokenCreate(SQLModel):
    """Model for creating school API tokens"""

    school_id: int
    name: str
    description: Optional[str] = None
    permissions: List[str]
    expires_at: Optional[datetime] = None


class SchoolAPIToken(SchoolAPITokenCreate):
    """Model for school API token"""

    id: int
    token: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    is_active: bool = True


# ============ Guardian Integration Models ============


class GuardianInvite(SQLModel):
    """Model for inviting a guardian/parent"""

    student_id: int
    email: EmailStr
    relationship: str  # "parent", "guardian", "other"
    permissions: List[str] = ["view_progress", "view_attendance"]
    custom_message: Optional[str] = None


class GuardianAccept(SQLModel):
    """Model for accepting a guardian invitation"""

    invite_token: str
    password: str
    full_name: str
