from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ProfessorOnboardingResponse(BaseModel):
    """Response model for professor onboarding status"""

    has_completed_onboarding: bool
    onboarding_step: str
    onboarding_progress: int
    onboarding_started_at: Optional[datetime] = None
    onboarding_completed_at: Optional[datetime] = None


class ProfessorOnboardingUpdate(BaseModel):
    """Base model for updating professor onboarding status"""

    onboarding_step: str
    onboarding_progress: int


class ProfessorProfileCreate(BaseModel):
    """Model for creating/updating professor profile"""

    title: str  # Prof., Dr., etc.
    academic_rank: str  # Assistant Professor, Associate Professor, etc.
    tenure_status: Optional[str] = None
    department_id: Optional[int] = None


class ProfessorExpertiseUpdate(BaseModel):
    """Model for updating professor expertise"""

    specializations: List[str]
    preferred_subjects: List[str]
    education_levels: List[str]
    teaching_languages: List[str]


class ProfessorAvailabilityUpdate(BaseModel):
    """Model for updating professor availability"""

    office_location: Optional[str] = None
    office_hours: Dict[str, Any]
    contact_preferences: Dict[str, Any]
    tutoring_availability: bool = True
    max_students: Optional[int] = None


class ProfessorCoursesUpdate(BaseModel):
    """Model for updating professor courses"""

    course_ids: List[int] = []
    new_courses: List[Dict[str, Any]] = []
