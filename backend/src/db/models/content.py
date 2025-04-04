from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON


# Content Models
class Subject(SQLModel, table=True):
    """Model for academic subjects across grade levels."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    grade_level: str = Field(index=True)
    description: str
    icon: Optional[str] = None  # For UI display
    color_scheme: Optional[str] = None  # For UI theming
    meta_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # For UI templates, icons, etc.

    # Relationships
    topics: List["Topic"] = Relationship(back_populates="subject")
    enrollments: List["Enrollment"] = Relationship(back_populates="subject")  # noqa: F821

    # New fields to match frontend
    courses: List["Course"] = Relationship(back_populates="subject")


class Topic(SQLModel, table=True):
    """Model for topics within subjects."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    subject_id: int = Field(foreign_key="subject.id")
    description: str
    order: int  # Sequence within subject
    difficulty: int = 3  # 1-5 scale
    estimated_duration_minutes: Optional[int] = None
    meta_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # For time periods, prerequisites, etc.

    # Relationships
    subject: Subject = Relationship(back_populates="topics")
    lessons: List["Lesson"] = Relationship(back_populates="topic")
    tutoring_sessions: List["TutoringSession"] = Relationship(back_populates="topic")  # noqa: F821
    detailed_tutoring_sessions: List["DetailedTutoringSession"] = Relationship(  # noqa: F821
        back_populates="topic"
    )


class Course(SQLModel, table=True):
    """Model for courses (collections of topics with specific structure)."""

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    subject_id: int = Field(foreign_key="subject.id")
    description: str
    difficulty_level: int = 3  # 1-5 scale
    is_featured: bool = False
    is_new: bool = False
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))
    meta_data: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)

    # Relationships
    subject: Subject = Relationship(back_populates="courses")
    course_topics: List["CourseTopic"] = Relationship(back_populates="course")


class CourseTopic(SQLModel, table=True):
    """Mapping between courses and topics with sequence order."""

    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    topic_id: int = Field(foreign_key="topic.id")
    order: int  # Sequence within course

    # Relationships
    course: Course = Relationship(back_populates="course_topics")
    topic: Topic = Relationship()


class Lesson(SQLModel, table=True):
    """Model for lessons within topics."""

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    topic_id: int = Field(foreign_key="topic.id")
    content_type: str  # "video", "text", "interactive", "quiz", etc.
    content: Dict[str, Any] = Field(
        default={}, sa_type=JSON
    )  # Flexible content storage
    order: int  # Sequence within topic
    duration_minutes: Optional[int] = None
    difficulty: int = 3  # 1-5 scale
    meta_data: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)

    # Relationships
    topic: Topic = Relationship(back_populates="lessons")
    activities: List["Activity"] = Relationship(back_populates="lesson")  # noqa: F821
