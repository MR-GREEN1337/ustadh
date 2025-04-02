from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

from sqlmodel import Relationship


class User(SQLModel, table=True):
    """User database model"""

    __tablename__ = "users"

    id: int = Field(default=None, primary_key=True)

    # Basic info
    email: str = Field(..., index=True, unique=True)
    username: str = Field(..., index=True, unique=True)
    full_name: str
    hashed_password: str

    # User type and school info
    user_type: str = Field(..., index=True)  # student, teacher, admin
    grade_level: Optional[int] = None
    school_type: Optional[str] = None  # public, private, homeschool, online

    # Account status
    is_active: bool = Field(default=True)

    # Security and tracking fields
    failed_login_attempts: int = Field(default=0)
    last_login_attempt: Optional[datetime] = None
    last_login: Optional[datetime] = None
    token_revoked_at: Optional[datetime] = None

    # Account creation
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Password reset tracking
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None

    guardians: list["Guardian"] = Relationship(
        back_populates="student",
        sa_relationship_kwargs={"foreign_keys": "[Guardian.student_id]"},
    )

    supervised_by: list["Guardian"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"foreign_keys": "[Guardian.parent_id]"},
    )

    enrollments: list["Enrollment"] = Relationship(back_populates="user")  # noqa: F821
    activities: list["Activity"] = Relationship(back_populates="user")  # noqa: F821
    tutoring_sessions: list["TutoringSession"] = Relationship(  # noqa: F821
        sa_relationship_kwargs={"back_populates": "user"}
    )
    recommendations: list["Recommendation"] = Relationship(  # noqa: F821
        sa_relationship_kwargs={"back_populates": "user"}
    )


class Guardian(SQLModel, table=True):
    """Model for parent/guardian relationships to students."""

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(
        foreign_key="users.id", index=True
    )  # Changed from "user.id" to "users.id"
    parent_id: int = Field(
        foreign_key="users.id", index=True
    )  # Changed from "user.id" to "users.id"
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
