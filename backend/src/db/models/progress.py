from typing import Optional, Dict, Any, List
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


class ScheduleEntry(SQLModel, table=True):
    """Model for user's personal schedule entries (not directly tied to classes)."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # Schedule details
    title: str
    description: Optional[str] = None
    entry_type: str = Field(
        index=True
    )  # "class", "study", "homework", "exam", "custom"

    # Time information
    start_time: datetime
    end_time: datetime
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # "daily", "weekly", "biweekly", "monthly"
    recurrence_end_date: Optional[datetime] = None

    # For recurring events, store which days of week (0-6 for Monday-Sunday)
    days_of_week: List[int] = Field(default=[], sa_type=JSON)

    # For school-related entries
    school_class_id: Optional[int] = Field(
        default=None, foreign_key="schoolclass.id", index=True
    )
    course_id: Optional[int] = Field(
        default=None, foreign_key="schoolcourse.id", index=True
    )
    assignment_id: Optional[int] = Field(
        default=None, foreign_key="assignment.id", index=True
    )

    # For study-related entries
    subject_id: Optional[int] = Field(
        default=None, foreign_key="subject.id", index=True
    )
    topic_id: Optional[int] = Field(default=None, foreign_key="topic.id", index=True)

    # Additional data
    location: Optional[str] = None
    color: Optional[str] = None
    notification_minutes_before: Optional[int] = None

    # Status
    is_completed: bool = False
    is_cancelled: bool = False

    # Metadata
    meta_data: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    user: "User" = Relationship(back_populates="schedule_entries")
    school_class: Optional["SchoolClass"] = Relationship()  # noqa: F821
    course: Optional["SchoolCourse"] = Relationship()  # noqa: F821
    assignment: Optional["Assignment"] = Relationship()  # noqa: F821
    subject: Optional["Subject"] = Relationship()  # noqa: F821
    topic: Optional["Topic"] = Relationship()  # noqa: F821
