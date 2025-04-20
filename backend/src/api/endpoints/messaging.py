from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    status,
    Query,
    BackgroundTasks,
    Body,
)
from typing import Optional, Dict
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from ...db.models.communication import Message
from ...db.models.user import User
from ...db.models.school import SchoolStaff, SchoolStudent
from ...core.security import decode_access_token
from ...db.postgresql import get_session
from src.api.endpoints.auth import get_current_user

router = APIRouter(prefix="/messaging", tags=["messaging"])


# Store active messaging connections
class MessageConnectionManager:
    def __init__(self):
        # user_id -> websocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    async def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, user_id: int, message: dict):
        """Send a message to a specific user if they're connected."""
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))
            return True
        return False


# Create an instance of the connection manager
message_manager = MessageConnectionManager()


async def get_user_from_token(token: str, db: AsyncSession):
    try:
        payload = decode_access_token(token)
        username = payload.get("sub")  # This contains 'hachimii', not an ID

        if not username:
            return None

        # Query the database using the username, not ID
        stmt = select(User).where(User.username == username)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        return user
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


@router.websocket("/ws/messages")
async def websocket_messages(
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
        # Connect to the websocket
        await message_manager.connect(websocket, user.id)

        # Send unread message count notification
        unread_count = await get_unread_message_count(db, user.id)
        await websocket.send_text(
            json.dumps({"type": "unread_count", "count": unread_count})
        )

        # Keep connection open and handle message events
        while True:
            # This will wait for any incoming messages from the client
            data = await websocket.receive_text()

            # Process any client events (like marking messages as read)
            # We don't expect regular messages here as they'll use the HTTP endpoint
            try:
                event = json.loads(data)
                event_type = event.get("type")

                if event_type == "mark_read":
                    message_id = event.get("message_id")
                    if message_id:
                        await mark_message_as_read(db, message_id, user.id)

                elif event_type == "mark_conversation_read":
                    other_user_id = event.get("user_id")
                    if other_user_id:
                        await mark_conversation_as_read(db, user.id, other_user_id)

            except json.JSONDecodeError:
                # Invalid JSON, ignore
                pass

    except WebSocketDisconnect:
        await message_manager.disconnect(user.id)


async def get_unread_message_count(db: AsyncSession, user_id: int) -> int:
    """Get the count of unread messages for a user."""
    stmt = (
        select(func.count())
        .select_from(Message)
        .where(and_(Message.recipient_id == user_id, not Message.is_read))
    )
    result = await db.execute(stmt)
    return result.scalar_one()


async def mark_message_as_read(db: AsyncSession, message_id: int, user_id: int):
    """Mark a specific message as read if the user is the recipient."""
    stmt = select(Message).where(
        and_(Message.id == message_id, Message.recipient_id == user_id)
    )
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()

    if message and not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        await db.commit()


async def mark_conversation_as_read(db: AsyncSession, user_id: int, other_user_id: int):
    """Mark all messages in a conversation as read."""
    stmt = select(Message).where(
        and_(
            Message.recipient_id == user_id,
            Message.user_id == other_user_id,
            not Message.is_read,
        )
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    now = datetime.utcnow()
    for message in messages:
        message.is_read = True
        message.read_at = now

    if messages:
        await db.commit()


async def notify_new_message(
    background_tasks: BackgroundTasks,
    recipient_id: int,
    message_data: dict,
    db: AsyncSession,
):
    """Send a notification about a new message to the recipient."""
    # Check if user is connected
    was_delivered = await message_manager.send_message(
        recipient_id, {"type": "new_message", "message": message_data}
    )

    # If the message wasn't delivered via WebSocket, we might want to send
    # a notification through other channels (email, push notification, etc.)
    if not was_delivered:
        # This would be implemented based on your notification system
        # For example, create a notification record in the database
        pass


@router.post("/send")
async def send_message(
    message_data: dict = Body(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Send a new message to another user."""
    recipient_id = message_data.get("recipient_id")
    if not recipient_id:
        raise HTTPException(status_code=400, detail="Recipient ID is required")

    # Check if recipient exists
    stmt = select(User).where(User.id == recipient_id)
    result = await db.execute(stmt)
    recipient = result.scalar_one_or_none()

    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Create the message
    new_message = Message(
        user_id=current_user.id,
        recipient_id=recipient_id,
        subject=message_data.get("subject", ""),
        content=message_data.get("content", ""),
        has_attachments=bool(message_data.get("attachments")),
        attachments=message_data.get("attachments", {}),
    )

    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)

    # Prepare message data for response and notification
    message_response = {
        "id": new_message.id,
        "subject": new_message.subject,
        "content": new_message.content,
        "sender": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "avatar": current_user.avatar,
        },
        "created_at": new_message.created_at.isoformat(),
        "is_read": False,
        "has_attachments": new_message.has_attachments,
    }

    # Notify the recipient in background
    background_tasks.add_task(
        notify_new_message,
        recipient_id=recipient_id,
        message_data=message_response,
        db=db,
    )

    return message_response


@router.get("/conversations")
async def get_conversations(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a list of all conversations for the current user."""
    # This query gets the latest message from each conversation
    # We first need to find all users the current user has exchanged messages with
    sent_messages = select(Message.recipient_id.distinct()).where(
        Message.user_id == current_user.id
    )
    received_messages = select(Message.user_id.distinct()).where(
        Message.recipient_id == current_user.id
    )

    # Execute both queries
    sent_result = await db.execute(sent_messages)
    received_result = await db.execute(received_messages)

    # Combine unique user IDs
    contact_ids = set(row[0] for row in sent_result) | set(
        row[0] for row in received_result
    )

    # Now get the latest message and unread count for each conversation
    conversations = []
    for contact_id in contact_ids:
        # Get latest message
        latest_message_stmt = (
            select(Message)
            .where(
                or_(
                    and_(
                        Message.user_id == current_user.id,
                        Message.recipient_id == contact_id,
                    ),
                    and_(
                        Message.user_id == contact_id,
                        Message.recipient_id == current_user.id,
                    ),
                )
            )
            .order_by(Message.created_at.desc())
            .limit(1)
        )

        latest_result = await db.execute(latest_message_stmt)
        latest_message = latest_result.scalar_one_or_none()

        if not latest_message:
            continue

        # Get unread count from this contact
        unread_stmt = (
            select(func.count())
            .select_from(Message)
            .where(
                and_(
                    Message.user_id == contact_id,
                    Message.recipient_id == current_user.id,
                    not Message.is_read,
                )
            )
        )
        unread_result = await db.execute(unread_stmt)
        unread_count = unread_result.scalar_one()

        # Get contact user info
        user_stmt = select(User).where(User.id == contact_id)
        user_result = await db.execute(user_stmt)
        contact_user = user_result.scalar_one_or_none()

        if not contact_user:
            continue

        # Get user role information
        role_info = await get_user_role_info(db, contact_user)

        conversations.append(
            {
                "user": {
                    "id": contact_user.id,
                    "full_name": contact_user.full_name,
                    "avatar": contact_user.avatar,
                    "user_type": contact_user.user_type,
                    "role_info": role_info,
                },
                "latest_message": {
                    "id": latest_message.id,
                    "subject": latest_message.subject,
                    "preview": latest_message.content[:100] + "..."
                    if len(latest_message.content) > 100
                    else latest_message.content,
                    "created_at": latest_message.created_at.isoformat(),
                    "is_read": latest_message.is_read,
                    "is_from_me": latest_message.user_id == current_user.id,
                },
                "unread_count": unread_count,
            }
        )

    # Sort by latest message time (newest first)
    conversations.sort(key=lambda x: x["latest_message"]["created_at"], reverse=True)

    return conversations


async def get_user_role_info(db: AsyncSession, user: User) -> dict:
    """Get additional role information based on user type."""
    role_info = {"title": ""}

    if user.user_type == "teacher" or user.user_type == "school_admin":
        # Get staff information
        staff_stmt = select(SchoolStaff).where(SchoolStaff.user_id == user.id)
        staff_result = await db.execute(staff_stmt)
        staff = staff_result.scalar_one_or_none()

        if staff:
            role_info["staff_id"] = staff.id
            role_info["staff_type"] = staff.staff_type
            if staff.staff_type == "teacher":
                role_info["title"] = "Teacher"
            elif staff.staff_type == "admin":
                role_info["title"] = "Administrator"
            elif staff.staff_type == "principal":
                role_info["title"] = "Principal"
            else:
                role_info["title"] = staff.staff_type.capitalize()

    elif user.user_type == "student":
        # Get student information
        student_stmt = select(SchoolStudent).where(SchoolStudent.user_id == user.id)
        student_result = await db.execute(student_stmt)
        student = student_result.scalar_one_or_none()

        if student:
            role_info["student_id"] = student.id
            role_info["education_level"] = student.education_level
            role_info["title"] = "Student"

    return role_info


@router.get("/messages/{user_id}")
async def get_conversation_messages(
    user_id: int,
    limit: int = 50,
    before_id: Optional[int] = None,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get messages between the current user and another user."""
    # Build base query for messages between these two users
    query = select(Message).where(
        or_(
            and_(Message.user_id == current_user.id, Message.recipient_id == user_id),
            and_(Message.user_id == user_id, Message.recipient_id == current_user.id),
        )
    )

    # Add pagination if needed
    if before_id:
        # Get message to find its timestamp
        id_stmt = select(Message).where(Message.id == before_id)
        id_result = await db.execute(id_stmt)
        reference_message = id_result.scalar_one_or_none()

        if reference_message:
            # Get messages before this timestamp
            query = query.where(Message.created_at < reference_message.created_at)

    # Order by newest to oldest and limit results
    query = query.order_by(Message.created_at.desc()).limit(limit)

    # Execute query
    result = await db.execute(query)
    messages = result.scalars().all()

    # Get user info for both participants
    other_user_stmt = select(User).where(User.id == user_id)
    other_user_result = await db.execute(other_user_stmt)
    other_user = other_user_result.scalar_one_or_none()

    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Format response
    message_list = []
    for msg in messages:
        is_from_me = msg.user_id == current_user.id
        sender = current_user if is_from_me else other_user

        message_list.append(
            {
                "id": msg.id,
                "subject": msg.subject,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
                "is_read": msg.is_read,
                "read_at": msg.read_at.isoformat() if msg.read_at else None,
                "is_from_me": is_from_me,
                "sender": {
                    "id": sender.id,
                    "full_name": sender.full_name,
                    "avatar": sender.avatar,
                },
                "has_attachments": msg.has_attachments,
                "attachments": msg.attachments if msg.has_attachments else None,
            }
        )

    # Reverse the list to get chronological order (oldest to newest)
    message_list.reverse()

    # Mark all received messages as read
    await mark_conversation_as_read(db, current_user.id, user_id)

    return {
        "messages": message_list,
        "user": {
            "id": other_user.id,
            "full_name": other_user.full_name,
            "avatar": other_user.avatar,
            "user_type": other_user.user_type,
            "role_info": await get_user_role_info(db, other_user),
        },
    }


@router.get("/contacts")
async def get_contacts(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a list of available contacts based on user's role."""
    contacts = []

    # The available contacts depend on user's role
    if current_user.user_type == "student":
        # Students can message their teachers and administrators
        # First, let's check if the student is in a school
        student_stmt = select(SchoolStudent).where(
            SchoolStudent.user_id == current_user.id
        )
        student_result = await db.execute(student_stmt)
        student = student_result.scalar_one_or_none()

        if student and student.school_id:
            # Get all teachers and staff from the student's school
            staff_stmt = (
                select(SchoolStaff, User)
                .join(User, SchoolStaff.user_id == User.id)
                .where(SchoolStaff.school_id == student.school_id, User.is_active)
            )

            staff_result = await db.execute(staff_stmt)
            for staff, user in staff_result:
                contacts.append(
                    {
                        "id": user.id,
                        "full_name": user.full_name,
                        "avatar": user.avatar,
                        "user_type": user.user_type,
                        "role": staff.staff_type,
                        "role_title": staff.staff_type.capitalize(),
                        "is_teacher": staff.is_teacher,
                    }
                )

    elif current_user.user_type in ["teacher", "school_admin"]:
        # Teachers and admins can message students and other staff
        # Get the staff record to find their school
        staff_stmt = select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
        staff_result = await db.execute(staff_stmt)
        staff = staff_result.scalar_one_or_none()

        if staff and staff.school_id:
            # Get all students from this school
            students_stmt = (
                select(SchoolStudent, User)
                .join(User, SchoolStudent.user_id == User.id)
                .where(SchoolStudent.school_id == staff.school_id, User.is_active)
            )

            students_result = await db.execute(students_stmt)
            for student, user in students_result:
                contacts.append(
                    {
                        "id": user.id,
                        "full_name": user.full_name,
                        "avatar": user.avatar,
                        "user_type": "student",
                        "role": "student",
                        "role_title": "Student",
                        "education_level": student.education_level,
                    }
                )

            # Get other staff from this school
            other_staff_stmt = (
                select(SchoolStaff, User)
                .join(User, SchoolStaff.user_id == User.id)
                .where(
                    SchoolStaff.school_id == staff.school_id,
                    SchoolStaff.user_id != current_user.id,  # Exclude self
                    User.is_active,
                )
            )

            other_staff_result = await db.execute(other_staff_stmt)
            for other, user in other_staff_result:
                contacts.append(
                    {
                        "id": user.id,
                        "full_name": user.full_name,
                        "avatar": user.avatar,
                        "user_type": user.user_type,
                        "role": other.staff_type,
                        "role_title": other.staff_type.capitalize(),
                        "is_teacher": other.is_teacher,
                    }
                )

    # Sort contacts by name
    contacts.sort(key=lambda x: x["full_name"])

    return contacts


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a message if the user is the sender."""
    stmt = select(Message).where(
        and_(Message.id == message_id, Message.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=404, detail="Message not found or you don't have permission"
        )

    # Delete the message
    await db.delete(message)
    await db.commit()

    return {"success": True}
