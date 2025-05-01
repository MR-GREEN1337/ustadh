from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    WebSocket,
    WebSocketDisconnect,
    BackgroundTasks,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import json
import base64
import asyncio

from src.db.postgresql import get_session as get_db_session
from src.db.models.user import User

# Import the models with a different name to avoid confusion
from src.db.models.whiteboard import WhiteboardSession as DBWhiteboardSession
from src.db.models.whiteboard import WhiteboardInteraction as DBWhiteboardInteraction
from src.api.endpoints.auth import get_current_active_user

router = APIRouter(prefix="/whiteboard", tags=["whiteboard"])


# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, message: str, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_text(message)


manager = ConnectionManager()


# Models
class WhiteboardSessionBase(BaseModel):
    title: str
    description: Optional[str] = None
    education_level: Optional[str] = None
    related_session_id: Optional[str] = None
    ai_enabled: bool = True
    ai_model: Optional[str] = None


class WhiteboardSessionCreate(WhiteboardSessionBase):
    pass


class WhiteboardSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    education_level: Optional[str] = None
    current_state: Optional[Dict[str, Any]] = None
    ai_enabled: Optional[bool] = None
    ai_model: Optional[str] = None


class WhiteboardSessionResponse(WhiteboardSessionBase):
    id: str
    user_id: int
    status: str
    current_state: Dict[str, Any]
    snapshots: List[Dict[str, Any]]
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WhiteboardInteractionCreate(BaseModel):
    type: str = Field(
        ...,
        description="Type of interaction: screenshot, query, response, annotation, equation",
    )
    content: Dict[str, Any]
    image_url: Optional[str] = None
    ocr_text: Optional[str] = None


class WhiteboardInteractionResponse(WhiteboardInteractionCreate):
    id: str
    session_id: str
    timestamp: datetime
    ai_processed: bool = False
    ai_response: Optional[Dict[str, Any]] = None
    processing_time_ms: Optional[int] = None

    class Config:
        from_attributes = True


class WhiteboardMessage(BaseModel):
    action: str
    data: Dict[str, Any]


class WhiteboardSessionList(BaseModel):
    sessions: List[WhiteboardSessionResponse]
    total: int
    page: int
    page_size: int


# Helper functions
async def get_session_by_id(
    session_id: str, db_session: AsyncSession
) -> Optional[DBWhiteboardSession]:
    """Get whiteboard session by ID."""
    try:
        # Use db_session instead of db to make it clearer this is a database session
        result = await db_session.execute(
            select(DBWhiteboardSession).where(DBWhiteboardSession.id == session_id)
        )
        return result.scalars().first()
    except Exception as e:
        print(f"Error fetching whiteboard session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve whiteboard session",
        )


async def check_session_access(
    session_id: str, user_id: int, db_session: AsyncSession
) -> DBWhiteboardSession:
    """Check if user has access to the whiteboard session."""
    session = await get_session_by_id(session_id, db_session)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Whiteboard session not found"
        )

    # For now, only session owner has access
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this whiteboard session",
        )

    return session


async def process_screenshot(
    interaction_id: str, image_data: str, db_session: AsyncSession
):
    """
    Process screenshot with LLM vision model.
    This runs in the background to avoid blocking the API.
    """
    try:
        # Decode the base64 image
        image_bytes = base64.b64decode(image_data.split(",")[1])  # noqa: F841

        # Get the interaction
        result = await db_session.execute(
            select(DBWhiteboardInteraction).where(
                DBWhiteboardInteraction.id == interaction_id
            )
        )
        interaction = result.scalars().first()

        if not interaction:
            print(f"Interaction {interaction_id} not found")
            return

        start_time = datetime.utcnow()

        # TODO: Implement actual LLM vision processing here
        # For now, we'll simulate processing with a simple delay
        await asyncio.sleep(2)

        # Update the interaction with processed data
        interaction.ai_processed = True
        interaction.ocr_text = (
            "Sample OCR text for demonstration"  # Replace with actual OCR result
        )
        interaction.ai_response = {
            "identified_math": "y = x^2 + 3x - 2",
            "explanation": "This appears to be a quadratic function. The graph opens upward with vertex near x = -1.5.",
            "suggestions": [
                "Consider exploring how changing the coefficient of x^2 affects the shape",
                "Calculate the exact location of the vertex using x = -b/2a",
            ],
        }

        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds() * 1000
        interaction.processing_time_ms = int(processing_time)

        # Save to database
        db_session.add(interaction)
        await db_session.commit()

        # Notify connected clients about the processed result
        if interaction.session_id in manager.active_connections:
            message = {
                "action": "ai_response",
                "data": {
                    "interaction_id": interaction_id,
                    "ai_response": interaction.ai_response,
                    "ocr_text": interaction.ocr_text,
                },
            }
            await manager.broadcast(json.dumps(message), interaction.session_id)

    except Exception as e:
        print(f"Error processing screenshot: {str(e)}")


# Endpoints
@router.post(
    "/sessions",
    response_model=WhiteboardSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    session_data: WhiteboardSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db_session),
):
    """Create a new whiteboard session."""
    new_session = DBWhiteboardSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=session_data.title or "Untitled Session",
        description=session_data.description,
        related_session_id=session_data.related_session_id,
        education_level=session_data.education_level,
        ai_enabled=session_data.ai_enabled
        if session_data.ai_enabled is not None
        else True,
        ai_model=session_data.ai_model,
        current_state={},
        snapshots=[],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db_session.add(new_session)
    await db_session.commit()
    await db_session.refresh(new_session)

    return new_session


@router.get("/sessions", response_model=WhiteboardSessionList)
async def list_sessions(
    status: Optional[str] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db_session),
):
    """Get user's whiteboard sessions with optional filtering."""
    # Build base query
    base_query = select(DBWhiteboardSession).where(
        DBWhiteboardSession.user_id == current_user.id
    )

    # Apply filters
    if status:
        base_query = base_query.where(DBWhiteboardSession.status == status)

    # Count total matching sessions
    count_query = base_query.with_only_columns(DBWhiteboardSession.id).distinct()
    count_result = await db_session.execute(count_query)
    total_sessions = len(count_result.scalars().all())

    # Apply sorting
    if sort_by == "created_at":
        base_query = base_query.order_by(
            desc(DBWhiteboardSession.created_at)
            if sort_order == "desc"
            else DBWhiteboardSession.created_at
        )
    elif sort_by == "title":
        base_query = base_query.order_by(
            desc(DBWhiteboardSession.title)
            if sort_order == "desc"
            else DBWhiteboardSession.title
        )
    else:  # default to updated_at
        base_query = base_query.order_by(
            desc(DBWhiteboardSession.updated_at)
            if sort_order == "desc"
            else DBWhiteboardSession.updated_at
        )

    # Apply pagination
    base_query = base_query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db_session.execute(base_query)
    sessions = result.scalars().all()

    # Build response
    sessions_list = []
    for session in sessions:
        session_dict = {
            k: v for k, v in session.__dict__.items() if not k.startswith("_")
        }
        session_dict["user_id"] = int(session.user_id)  # Ensure user_id is an int
        sessions_list.append(session_dict)

    return {
        "sessions": sessions_list,
        "total": total_sessions,
        "page": page,
        "page_size": page_size,
    }


@router.get("/sessions/{session_id}", response_model=WhiteboardSessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db_session),
):
    """Get a specific whiteboard session by ID."""
    session = await check_session_access(session_id, current_user.id, db_session)
    return session


@router.put("/sessions/{session_id}", response_model=WhiteboardSessionResponse)
async def update_session(
    session_id: str,
    session_data: WhiteboardSessionUpdate,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db_session),
):
    """Update a whiteboard session."""
    session = await check_session_access(session_id, current_user.id, db_session)

    # Update session fields
    update_data = session_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    # Update timestamp
    session.updated_at = datetime.utcnow()

    # If status is changing to completed, set end time
    if update_data.get("status") == "completed" and not session.end_time:
        session.end_time = datetime.utcnow()
        if session.start_time:
            session.duration_seconds = int(
                (session.end_time - session.start_time).total_seconds()
            )

    # Save state to snapshots if provided
    if update_data.get("current_state"):
        # Create a snapshot with timestamp
        snapshot = {
            "timestamp": datetime.utcnow().isoformat(),
            "state": session.current_state,
        }
        session.snapshots.append(snapshot)

    # Save changes
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)

    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db_session),
):
    """Delete or archive a whiteboard session."""
    session = await check_session_access(session_id, current_user.id, db_session)

    # Instead of deleting, mark as archived
    session.status = "archived"
    session.updated_at = datetime.utcnow()

    db_session.add(session)
    await db_session.commit()

    return {"message": "Session archived successfully"}


@router.post(
    "/sessions/{session_id}/interactions", response_model=WhiteboardInteractionResponse
)
async def create_interaction(
    session_id: str,
    interaction_data: WhiteboardInteractionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db_session),
):
    """Create a new interaction within a whiteboard session."""
    session = await check_session_access(session_id, current_user.id, db_session)  # noqa: F841

    # Create new interaction
    interaction_id = str(uuid.uuid4())
    new_interaction = DBWhiteboardInteraction(
        id=interaction_id,
        session_id=session_id,
        type=interaction_data.type,
        content=interaction_data.content,
        image_url=interaction_data.image_url,
        ocr_text=interaction_data.ocr_text,
        timestamp=datetime.utcnow(),
    )

    db_session.add(new_interaction)
    await db_session.commit()
    await db_session.refresh(new_interaction)

    # If this is a screenshot, process with LLM vision in background
    if (
        interaction_data.type == "screenshot"
        and "image_data" in interaction_data.content
    ):
        background_tasks.add_task(
            process_screenshot,
            interaction_id,
            interaction_data.content["image_data"],
            db_session,
        )

    return new_interaction


@router.get(
    "/sessions/{session_id}/interactions",
    response_model=List[WhiteboardInteractionResponse],
)
async def list_interactions(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db_session: AsyncSession = Depends(get_db_session),
):
    """Get interactions for a whiteboard session."""
    try:
        # Check access to the session
        await check_session_access(session_id, current_user.id, db_session)

        # Get interactions ordered by timestamp
        result = await db_session.execute(
            select(DBWhiteboardInteraction)
            .where(DBWhiteboardInteraction.session_id == session_id)
            .order_by(DBWhiteboardInteraction.timestamp)
        )
        interactions = result.scalars().all()

        return interactions
    except HTTPException:
        # Re-raise HTTP exceptions for proper error handling
        raise
    except Exception as e:
        print(f"Error retrieving interactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve whiteboard interactions",
        )


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time whiteboard session interaction."""
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Broadcast the message to all connected clients for this session
            await manager.broadcast(data, session_id)

            # Handle specific actions
            if message.get("action") == "update_state":
                # This would update the session state in the database
                # For simplicity, we're just broadcasting the update for now
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        # Notify others that a user has left
        await manager.broadcast(
            json.dumps(
                {"action": "disconnect", "data": {"message": "A user disconnected"}}
            ),
            session_id,
        )
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, session_id)
