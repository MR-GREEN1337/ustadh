from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship, JSON
import uuid
from sqlalchemy import UniqueConstraint

from .user import User


class Note(SQLModel, table=True):
    """Model for user notes."""

    __tablename__ = "notes"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    content: str
    folder_id: Optional[str] = Field(
        default=None, foreign_key="note_folders.id", index=True
    )
    tags: List[str] = Field(default=[], sa_type=JSON)
    owner_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1)
    ai_enhanced: bool = Field(default=False)

    # Relationships
    owner: "User" = Relationship(back_populates="notes")
    folder: Optional["NoteFolder"] = Relationship(back_populates="notes")
    collaborators: List["NoteCollaborator"] = Relationship(
        back_populates="note", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    ai_suggestions: List["AISuggestion"] = Relationship(
        back_populates="note", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class NoteFolder(SQLModel, table=True):
    """Model for organizing notes into folders."""

    __tablename__ = "note_folders"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    parent_id: Optional[str] = Field(default=None, foreign_key="note_folders.id")
    owner_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    owner: "User" = Relationship(back_populates="note_folders")
    notes: List["Note"] = Relationship(back_populates="folder")
    # Self-referential relationship for parent-child folders
    parent: Optional["NoteFolder"] = Relationship(
        sa_relationship_kwargs={"remote_side": "NoteFolder.id"}
    )
    children: List["NoteFolder"] = Relationship(
        sa_relationship_kwargs={"back_populates": "parent"}
    )


class NoteCollaborator(SQLModel, table=True):
    """Model for collaborative access to notes."""

    __tablename__ = "note_collaborators"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    note_id: str = Field(foreign_key="notes.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    permissions: str = Field(
        default="read", description="Permission level: read, write, admin"
    )
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    note: Note = Relationship(back_populates="collaborators")
    user: "User" = Relationship(back_populates="note_collaborations")

    # Unique constraint to ensure one collaboration per user per note
    __table_args__ = (UniqueConstraint("note_id", "user_id", name="uix_note_user"),)


class AISuggestion(SQLModel, table=True):
    """Model for AI-generated suggestions for notes."""

    __tablename__ = "ai_suggestions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    note_id: str = Field(foreign_key="notes.id", index=True)
    content: str
    type: str = Field(
        description="Suggestion type: completion, clarification, connection, insight"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    applied: bool = Field(default=False)

    # Relationships
    note: Note = Relationship(back_populates="ai_suggestions")
