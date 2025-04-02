from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON

# Import models using string references to avoid circular imports
from .content import Subject, Lesson, Topic


class Enrollment(SQLModel, table=True):
    """Model for subject enrollments."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")  # Changed from "user.id" to "users.id"
    subject_id: int = Field(foreign_key="subject.id")
    enrolled_at: datetime = Field(default_factory=datetime.now(timezone.utc))
    active: bool = True
    completed: bool = False
    completed_at: Optional[datetime] = None

    # Progress tracking
    progress_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Flexible progress storage

    # Relationships - using string references to avoid circular imports
    user: "User" = Relationship(back_populates="enrollments")  # noqa: F821
    subject: "Subject" = Relationship(back_populates="enrollments")  # noqa: F821


class Activity(SQLModel, table=True):
    """Model for all learning activities including assessments."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")  # Changed from "user.id" to "users.id"
    lesson_id: Optional[int] = Field(default=None, foreign_key="lesson.id")

    # Activity details
    type: str  # "lesson", "quiz", "practice", "tutoring"
    status: str = "started"  # "started", "completed", "abandoned"
    start_time: datetime = Field(default_factory=datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    # Flexible data fields for different activity types
    data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Questions, answers, scores, etc.
    results: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Performance metrics

    # Relationships - using string references to avoid circular imports
    user: "User" = Relationship(back_populates="activities")  # noqa: F821
    lesson: Optional["Lesson"] = Relationship(back_populates="activities")  # noqa: F821


class TutoringSession(SQLModel, table=True):
    """Model for AI tutoring sessions."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")  # Changed from "user.id" to "users.id"
    topic_id: int = Field(foreign_key="topic.id")

    # Session details
    start_time: datetime = Field(default_factory=datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str = "active"  # "active", "completed", "abandoned"

    # Session data
    context: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Initial question, difficulty, etc.
    feedback: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Student rating, comments
    messages: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # All session messages

    # Relationships - using string references to avoid circular imports
    user: "User" = Relationship()  # noqa: F821
    topic: "Topic" = Relationship(back_populates="sessions")  # noqa: F821
