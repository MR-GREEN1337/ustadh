from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON
import uuid

from .user import User
from .tutoring import DetailedTutoringSession


class WhiteboardSession(SQLModel, table=True):
    """Model for interactive whiteboard tutoring sessions."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    related_session_id: Optional[str] = Field(
        default=None, foreign_key="detailed_tutoring_session.id", index=True
    )

    # Session details
    title: str
    description: Optional[str] = None
    status: str = "active"  # "active", "paused", "completed", "archived"

    # Academic context - making subject_id and topic_id truly optional
    # No foreign key constraint for flexibility
    subject_id: Optional[int] = Field(default=None, index=True)
    topic_id: Optional[int] = Field(default=None, index=True)
    education_level: Optional[str] = None  # primary_1, bac_2, etc.

    # Session timing
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    # Content storage
    current_state: Dict[str, Any] = Field(default={}, sa_type=JSON)  # Desmos state
    snapshots: List[Dict[str, Any]] = Field(
        default=[], sa_type=JSON
    )  # List of board states during session

    # AI integration
    ai_enabled: bool = True
    ai_model: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships - keeping these optional since we're no longer enforcing foreign keys
    user: "User" = Relationship(back_populates="whiteboard_sessions")
    related_session: Optional["DetailedTutoringSession"] = Relationship()
    interactions: List["WhiteboardInteraction"] = Relationship(back_populates="session")


class WhiteboardInteraction(SQLModel, table=True):
    """Model for interactions during a whiteboard session."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_id: str = Field(foreign_key="whiteboardsession.id", index=True)

    # Interaction details
    type: str  # "screenshot", "query", "response", "annotation", "equation"
    content: Dict[str, Any] = Field(
        sa_type=JSON
    )  # Flexible storage for various interaction types

    # Screenshot specific fields
    image_url: Optional[str] = None
    ocr_text: Optional[str] = None

    # Timing
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # AI processing
    ai_processed: bool = False
    ai_response: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)
    processing_time_ms: Optional[int] = None

    # Relationships
    session: WhiteboardSession = Relationship(back_populates="interactions")
