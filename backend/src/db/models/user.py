from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON

from .progress import Enrollment, Activity


class User(SQLModel, table=True):
    """User model for students, parents, and supervisors."""

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str

    # User type
    user_type: str = Field(index=True)  # "student", "parent", "supervisor", "admin"

    # Student-specific fields
    grade_level: Optional[str] = Field(default=None, index=True)  # Only for students
    school_type: Optional[str] = Field(default=None, index=True)  # Only for students

    # Flexible preferences/settings storage as JSON
    preferences: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)

    # System fields
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships - using string references to avoid circular imports
    guardians: List["Guardian"] = Relationship(
        back_populates="student",
        sa_relationship_kwargs={"primaryjoin": "User.id==Guardian.student_id"},
    )
    supervised_by: List["Guardian"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"primaryjoin": "User.id==Guardian.parent_id"},
    )
    enrollments: List["Enrollment"] = Relationship(back_populates="user")
    activities: List["Activity"] = Relationship(back_populates="user")


class Guardian(SQLModel, table=True):
    """Model for parent/guardian relationships to students."""

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", index=True)
    parent_id: int = Field(foreign_key="user.id", index=True)
    relationship: str  # "parent", "guardian", "teacher", "counselor"
    can_view: bool = True
    can_edit: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships - using string references to avoid circular imports
    student: "User" = Relationship(
        back_populates="guardians",
        sa_relationship_kwargs={"primaryjoin": "Guardian.student_id==User.id"},
    )
    parent: "User" = Relationship(
        back_populates="supervised_by",
        sa_relationship_kwargs={"primaryjoin": "Guardian.parent_id==User.id"},
    )
