from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


# Enrollment models
class EnrollmentBase(BaseModel):
    user_id: int
    subject_id: int


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    active: Optional[bool] = None
    progress_data: Optional[Dict[str, Any]] = None


class EnrollmentRead(EnrollmentBase):
    id: int
    active: bool
    progress_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Activity models
class ActivityBase(BaseModel):
    user_id: int
    lesson_id: Optional[int] = None
    type: str = Field(
        ..., description="Type of activity: lesson, quiz, practice, tutoring"
    )
    status: Optional[str] = Field(
        "in_progress", description="Status: in_progress, completed, abandoned"
    )


class ActivityCreate(ActivityBase):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None


class ActivityRead(ActivityBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    data: Dict[str, Any]
    results: Dict[str, Any]

    class Config:
        from_attributes = True


# Progress summary models
class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int = 0
    streak_start_date: Optional[datetime] = None
    last_activity_date: Optional[datetime] = None


class ActivitySummary(BaseModel):
    id: int
    type: str
    title: str
    subject: str
    start_time: datetime
    duration_seconds: int = 0
    status: str
    score: Optional[float] = None


class SubjectProgress(BaseModel):
    subject_id: int
    subject_name: str
    total_lessons: int
    completed_lessons: int
    completion_percentage: float
    time_spent_seconds: int = 0
    last_activity_date: Optional[datetime] = None


class ProgressSummary(BaseModel):
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    streak_days: int
    streak_start_date: Optional[datetime] = None
    study_time_hours: float = 0
    average_score: float = 0
    subjects: List[SubjectProgress]
    recent_activities: List[ActivitySummary]
    total_activities: int = 0
    completed_activities: int = 0


# Achievement models
class AchievementBase(BaseModel):
    title: str
    description: str
    icon: str
    required_value: int = 1


class AchievementCreate(AchievementBase):
    pass


class AchievementRead(AchievementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserAchievementBase(BaseModel):
    user_id: int
    achievement_id: int


class UserAchievementCreate(UserAchievementBase):
    pass


class UserAchievementRead(UserAchievementBase):
    id: int
    date_earned: datetime

    class Config:
        from_attributes = True

    results: Optional[Dict[str, Any]] = None


class ActivityUpdate(BaseModel):
    status: Optional[str] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    data: Optional[Dict[str, Any]] = None


class TutoringSessionBase(BaseModel):
    """Base schema for tutoring session."""

    user_id: int
    topic_id: int
    session_type: str  # "text", "math", "physics", "drawing", "chemistry", "language"
    interaction_mode: (
        str  # "text-only", "voice", "ocr-enabled", "interactive-diagram", "whiteboard"
    )
    initial_query: str
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    config: Dict[str, Any] = {}


class TutoringSessionCreate(TutoringSessionBase):
    """Schema for creating tutoring session."""

    pass


class TutoringSessionRead(TutoringSessionBase):
    """Schema for reading tutoring session."""

    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str

    class Config:
        from_attributes = True


class TutoringSessionDetailedRead(TutoringSessionRead):
    """Schema for reading detailed tutoring session."""

    exchanges_count: int = 0
    resources_count: int = 0

    class Config:
        from_attributes = True


class TutoringSessionUpdate(BaseModel):
    """Schema for updating tutoring session."""

    status: Optional[str] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    config: Optional[Dict[str, Any]] = None


class TutoringMessageCreate(BaseModel):
    """Schema for creating a new tutoring message."""

    session_id: int
    input_type: str  # "text", "voice", "ocr", "drawing"
    content: Dict[str, Any]  # Structure depends on input_type
