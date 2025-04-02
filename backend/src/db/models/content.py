from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON


class Subject(SQLModel, table=True):
    """Model for academic subjects across grade levels."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    grade_level: str = Field(index=True)
    description: str
    meta_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # For UI templates, icons, etc.

    # Relationships - using string references to avoid circular imports
    topics: List["Topic"] = Relationship(back_populates="subject")
    enrollments: List["Enrollment"] = Relationship(back_populates="subject")  # noqa: F821


class Topic(SQLModel, table=True):
    """Model for topics within subjects."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    subject_id: int = Field(foreign_key="subject.id")
    description: str
    order: int  # Sequence within subject
    meta_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # For time periods, prerequisites, etc.

    # Relationships - using string references to avoid circular imports
    subject: Subject = Relationship(back_populates="topics")
    lessons: List["Lesson"] = Relationship(back_populates="topic")
    sessions: List["TutoringSession"] = Relationship(back_populates="topic")  # noqa: F821


class Lesson(SQLModel, table=True):
    """Model for lessons within topics."""

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    topic_id: int = Field(foreign_key="topic.id")
    content_type: str  # "video", "text", "interactive", "quiz", etc.
    content: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Flexible content storage
    order: int  # Sequence within topic
    meta_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # For duration, difficulty, etc.

    # Relationships - using string references to avoid circular imports
    topic: Topic = Relationship(back_populates="lessons")
    activities: List["Activity"] = Relationship(back_populates="lesson")  # noqa: F821
