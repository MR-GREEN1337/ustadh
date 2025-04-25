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
    """Request model for updating professor courses during onboarding"""

    course_ids: List[int] = []
    new_courses: List[Dict[str, Any]] = []


# Models for professor dashboard APIs


class CourseItem(BaseModel):
    """Model for course item in response"""

    id: int
    title: str
    code: str
    description: Optional[str] = None
    students: int = 0
    nextClass: Optional[str] = None
    progress: int = 0
    topics: List[str] = []
    aiGenerated: bool = False
    status: str = "active"


class CourseResponse(BaseModel):
    """Response model for professor courses"""

    courses: List[CourseItem]


class ScheduleEntry(BaseModel):
    """Model for schedule entry in response"""

    id: int
    title: str
    description: Optional[str] = None
    day: str
    start_time: str
    end_time: str
    location: Optional[str] = None
    entry_type: str = "class"  # class, office_hours, meeting, personal
    is_recurring: bool = False
    course_id: Optional[int] = None
    color: Optional[str] = None
    is_cancelled: bool = False
    is_completed: bool = False


class ScheduleResponse(BaseModel):
    """Response model for professor schedule"""

    entries: List[ScheduleEntry]


class PendingItem(BaseModel):
    """Model for pending item in response"""

    id: int
    type: str  # assignments, messages, enrollments
    count: int
    label: str


class PendingItemsResponse(BaseModel):
    """Response model for pending items"""

    items: List[PendingItem]


class ActivityItem(BaseModel):
    """Model for activity item in response"""

    id: str
    type: str  # submission, notification, enrollment, grade_updated
    description: str
    time: str


class RecentActivitiesResponse(BaseModel):
    """Response model for recent activities"""

    activities: List[ActivityItem]


# Models for course management


class CreateCourseRequest(BaseModel):
    """Request model for creating a new course"""

    title: str
    code: str
    description: Optional[str] = None
    education_level: str
    academic_track: Optional[str] = None
    department_id: Optional[int] = None
    syllabus: Optional[Dict[str, Any]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UpdateCourseRequest(BaseModel):
    """Request model for updating a course"""

    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    syllabus: Optional[Dict[str, Any]] = None
    ai_tutoring_enabled: Optional[bool] = None
    ai_tutoring_config: Optional[Dict[str, Any]] = None


# Models for schedule management


class CreateScheduleEntryRequest(BaseModel):
    """Request model for creating a schedule entry"""

    title: str
    description: Optional[str] = None
    day_of_week: int
    start_time: str
    end_time: str
    room: Optional[str] = None
    color: Optional[str] = None
    recurrence_pattern: str = "weekly"
    start_date: datetime
    end_date: Optional[datetime] = None
    class_id: Optional[int] = None
    course_id: Optional[int] = None


class UpdateScheduleEntryRequest(BaseModel):
    """Request model for updating a schedule entry"""

    title: Optional[str] = None
    description: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None
    color: Optional[str] = None
    is_cancelled: Optional[bool] = None
    is_active: Optional[bool] = None


# Models for assignment management


class CreateAssignmentRequest(BaseModel):
    """Request model for creating an assignment"""

    title: str
    description: str
    assignment_type: str
    due_date: datetime
    points_possible: float
    instructions: str
    materials: Optional[Dict[str, Any]] = None
    resources: Optional[Dict[str, Any]] = None
    is_published: bool = True


class UpdateAssignmentRequest(BaseModel):
    """Request model for updating an assignment"""

    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    points_possible: Optional[float] = None
    instructions: Optional[str] = None
    materials: Optional[Dict[str, Any]] = None
    resources: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = None


# Models for AI integration


class AICourseGenerationRequest(BaseModel):
    """Request model for generating course content with AI"""

    generate_syllabus: bool = True
    generate_assessments: bool = True
    generate_lectures: bool = True
    difficulty: str = "medium"
    focus: Optional[str] = None


class AIAssessmentGenerationRequest(BaseModel):
    """Request model for generating assessments with AI"""

    type: str  # quiz, exam, assignment, project
    topic: Optional[str] = None
    difficulty: str = "medium"
    include_rubric: bool = True


class AIChatRequest(BaseModel):
    """Request model for sending messages to AI assistant"""

    message: str


class AIChatResponse(BaseModel):
    """Response model from AI assistant"""

    response: str
    suggestions: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None
