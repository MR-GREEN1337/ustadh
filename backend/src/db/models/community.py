from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship, JSON

from .user import User
from .content import Subject, Topic


class StudySession(SQLModel, table=True):
    """Model for scheduled study sessions."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")

    title: str
    session_type: str  # "focused", "practice", "homework", "review"
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int

    # Link to content
    subject_id: Optional[int] = Field(default=None, foreign_key="subject.id")
    topic_id: Optional[int] = Field(default=None, foreign_key="topic.id")

    # Status
    status: str = "scheduled"  # "scheduled", "in_progress", "completed", "cancelled"

    # Results
    summary: Optional[str] = None
    productivity_score: Optional[float] = None
    achievements: List[str] = Field(default=[], sa_type=JSON)

    # Relationships
    user: User = Relationship()
    subject: Optional[Subject] = Relationship()
    topic: Optional[Topic] = Relationship()


class StudyGroup(SQLModel, table=True):
    """Model for community study groups."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    created_by: int = Field(foreign_key="users.id")

    # Group details
    subject_id: Optional[int] = Field(default=None, foreign_key="subject.id")
    grade_level: Optional[str] = None
    is_private: bool = False

    # Status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True

    # Relationships
    creator: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[StudyGroup.created_by]"}
    )
    subject: Optional[Subject] = Relationship()
    members: List["StudyGroupMember"] = Relationship(back_populates="group")


class StudyGroupMember(SQLModel, table=True):
    """Model for study group membership."""

    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="studygroup.id")
    user_id: int = Field(foreign_key="users.id")

    # Membership details
    role: str = "member"  # "member", "moderator", "admin"
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    group: StudyGroup = Relationship(back_populates="members")
    user: User = Relationship()


class ForumPost(SQLModel, table=True):
    """Model for community forum posts."""

    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int = Field(foreign_key="users.id")

    title: str
    content: str

    # Categorization
    subject_id: Optional[int] = Field(default=None, foreign_key="subject.id")
    topic_id: Optional[int] = Field(default=None, foreign_key="topic.id")
    tags: List[str] = Field(default=[], sa_type=JSON)

    # Status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_pinned: bool = False
    is_approved: bool = True

    # Statistics
    view_count: int = 0
    upvote_count: int = 0

    # Relationships
    author: User = Relationship()
    subject: Optional[Subject] = Relationship()
    topic: Optional[Topic] = Relationship()
    replies: List["ForumReply"] = Relationship(back_populates="post")


class ForumReply(SQLModel, table=True):
    """Model for replies to forum posts."""

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="forumpost.id")
    author_id: int = Field(foreign_key="users.id")

    content: str

    # Status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_solution: bool = False

    # Stats
    upvote_count: int = 0

    # Relationships
    post: ForumPost = Relationship(back_populates="replies")
    author: User = Relationship()


class StudyGroupMessage(SQLModel, table=True):
    """Model for messages in study group chats."""

    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="studygroup.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    content: str
    is_system_message: bool = False
    is_deleted: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    group: "StudyGroup" = Relationship()
    user: "User" = Relationship()


class CommunityFeedItem(SQLModel, table=True):
    """Model for community feed items."""

    id: Optional[int] = Field(default=None, primary_key=True)

    # Item metadata
    item_type: str  # "forum_post", "group_update", "announcement", etc.
    title: str
    content: str

    # Source information
    source: str  # "forum", "group", "system", etc.
    source_id: Optional[int] = None  # Optional ID of the source

    # Visibility and targeting
    is_public: bool = True
    group_id: Optional[int] = Field(
        default=None, foreign_key="studygroup.id", index=True
    )
    target_user_id: Optional[int] = Field(
        default=None, foreign_key="users.id", index=True
    )

    # For attaching to specific entities
    related_post_id: Optional[int] = Field(default=None, foreign_key="forumpost.id")
    related_reply_id: Optional[int] = Field(default=None, foreign_key="forumreply.id")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    # Relationships
    group: Optional["StudyGroup"] = Relationship()
    target_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[CommunityFeedItem.target_user_id]"}
    )
    related_post: Optional["ForumPost"] = Relationship()
    related_reply: Optional["ForumReply"] = Relationship()
