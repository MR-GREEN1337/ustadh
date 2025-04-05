from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON


class Subject(SQLModel, table=True):
    """Enhanced subject model with education level mapping"""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)

    # Updated to match education_level in User model
    grade_level: str = Field(index=True)  # primary_1, bac_2, university, etc.

    description: str
    icon: Optional[str] = None
    color_scheme: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)

    # Added fields to match subject options in onboarding
    subject_code: str = Field(index=True)  # mathematics, physics, arabic, etc.
    teaching_language: Optional[str] = None  # ar, fr, en

    # For university subjects
    university_track: Optional[str] = None  # uni_fs, uni_medicine, etc.

    # For high school subjects
    academic_track: Optional[str] = None  # sciences_math_a, lettres_phil, etc.

    # Relationships (existing)
    topics: List["Topic"] = Relationship(back_populates="subject")
    enrollments: List["Enrollment"] = Relationship(back_populates="subject")  # noqa: F821
    courses: List["Course"] = Relationship(back_populates="subject")  # noqa: F821

    # New relationships for onboarding preferences
    interested_users: List["UserSubjectInterest"] = Relationship(
        back_populates="subject"
    )


class UserSubjectInterest(SQLModel, table=True):
    """New model to track user subject interests from onboarding"""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    subject_id: int = Field(foreign_key="subject.id", index=True)
    interest_level: int = 5  # Scale 1-5, default high since selected in onboarding
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="subject_interests")  # noqa: F821
    subject: "Subject" = Relationship(back_populates="interested_users")  # noqa: F821


class Course(SQLModel, table=True):
    """Enhanced course model with education level and track mapping"""

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    subject_id: int = Field(foreign_key="subject.id")
    description: str
    difficulty_level: int = 3  # 1-5 scale
    is_featured: bool = False
    is_new: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Added fields to match education levels and tracks
    education_level: str = Field(index=True)  # primary_1, bac_2, university, etc.
    academic_track: Optional[str] = Field(
        default=None, index=True
    )  # sciences_math_a, uni_medicine
    region_specific: bool = False
    region: Optional[str] = None  # For region-specific curriculum

    # Metadata enhanced to store preferences that would make this course relevant
    meta_data: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)

    # Relationships (existing)
    subject: Subject = Relationship(back_populates="courses")
    course_topics: List["CourseTopic"] = Relationship(back_populates="course")


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
