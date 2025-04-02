from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON

from .user import User
from .content import Subject, Lesson, Topic


class Recommendation(SQLModel, table=True):
    """Model for personalized learning recommendations."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")

    # Recommendation details
    type: str  # "topic", "lesson", "practice", "tutoring"
    title: str
    description: str
    priority: int = 3  # 1-5 (1 = highest)

    # Reference IDs (optional, depends on recommendation type)
    subject_id: Optional[int] = Field(default=None, foreign_key="subject.id")
    topic_id: Optional[int] = Field(default=None, foreign_key="topic.id")
    lesson_id: Optional[int] = Field(default=None, foreign_key="lesson.id")

    # Additional data
    data: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Reason, context, etc.

    # Status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    viewed_at: Optional[datetime] = None
    acted_upon: bool = False

    # Relationships - using string references to avoid circular imports
    user: "User" = Relationship()
    subject: Optional["Subject"] = Relationship()
    topic: Optional["Topic"] = Relationship()
    lesson: Optional["Lesson"] = Relationship()
