from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON

from .user import User


class Notification(SQLModel, table=True):
    """Model for user notifications."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")

    title: str
    content: str
    type: str  # "achievement", "reminder", "system", "progress", "social"
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

    # Link to relevant content
    action_type: Optional[str] = None  # "open_session", "view_progress", etc.
    action_data: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Relationships
    user: User = Relationship(back_populates="notifications")


class Message(SQLModel, table=True):
    """Model for messages between users."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")  # Sender
    recipient_id: int = Field(foreign_key="users.id")

    subject: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

    # Attachments and metadata
    has_attachments: bool = False
    attachments: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Relationships
    user: User = Relationship(
        back_populates="messages",
        sa_relationship_kwargs={"foreign_keys": "[Message.user_id]"},
    )
    recipient: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Message.recipient_id]"}
    )
