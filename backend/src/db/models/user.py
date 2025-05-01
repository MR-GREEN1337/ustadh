from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlmodel import JSON
from sqlmodel import Relationship


class User(SQLModel, table=True):
    """Enhanced User database model with improved avatar support"""

    __tablename__ = "users"

    id: int = Field(default=None, primary_key=True)

    # Basic info
    email: str = Field(..., index=True, unique=True)
    username: str = Field(..., index=True, unique=True)
    full_name: str
    hashed_password: str

    # Enhanced Avatar support
    avatar: Optional[str] = None  # URL to avatar image
    avatar_metadata: Dict[str, Any] = Field(
        default={}, sa_type=JSON
    )  # Stores metadata about the avatar
    avatar_updated_at: Optional[datetime] = None  # When the avatar was last updated

    # Profile data
    locale: str = "ar"  # Default to Arabic, options: ar, fr, en
    bio: Optional[str] = None  # User biography/about me

    # User type and detailed education info
    user_type: str = Field(..., index=True)  # student, teacher, parent, school_admin

    # Education level mapping from onboarding
    education_level: Optional[str] = Field(default=None, index=True)
    # Options: primary_1 through primary_6, college_7 through college_9,
    # tronc_commun, bac_1, bac_2, university

    # School information
    school_type: Optional[str] = Field(default=None, index=True)
    # Options: public, private, mission, international, homeschool
    school_name: Optional[str] = None
    region: Optional[str] = Field(default=None, index=True)
    # Options: casablanca-settat, rabat-sale-kenitra, marrakech-safi, etc.

    # Academic track (filière)
    academic_track: Optional[str] = Field(default=None, index=True)
    # For high school: sciences_math_a, svt_pc, etc.
    # For university: uni_fst, uni_medicine, etc.

    # Learning preferences
    learning_style: Optional[str] = Field(default=None)
    # Options: visual, auditory, reading, kinesthetic
    study_habits: List[str] = Field(default=[], sa_type=JSON)
    # Options: morning, evening, concentrated, spaced, group, individual
    academic_goals: List[str] = Field(default=[], sa_type=JSON)
    # Options: academic-excellence, bac-preparation, etc.

    # Account status
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    has_onboarded: bool = Field(default=False)

    # Security and tracking fields
    failed_login_attempts: int = Field(default=0)
    last_login_attempt: Optional[datetime] = None
    last_login: Optional[datetime] = None
    token_revoked_at: Optional[datetime] = None

    # Account creation and updates
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Password reset tracking
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None

    # User settings and preferences
    settings: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Privacy and data preferences
    data_consent: bool = Field(default=False)

    # Relationships
    schedule_entries: List["ScheduleEntry"] = Relationship(back_populates="user")  # noqa: F821
    guardians: List["Guardian"] = Relationship(
        back_populates="student",
        sa_relationship_kwargs={"foreign_keys": "[Guardian.student_id]"},
    )
    supervised_students: List["Guardian"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"foreign_keys": "[Guardian.parent_id]"},
    )
    enrollments: List["Enrollment"] = Relationship(back_populates="user")  # noqa: F821
    activities: List["Activity"] = Relationship(back_populates="user")  # noqa: F821
    tutoring_sessions: List["TutoringSession"] = Relationship(back_populates="user")  # noqa: F821
    detailed_tutoring_sessions: List["DetailedTutoringSession"] = Relationship(  # noqa: F821
        back_populates="user"
    )
    recommendations: List["Recommendation"] = Relationship(back_populates="user")  # noqa: F821
    achievements: List["Achievement"] = Relationship(back_populates="user")  # noqa: F821
    notifications: List["Notification"] = Relationship(back_populates="user")  # noqa: F821
    messages: List["Message"] = Relationship(  # noqa: F821
        back_populates="user",
        sa_relationship_kwargs={"foreign_keys": "[Message.user_id]"},
    )

    # New relationship for file attachments
    uploaded_files: List["UserFile"] = Relationship(back_populates="user")  # noqa: F821
    subject_interests: List["UserSubjectInterest"] = Relationship(back_populates="user")  # noqa: F821

    # Add the missing notes relationship
    notes: List["Note"] = Relationship(back_populates="owner")  # noqa: F821

    # Add the missing note_folders relationship
    note_folders: List["NoteFolder"] = Relationship(back_populates="owner")  # noqa: F821

    # Add the missing note_collaborations relationship
    note_collaborations: List["NoteCollaborator"] = Relationship(back_populates="user")  # noqa: F821

    whiteboard_sessions: List["WhiteboardSession"] = Relationship(back_populates="user")  # noqa: F821


class UserFile(SQLModel, table=True):
    """Enhanced model for tracking file uploads across the application"""

    __tablename__ = "user_files"

    id: int = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # File details
    file_key: str  # S3 key/path
    file_name: str
    file_type: str  # MIME type
    file_size: int  # Size in bytes
    file_url: str  # Permanent URL
    thumbnail_url: Optional[str] = None  # Optional thumbnail for images/documents

    # Categorization
    file_category: str = Field(
        index=True
    )  # avatar, course_material, assignment, message_attachment, etc.
    session_id: Optional[str] = Field(
        default=None, index=True
    )  # For chat/tutor sessions
    reference_id: Optional[str] = Field(
        default=None, index=True
    )  # Reference to other entity (assignment, message, etc)

    # Enhanced sharing and management
    owner_type: str = Field(
        default="user", index=True
    )  # user, professor, admin, system
    is_deleted: bool = Field(default=False)
    is_public: bool = Field(default=False)  # Globally accessible
    shared_with: List[Dict[str, Any]] = Field(
        default=[], sa_type=JSON
    )  # List of user IDs or roles with access
    sharing_level: str = Field(
        default="private"
    )  # private, shared, department, school, public

    # Academic context
    course_id: Optional[int] = Field(default=None, index=True)
    school_id: Optional[int] = Field(default=None, index=True)
    department_id: Optional[int] = Field(default=None, index=True)

    # Content metadata
    file_metadata: Dict[str, Any] = Field(default={}, sa_type=JSON)
    content_status: str = Field(default="ready")  # ready, processing, error

    # Source tracking
    uploaded_by_name: Optional[str] = None  # For display purposes
    source_type: Optional[str] = None  # upload, generation, system, etc.

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None  # For temporary files

    # Relationships
    user: User = Relationship(back_populates="uploaded_files")


class Guardian(SQLModel, table=True):
    """Model for parent/guardian relationships to students."""

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id", index=True)
    parent_id: int = Field(foreign_key="users.id", index=True)
    relationship: str  # "parent", "guardian", "teacher", "counselor"
    can_view_progress: bool = True
    can_view_messages: bool = True
    can_edit_profile: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    student: User = Relationship(
        back_populates="guardians",
        sa_relationship_kwargs={"primaryjoin": "Guardian.student_id==User.id"},
    )
    parent: User = Relationship(
        back_populates="supervised_students",
        sa_relationship_kwargs={"primaryjoin": "Guardian.parent_id==User.id"},
    )
