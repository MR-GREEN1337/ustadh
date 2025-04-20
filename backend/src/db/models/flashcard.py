from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship, JSON
import uuid

from .user import User
from .tutoring import DetailedTutoringSession


class Flashcard(SQLModel, table=True):
    """Model for storing flashcards associated with tutoring sessions."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_id: str = Field(foreign_key="detailed_tutoring_session.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # Content
    front: str  # Question or term
    back: str  # Answer or explanation
    tags: List[str] = Field(default=[], sa_type=JSON)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Study metrics
    review_count: int = Field(default=0)
    last_reviewed: Optional[datetime] = None
    confidence_level: int = Field(default=0)  # 0-5 scale

    # Relationships
    session: DetailedTutoringSession = Relationship(back_populates="flashcards")
    user: User = Relationship()
