from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON


class CourseAITutoringSession(SQLModel, table=True):
    """Model for AI tutoring sessions integrated with courses."""

    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="schoolcourse.id", index=True)
    student_id: int = Field(foreign_key="schoolstudent.id", index=True)

    # Session details
    title: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    # Session data
    context: Dict[str, Any] = Field(default={}, sa_type=JSON)
    learning_objectives: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Status
    status: str = "active"  # active, completed, paused

    # Relationships
    course: "SchoolCourse" = Relationship(back_populates="tutoring_sessions")  # noqa: F821

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
