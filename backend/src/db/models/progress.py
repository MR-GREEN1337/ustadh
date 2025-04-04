from typing import Optional, Dict, Any
from sqlmodel import JSON
from datetime import datetime, timezone

from .user import User
from .content import Subject, Lesson

from sqlmodel import Relationship, SQLModel, Field


class Enrollment(SQLModel, table=True):
    """Model for subject enrollments."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    subject_id: int = Field(foreign_key="subject.id")
    enrolled_at: datetime = Field(default_factory=datetime.now(timezone.utc))
    active: bool = True
    completed: bool = False
    completed_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None

    # Progress tracking
    progress_percentage: float = 0.0
    progress_data: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Relationships
    user: User = Relationship(back_populates="enrollments")
    subject: Subject = Relationship(back_populates="enrollments")


class Activity(SQLModel, table=True):
    """Model for all learning activities including assessments."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    lesson_id: Optional[int] = Field(default=None, foreign_key="lesson.id")

    # Activity details
    type: str  # "lesson", "quiz", "practice", "tutoring", "homework"
    status: str = "started"  # "started", "in_progress", "completed", "abandoned"
    start_time: datetime = Field(default_factory=datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    # Performance metrics
    score: Optional[float] = None
    max_score: Optional[float] = None
    mastery_level: Optional[float] = None  # 0-1 scale

    # Flexible data fields for different activity types
    data: Dict[str, Any] = Field(default={}, sa_type=JSON)
    results: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Relationships
    user: User = Relationship(back_populates="activities")
    lesson: Optional[Lesson] = Relationship(back_populates="activities")


class Achievement(SQLModel, table=True):
    """Model for user achievements and badges."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")

    title: str
    description: str
    type: str  # "badge", "milestone", "certificate", "streak"
    icon: str
    awarded_at: datetime = Field(default_factory=datetime.now(timezone.utc))
    points: int = 0
    meta_data: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Relationships
    user: User = Relationship(back_populates="achievements")
