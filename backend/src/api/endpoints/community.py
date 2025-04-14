from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    status,
    Query,
)
from typing import List, Optional, Dict
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...db.models.community import (
    StudyGroup,
    StudyGroupMember,
    ForumPost,
    ForumReply,
    CommunityFeedItem,
)
from ...db.models.user import User
from ...core.security import decode_access_token
from ...db.postgresql import get_session
from src.api.endpoints.auth import get_current_user

router = APIRouter(prefix="/community", tags=["community"])


# Store active connections
class ConnectionManager:
    def __init__(self):
        # group_id -> list of websocket connections
        self.active_group_connections: Dict[int, List[dict]] = {}
        # user_id -> websocket connection
        self.user_feed_connections: Dict[int, WebSocket] = {}

    async def connect_to_group(
        self, websocket: WebSocket, group_id: int, user_id: int, user_info: dict
    ):
        await websocket.accept()

        if group_id not in self.active_group_connections:
            self.active_group_connections[group_id] = []

        # Store connection with user info
        self.active_group_connections[group_id].append(
            {"websocket": websocket, "user_id": user_id, "user_info": user_info}
        )

        # Notify group members about the new user
        await self.broadcast_to_group(
            group_id=group_id,
            message={
                "type": "user_joined",
                "user_id": user_id,
                "user_name": user_info.get("full_name", "User"),
                "timestamp": datetime.utcnow().isoformat(),
            },
            exclude_user=None,  # Don't exclude anyone, everyone should know
        )

    async def disconnect_from_group(
        self, websocket: WebSocket, group_id: int, user_id: int
    ):
        if group_id in self.active_group_connections:
            # Find and remove the connection
            for i, conn in enumerate(self.active_group_connections[group_id]):
                if conn["websocket"] == websocket:
                    user_info = conn["user_info"]
                    self.active_group_connections[group_id].pop(i)

                    # Notify group members about the user leaving
                    await self.broadcast_to_group(
                        group_id=group_id,
                        message={
                            "type": "user_left",
                            "user_id": user_id,
                            "user_name": user_info.get("full_name", "User"),
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        exclude_user=user_id,
                    )
                    break

            # If no more connections, remove the group
            if not self.active_group_connections[group_id]:
                del self.active_group_connections[group_id]

    async def broadcast_to_group(
        self, group_id: int, message: dict, exclude_user: Optional[int] = None
    ):
        if group_id in self.active_group_connections:
            for connection in self.active_group_connections[group_id]:
                if exclude_user is None or connection["user_id"] != exclude_user:
                    await connection["websocket"].send_text(json.dumps(message))

    async def connect_to_feed(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.user_feed_connections[user_id] = websocket

    async def disconnect_from_feed(self, user_id: int):
        if user_id in self.user_feed_connections:
            del self.user_feed_connections[user_id]

    async def send_feed_update(self, user_id: int, message: dict):
        if user_id in self.user_feed_connections:
            await self.user_feed_connections[user_id].send_text(json.dumps(message))

    async def broadcast_feed_update(
        self, message: dict, user_ids: Optional[List[int]] = None
    ):
        # Either send to specific users or broadcast to all
        if user_ids:
            for user_id in user_ids:
                await self.send_feed_update(user_id, message)
        else:
            for user_id in self.user_feed_connections:
                await self.send_feed_update(user_id, message)


# Create an instance of the connection manager
manager = ConnectionManager()


# Helper function to verify WebSocket authentication
async def get_user_from_token(token: str, db: AsyncSession):
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            return None

        # Query the database using async session
        stmt = select(User).where(User.id == int(user_id))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        return user
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


@router.websocket("/ws/study-groups/{group_id}/chat")
async def websocket_group_chat(
    websocket: WebSocket,
    group_id: int,
    token: str = Query(...),
    db: AsyncSession = Depends(get_session),
):
    # Verify the user token
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check if user is a member of the group
    stmt = select(StudyGroupMember).where(
        StudyGroupMember.user_id == user.id, StudyGroupMember.group_id == group_id
    )
    result = await db.execute(stmt)
    membership = result.scalar_one_or_none()

    if not membership:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Get user info to share with other clients
    user_info = {"id": user.id, "full_name": user.full_name, "avatar": user.avatar}

    try:
        # Connect to the group chat
        await manager.connect_to_group(websocket, group_id, user.id, user_info)

        # Load recent chat history
        message_history = await get_recent_group_messages(db, group_id)
        for message in message_history:
            await websocket.send_text(json.dumps(message))

        # Handle messages
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # Validate incoming message
            if message_data.get("type") != "chat_message" or not message_data.get(
                "content"
            ):
                continue

            # Create message object
            message = {
                "type": "chat_message",
                "content": message_data.get("content"),
                "user_id": user.id,
                "user_name": user.full_name,
                "user_avatar": user.avatar,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Save message to database
            await save_group_message(db, group_id, user.id, message)

            # Broadcast to all other group members
            await manager.broadcast_to_group(group_id, message)

    except WebSocketDisconnect:
        await manager.disconnect_from_group(websocket, group_id, user.id)


@router.websocket("/ws/community-feed")
async def websocket_community_feed(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_session),
):
    # Verify the user token
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        # Connect to the feed
        await manager.connect_to_feed(websocket, user.id)

        # Send recent feed items
        feed_items = await get_recent_feed_items(db, user.id)
        for item in feed_items:
            await websocket.send_text(json.dumps(item))

        # Keep connection open but don't expect incoming messages
        # (Feed is one-way communication from server to client)
        while True:
            await websocket.receive_text()  # Just to keep the connection alive

    except WebSocketDisconnect:
        await manager.disconnect_from_feed(user.id)


# Database interaction functions
async def get_recent_group_messages(db: AsyncSession, group_id: int, limit: int = 50):
    """Retrieve recent messages for a study group."""
    # This would be a model for storing chat messages
    # For example, create a StudyGroupMessage model
    try:
        from ...db.models.community import StudyGroupMessage

        stmt = (
            select(StudyGroupMessage, User)
            .join(User, StudyGroupMessage.user_id == User.id)
            .where(StudyGroupMessage.group_id == group_id)
            .order_by(StudyGroupMessage.created_at.desc())
            .limit(limit)
        )

        result = await db.execute(stmt)
        messages = []

        for msg, user in result:
            messages.append(
                {
                    "type": "chat_message",
                    "content": msg.content,
                    "user_id": user.id,
                    "user_name": user.full_name,
                    "user_avatar": user.avatar,
                    "timestamp": msg.created_at.isoformat(),
                }
            )

        # Return in correct chronological order (oldest first)
        return list(reversed(messages))

    except Exception as e:
        print(f"Error fetching group messages: {e}")
        return []


async def save_group_message(
    db: AsyncSession, group_id: int, user_id: int, message_data: dict
):
    """Save a chat message to the database."""
    try:
        from ...db.models.community import StudyGroupMessage

        new_message = StudyGroupMessage(
            group_id=group_id,
            user_id=user_id,
            content=message_data.get("content"),
            created_at=datetime.fromisoformat(message_data.get("timestamp")),
        )

        db.add(new_message)
        await db.commit()

    except Exception as e:
        await db.rollback()
        print(f"Error saving group message: {e}")


async def get_recent_feed_items(db: AsyncSession, user_id: int, limit: int = 20):
    """Get recent feed items relevant to a user."""
    try:
        # Get user's study groups
        user_groups_stmt = select(StudyGroupMember.group_id).where(
            StudyGroupMember.user_id == user_id
        )
        result = await db.execute(user_groups_stmt)
        user_group_ids = [row[0] for row in result]

        # Feed items would come from multiple sources:
        # 1. New forum posts in topics of interest
        # 2. Activity in user's study groups
        # 3. System announcements, etc.

        # For example, recent forum posts:

        stmt = (
            select(CommunityFeedItem)
            .where(
                (CommunityFeedItem.is_public)
                | (CommunityFeedItem.group_id.in_(user_group_ids))
                | (CommunityFeedItem.target_user_id == user_id)
            )
            .order_by(CommunityFeedItem.created_at.desc())
            .limit(limit)
        )

        result = await db.execute(stmt)
        feed_items = []

        for item in result.scalars():
            feed_items.append(
                {
                    "id": item.id,
                    "type": item.item_type,  # "forum_post", "group_update", "announcement", etc.
                    "title": item.title,
                    "content": item.content,
                    "source": item.source,  # e.g., "forum", "group", "system"
                    "source_id": item.source_id,  # ID of the source (group_id, forum_id, etc.)
                    "timestamp": item.created_at.isoformat(),
                }
            )

        return feed_items

    except Exception as e:
        print(f"Error fetching feed items: {e}")
        return []


@router.get("/study-groups")
async def get_study_groups(db: AsyncSession = Depends(get_session)):
    stmt = select(StudyGroup)
    result = await db.execute(stmt)
    groups = result.scalars().all()

    # Convert to response model
    response = []
    for group in groups:
        # Count members
        member_count_stmt = select(StudyGroupMember).where(
            StudyGroupMember.group_id == group.id
        )
        member_result = await db.execute(member_count_stmt)
        member_count = len(member_result.scalars().all())

        # Get subject if available
        subject = None
        if group.subject_id:
            from ...db.models.content import Subject

            subject_stmt = select(Subject).where(Subject.id == group.subject_id)
            subject_result = await db.execute(subject_stmt)
            subject_obj = subject_result.scalar_one_or_none()
            if subject_obj:
                subject = {"id": subject_obj.id, "name": subject_obj.name}

        # Get creator info
        creator_stmt = select(User).where(User.id == group.created_by)
        creator_result = await db.execute(creator_stmt)
        creator = creator_result.scalar_one_or_none()
        creator_info = (
            {"id": creator.id, "full_name": creator.full_name} if creator else None
        )

        response.append(
            {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "member_count": member_count,
                "is_private": group.is_private,
                "subject": subject,
                "created_by": creator_info,
            }
        )

    return response


@router.post("/study-groups")
async def create_study_group(
    data: dict,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Create new group
    new_group = StudyGroup(
        name=data["name"],
        description=data["description"],
        created_by=current_user.id,
        subject_id=data.get("subject_id"),
        grade_level=data.get("grade_level"),
        is_private=data.get("is_private", False),
    )

    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)

    # Automatically add creator as a member with admin role
    member = StudyGroupMember(
        group_id=new_group.id, user_id=current_user.id, role="admin"
    )

    db.add(member)
    await db.commit()

    # Create a feed item
    feed_item = CommunityFeedItem(
        item_type="group_created",
        title=f"New Study Group: {new_group.name}",
        content=f"{current_user.full_name} created a new study group: {new_group.name}",
        source="group",
        source_id=new_group.id,
        is_public=not new_group.is_private,
    )

    db.add(feed_item)
    await db.commit()

    # Broadcast to community feed if public
    if not new_group.is_private:
        feed_message = {
            "type": "feed_update",
            "item_type": "group_created",
            "title": f"New Study Group: {new_group.name}",
            "content": f"{current_user.full_name} created a new study group: {new_group.name}",
            "source": "group",
            "source_id": new_group.id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await manager.broadcast_feed_update(feed_message)

    return {
        "id": new_group.id,
        "name": new_group.name,
        "description": new_group.description,
    }


@router.post("/study-groups/{group_id}/join")
async def join_study_group(
    group_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Check if group exists
    stmt = select(StudyGroup).where(StudyGroup.id == group_id)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    # Check if already a member
    member_stmt = select(StudyGroupMember).where(
        StudyGroupMember.group_id == group_id,
        StudyGroupMember.user_id == current_user.id,
    )
    member_result = await db.execute(member_stmt)
    existing_member = member_result.scalar_one_or_none()

    if existing_member:
        return {"message": "Already a member of this group"}

    # Add user as member
    new_member = StudyGroupMember(
        group_id=group_id, user_id=current_user.id, role="member"
    )

    db.add(new_member)
    await db.commit()

    # Notify group members via WebSocket if they're connected
    join_message = {
        "type": "member_joined",
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_group(group_id, join_message)

    return {"message": "Successfully joined the group"}


@router.get("/forum-posts")
async def get_forum_posts(db: AsyncSession = Depends(get_session)):
    # Join with users to get author info
    stmt = (
        select(ForumPost, User)
        .join(User, ForumPost.author_id == User.id)
        .where(ForumPost.is_approved)
        .order_by(ForumPost.created_at.desc())
    )

    result = await db.execute(stmt)

    posts = []
    for post, author in result:
        # Get reply count
        reply_stmt = select(ForumReply).where(ForumReply.post_id == post.id)
        reply_result = await db.execute(reply_stmt)
        reply_count = len(reply_result.scalars().all())

        posts.append(
            {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "author": {
                    "id": author.id,
                    "full_name": author.full_name,
                    "avatar": author.avatar,
                },
                "created_at": post.created_at.isoformat(),
                "updated_at": post.updated_at.isoformat() if post.updated_at else None,
                "view_count": post.view_count,
                "upvote_count": post.upvote_count,
                "reply_count": reply_count,
                "tags": post.tags,
                "is_pinned": post.is_pinned,
            }
        )

    return posts


@router.post("/forum-posts")
async def create_forum_post(
    data: dict,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Create new post
    new_post = ForumPost(
        author_id=current_user.id,
        title=data["title"],
        content=data["content"],
        subject_id=data.get("subject_id"),
        topic_id=data.get("topic_id"),
        tags=data.get("tags", []),
    )

    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)

    # Create a feed item
    feed_item = CommunityFeedItem(
        item_type="forum_post",
        title=f"New Forum Post: {new_post.title}",
        content=f"{current_user.full_name} created a new forum post",
        source="forum",
        source_id=new_post.id,
        is_public=True,
        related_post_id=new_post.id,
    )

    db.add(feed_item)
    await db.commit()

    # Broadcast to community feed
    feed_message = {
        "type": "feed_update",
        "item_type": "forum_post",
        "title": f"New Forum Post: {new_post.title}",
        "content": f"{current_user.full_name} created a new forum post",
        "source": "forum",
        "source_id": new_post.id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_feed_update(feed_message)

    return {"id": new_post.id, "title": new_post.title, "content": new_post.content}
