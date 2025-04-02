from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select

from src.db import get_session
from src.api.models.tutoring import (
    TutoringExchangeCreate,
    TutoringExchangeRead,
    SessionResourceCreate,
    SessionResourceRead,
)
from src.api.models.progress import (
    TutoringSessionCreate,
    TutoringSessionRead,
    TutoringSessionDetailedRead,
)
from src.db.models.progress import TutoringSession
from src.db.models.tutoring import TutoringExchange, SessionResource
from src.db.models.content import Topic
from src.db.models.user import User, Guardian
from src.api.endpoints.auth import get_current_active_user

router = APIRouter(prefix="/tutoring", tags=["tutoring"])


# Tutoring session endpoints
@router.post("/sessions", response_model=TutoringSessionRead)
async def create_tutoring_session(
    session_create: TutoringSessionCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Create a new tutoring session."""
    # Verify the topic exists
    topic = session.get(Topic, session_create.topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found"
        )

    # Check if current user is creating a session for themselves or if they're authorized
    is_authorized = False

    if session_create.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == session_create.user_id)
        ).first()

        if guardian and guardian.can_edit:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create tutoring session for this user",
        )

    # Create new tutoring session
    db_session = TutoringSession(
        user_id=session_create.user_id,
        topic_id=session_create.topic_id,
        session_type=session_create.session_type,
        interaction_mode=session_create.interaction_mode,
        initial_query=session_create.initial_query,
        difficulty=session_create.difficulty,
        config=session_create.config,
    )

    session.add(db_session)
    session.commit()
    session.refresh(db_session)

    return db_session


@router.get("/sessions", response_model=List[TutoringSessionRead])
async def get_tutoring_sessions(
    limit: int = 10,
    offset: int = 0,
    status: Optional[str] = None,
    session_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get tutoring sessions for the current user."""
    query = select(TutoringSession).where(TutoringSession.user_id == current_user.id)

    # Apply filters
    if status:
        query = query.where(TutoringSession.status == status)
    if session_type:
        query = query.where(TutoringSession.session_type == session_type)

    # Apply pagination
    query = query.offset(offset).limit(limit)

    # Execute query
    tutoring_sessions = session.exec(query).all()

    return tutoring_sessions


@router.get("/sessions/{session_id}", response_model=TutoringSessionDetailedRead)
async def get_tutoring_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get details of a specific tutoring session."""
    tutoring_session = session.get(TutoringSession, session_id)
    if not tutoring_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tutoring session not found"
        )

    # Check if current user is authorized to view this session
    is_authorized = False

    if tutoring_session.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == tutoring_session.user_id)
        ).first()

        if guardian and guardian.can_view:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this tutoring session",
        )

    # Count exchanges and resources for detailed view
    exchanges_count = session.exec(
        select(TutoringExchange).where(TutoringExchange.session_id == session_id)
    ).count()

    resources_count = session.exec(
        select(SessionResource).where(SessionResource.session_id == session_id)
    ).count()

    # Build the detailed response
    detailed_session = TutoringSessionDetailedRead(
        **tutoring_session.dict(),
        exchanges_count=exchanges_count,
        resources_count=resources_count,
    )

    return detailed_session


@router.patch("/sessions/{session_id}/end", response_model=TutoringSessionRead)
async def end_tutoring_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """End a tutoring session."""
    tutoring_session = session.get(TutoringSession, session_id)
    if not tutoring_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tutoring session not found"
        )

    # Check if session is already ended
    if tutoring_session.status == "completed" or tutoring_session.status == "abandoned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is already {tutoring_session.status}",
        )

    # Check if current user is authorized to end this session
    is_authorized = False

    if tutoring_session.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to end this tutoring session",
        )

    # Update session status
    tutoring_session.status = "completed"
    tutoring_session.end_time = datetime.utcnow()

    # Calculate duration if not already set
    if not tutoring_session.duration_seconds and tutoring_session.start_time:
        delta = tutoring_session.end_time - tutoring_session.start_time
        tutoring_session.duration_seconds = int(delta.total_seconds())

    session.add(tutoring_session)
    session.commit()
    session.refresh(tutoring_session)

    return tutoring_session


# Tutoring exchange endpoints
@router.post("/exchanges", response_model=TutoringExchangeRead)
async def create_tutoring_exchange(
    exchange_create: TutoringExchangeCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Create a new tutoring exchange (student input and AI response)."""
    # Get the tutoring session
    tutoring_session = session.get(TutoringSession, exchange_create.session_id)
    if not tutoring_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tutoring session not found"
        )

    # Check if session is active
    if tutoring_session.status != "active" and tutoring_session.status != "paused":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add exchanges to a {tutoring_session.status} session",
        )

    # Check if current user is authorized to add exchanges to this session
    is_authorized = False

    if tutoring_session.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add exchanges to this session",
        )

    # Get the next sequence number
    next_sequence = 1
    last_exchange = session.exec(
        select(TutoringExchange)
        .where(TutoringExchange.session_id == exchange_create.session_id)
        .order_by(TutoringExchange.sequence.desc())
    ).first()

    if last_exchange:
        next_sequence = last_exchange.sequence + 1

    # In a real application, you would call your AI service here to generate a response
    # For now, we'll simulate an AI response
    ai_response = {
        "response_type": "text",
        "content": {
            "text": "This is a simulated AI response to your question.",
            "confidence": 0.95,
        },
    }

    # Create new exchange
    db_exchange = TutoringExchange(
        session_id=exchange_create.session_id,
        sequence=next_sequence,
        student_input_type=exchange_create.student_input_type,
        student_input=exchange_create.student_input,
        ai_response_type="text",  # In a real app, this would be set by the AI service
        ai_response=ai_response,
        learning_signals=None,  # This would be populated by the AI service
    )

    session.add(db_exchange)
    session.commit()
    session.refresh(db_exchange)

    # In a background task, you might want to analyze the exchange for learning signals
    # background_tasks.add_task(analyze_learning_signals, db_exchange.id)

    return db_exchange


@router.get(
    "/sessions/{session_id}/exchanges", response_model=List[TutoringExchangeRead]
)
async def get_tutoring_exchanges(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get all exchanges for a specific tutoring session."""
    # Verify the tutoring session exists
    tutoring_session = session.get(TutoringSession, session_id)
    if not tutoring_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tutoring session not found"
        )

    # Check if current user is authorized to view this session's exchanges
    is_authorized = False

    if tutoring_session.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == tutoring_session.user_id)
        ).first()

        if guardian and guardian.can_view:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view exchanges for this session",
        )

    # Get exchanges
    exchanges = session.exec(
        select(TutoringExchange)
        .where(TutoringExchange.session_id == session_id)
        .order_by(TutoringExchange.sequence)
    ).all()

    return exchanges


# Session resource endpoints
@router.post("/resources", response_model=SessionResourceRead)
async def create_session_resource(
    resource_create: SessionResourceCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Create a new session resource."""
    # Verify the tutoring session exists
    tutoring_session = session.get(TutoringSession, resource_create.session_id)
    if not tutoring_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tutoring session not found"
        )

    # Check if current user is authorized to add resources to this session
    is_authorized = False

    if tutoring_session.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add resources to this session",
        )

    # Create new resource
    db_resource = SessionResource(
        session_id=resource_create.session_id,
        resource_type=resource_create.resource_type,
        title=resource_create.title,
        content=resource_create.content,
    )

    session.add(db_resource)
    session.commit()
    session.refresh(db_resource)

    return db_resource


@router.get(
    "/sessions/{session_id}/resources", response_model=List[SessionResourceRead]
)
async def get_session_resources(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get all resources for a specific tutoring session."""
    # Verify the tutoring session exists
    tutoring_session = session.get(TutoringSession, session_id)
    if not tutoring_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tutoring session not found"
        )

    # Check if current user is authorized to view this session's resources
    is_authorized = False

    if tutoring_session.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == tutoring_session.user_id)
        ).first()

        if guardian and guardian.can_view:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view resources for this session",
        )

    # Get resources
    resources = session.exec(
        select(SessionResource).where(SessionResource.session_id == session_id)
    ).all()

    return resources


@router.patch("/resources/{resource_id}/save", response_model=SessionResourceRead)
async def save_session_resource(
    resource_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Save a session resource for future reference."""
    # Get the resource
    resource = session.get(SessionResource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found"
        )

    # Get the associated tutoring session
    tutoring_session = session.get(TutoringSession, resource.session_id)
    if not tutoring_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tutoring session not found"
        )

    # Check if current user is authorized to save this resource
    is_authorized = False

    if tutoring_session.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to save this resource",
        )

    # Update the resource
    resource.student_saved = True

    session.add(resource)
    session.commit()
    session.refresh(resource)

    return resource
