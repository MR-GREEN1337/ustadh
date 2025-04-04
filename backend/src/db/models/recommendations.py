from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON

from .user import User
from .content import Subject, Lesson, Topic

from .content import Course

from typing import List


class Recommendation(SQLModel, table=True):
    """Model for personalized learning recommendations."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")

    # Recommendation details
    type: str  # "topic", "lesson", "practice", "tutoring", "course"
    title: str
    description: str
    priority: int = 3  # 1-5 (1 = highest)
    image_url: Optional[str] = None

    # Reference IDs (optional, depends on recommendation type)
    subject_id: Optional[int] = Field(default=None, foreign_key="subject.id")
    topic_id: Optional[int] = Field(default=None, foreign_key="topic.id")
    lesson_id: Optional[int] = Field(default=None, foreign_key="lesson.id")
    course_id: Optional[int] = Field(default=None, foreign_key="course.id")

    # Additional data
    data: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    viewed_at: Optional[datetime] = None
    acted_upon: bool = False
    expires_at: Optional[datetime] = None

    # Relationships
    user: User = Relationship(back_populates="recommendations")
    subject: Optional[Subject] = Relationship()
    topic: Optional[Topic] = Relationship()
    lesson: Optional[Lesson] = Relationship()
    course: Optional[Course] = Relationship()


class ExplorationTopic(SQLModel, table=True):
    """Model for curated exploration topics shown on dashboard."""

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    type: str  # "academic", "interdisciplinary", "cultural", "current-event"
    image_url: Optional[str] = None
    is_featured: bool = False
    is_new: bool = False

    # Topic connections
    connects_concepts: List[str] = Field(default=[], sa_type=JSON)
    related_subjects: List[str] = Field(default=[], sa_type=JSON)

    # Display details
    color_scheme: Optional[str] = None
    icon: Optional[str] = None

    # Content and metadata
    content: Dict[str, Any] = Field(default={}, sa_type=JSON)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    meta_data: Dict[str, Any] = Field(default={}, sa_type=JSON)
