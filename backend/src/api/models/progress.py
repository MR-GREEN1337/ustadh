from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class EnrollmentBase(BaseModel):
    """Base schema for enrollment."""

    user_id: int
    subject_id: int


class EnrollmentCreate(EnrollmentBase):
    """Schema for creating enrollment."""

    pass


class EnrollmentRead(EnrollmentBase):
    """Schema for reading enrollment."""

    id: int
    enrolled_at: datetime
    active: bool
    completed: bool
    completed_at: Optional[datetime] = None
    progress_data: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True


class EnrollmentUpdate(BaseModel):
    """Schema for updating enrollment."""

    active: Optional[bool] = None
    completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    progress_data: Optional[Dict[str, Any]] = None


class ActivityBase(BaseModel):
    """Base schema for activity."""

    user_id: int
    lesson_id: Optional[int] = None
    type: str
    status: str = "started"
    data: Optional[Dict[str, Any]] = None


class ActivityCreate(ActivityBase):
    """Schema for creating activity."""

    pass


class ActivityRead(ActivityBase):
    """Schema for reading activity."""

    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    results: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True


class ActivityUpdate(BaseModel):
    """Schema for updating activity."""

    status: Optional[str] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None


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
        orm_mode = True


class TutoringSessionDetailedRead(TutoringSessionRead):
    """Schema for reading detailed tutoring session."""

    exchanges_count: int = 0
    resources_count: int = 0

    class Config:
        orm_mode = True


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
