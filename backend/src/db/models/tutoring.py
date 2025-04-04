from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON
from sqlalchemy import Column, String

from .user import User
from .content import Topic


class TutoringSession(SQLModel, table=True):
    """Model for basic AI tutoring sessions."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    topic_id: int = Field(foreign_key="topic.id")

    # Session details
    title: str  # Derived from initial question or topic
    start_time: datetime = Field(default_factory=datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str = "active"  # "active", "completed", "abandoned"

    # Session data
    context: Dict[str, Any] = Field(default={}, sa_type=JSON)
    feedback: Dict[str, Any] = Field(default={}, sa_type=JSON)
    messages: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Analytics
    total_messages: int = 0
    user_messages: int = 0
    ai_messages: int = 0
    topics_covered: List[str] = Field(default=[], sa_type=JSON)

    # Relationships
    user: User = Relationship(back_populates="tutoring_sessions")
    topic: Topic = Relationship(back_populates="tutoring_sessions")


class DetailedTutoringSession(SQLModel, table=True):
    """Advanced model for AI tutoring sessions with various interaction modes."""

    __tablename__ = "detailed_tutoring_session"

    # Change the ID to a string type to accept UUIDs
    id: str = Field(sa_column=Column(String, primary_key=True))
    user_id: int = Field(foreign_key="users.id", index=True)
    topic_id: Optional[int] = Field(default=None, foreign_key="topic.id", index=True)

    # Session core info
    title: str  # Descriptive title for the session
    session_type: str = Field(index=True)  # "chat", "whiteboard", "video", "notes"
    interaction_mode: str  # "text-only", "voice", "ocr-enabled", "interactive-diagram"
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str = "active"  # "active", "paused", "completed", "abandoned"

    # Initial context
    initial_query: str  # The initial question or topic
    difficulty: Optional[int] = None  # 1-5 if applicable

    # Session configuration
    config: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Learning outcomes
    concepts_learned: List[str] = Field(default=[], sa_type=JSON)
    skills_practiced: List[str] = Field(default=[], sa_type=JSON)

    # Relationships
    user: User = Relationship(back_populates="detailed_tutoring_sessions")
    topic: Topic = Relationship(back_populates="detailed_tutoring_sessions")
    exchanges: List["TutoringExchange"] = Relationship(back_populates="session")
    resources: List["SessionResource"] = Relationship(back_populates="session")


class TutoringExchange(SQLModel, table=True):
    """Model for back-and-forth exchanges in a tutoring session."""

    id: Optional[int] = Field(default=None, primary_key=True)
    # Update foreign key to reference string ID
    session_id: str = Field(foreign_key="detailed_tutoring_session.id", index=True)
    sequence: int  # Order in the conversation
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Student input
    student_input_type: str  # "text", "voice", "ocr", "drawing", "file-upload"
    student_input: Dict[str, Any] = Field(sa_type=JSON)

    # AI response
    ai_response_type: str  # "text", "voice", "diagram", "annotation", "correction"
    ai_response: Dict[str, Any] = Field(sa_type=JSON)

    # Learning signals
    learning_signals: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Bookmarked status
    is_bookmarked: bool = False
    bookmarked_at: Optional[datetime] = None

    # Relationships
    session: DetailedTutoringSession = Relationship(back_populates="exchanges")


class SessionResource(SQLModel, table=True):
    """Model for resources used or created during a tutoring session."""

    id: Optional[int] = Field(default=None, primary_key=True)
    # Update foreign key to reference string ID
    session_id: str = Field(foreign_key="detailed_tutoring_session.id", index=True)

    # Resource info
    resource_type: str  # "formula", "diagram", "example", "summary", "practice-problem"
    title: str
    content: Dict[str, Any] = Field(sa_type=JSON)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Usage
    student_saved: bool = False
    saved_at: Optional[datetime] = None

    # Relationships
    session: DetailedTutoringSession = Relationship(back_populates="resources")
