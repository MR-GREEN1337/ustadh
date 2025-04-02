from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON

from .user import User
from .content import Topic


class DetailedTutoringSession(SQLModel, table=True):
    """Model for AI tutoring sessions with various interaction modes."""

    __tablename__ = (
        "detailed_tutoring_session"  # Explicit table name to avoid conflicts
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    topic_id: int = Field(foreign_key="topic.id", index=True)

    # Session core info
    session_type: str = Field(
        index=True
    )  # "text", "math", "physics", "drawing", "chemistry", "language"
    interaction_mode: (
        str  # "text-only", "voice", "ocr-enabled", "interactive-diagram", "whiteboard"
    )
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str = "active"  # "active", "paused", "completed", "abandoned"

    # Initial context
    initial_query: str  # The initial question or topic
    difficulty: Optional[int] = None  # 1-5 if applicable

    # Session configuration
    config: Dict[str, Any] = Field(
        default={}, sa_type=JSON
    )  # Voice settings, OCR settings, UI preferences

    # Relationships - using string references to avoid circular imports
    user: "User" = Relationship()
    topic: "Topic" = Relationship()
    exchanges: List["TutoringExchange"] = Relationship(back_populates="session")
    resources: List["SessionResource"] = Relationship(back_populates="session")


class TutoringExchange(SQLModel, table=True):
    """Model for back-and-forth exchanges in a tutoring session."""

    id: Optional[int] = Field(default=None, primary_key=True)

    session_id: int = Field(
        foreign_key="detailed_tutoring_session.id", index=True
    )  # Updated foreign key
    sequence: int  # Order in the conversation
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Student input
    student_input_type: str  # "text", "voice", "ocr", "drawing", "file-upload"
    student_input: Dict[str, Any] = Field(sa_type=JSON)  # Content depends on input type

    # AI response
    ai_response_type: str  # "text", "voice", "diagram", "annotation", "correction"
    ai_response: Dict[str, Any] = Field(
        sa_type=JSON
    )  # Content depends on response type

    # Learning signals
    learning_signals: Optional[Dict[str, Any]] = Field(
        default=None, sa_type=JSON
    )  # Confusion, understanding, etc.

    # Relationships
    session: DetailedTutoringSession = Relationship(back_populates="exchanges")


class SessionResource(SQLModel, table=True):
    """Model for resources used or created during a tutoring session."""

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(
        foreign_key="detailed_tutoring_session.id", index=True
    )  # Updated foreign key

    # Resource info
    resource_type: str  # "formula", "diagram", "example", "summary", "practice-problem"
    title: str
    content: Dict[str, Any] = Field(sa_type=JSON)  # Content depends on resource type
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Usage
    student_saved: bool = False  # Whether student saved for future reference

    # Relationships
    session: DetailedTutoringSession = Relationship(back_populates="resources")
