from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import StreamingResponse, JSONResponse
from sqlmodel import select
from sqlalchemy import func, delete, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.postgresql import get_session as get_db_session
from src.db.models.tutoring import (
    DetailedTutoringSession,
    TutoringExchange,
    SessionResource,
)
from src.db.models.content import Topic
from src.db.models.user import User
from src.api.endpoints.auth import get_current_active_user
from src.core.llm import LLM, Message as LLMMessage, LLMConfig
from src.core.settings import settings

router = APIRouter(prefix="/tutoring", tags=["tutoring"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    session_id: Optional[str] = None
    topic_id: Optional[int] = None
    new_session: bool = False
    session_title: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None


async def generate_streaming_response(
    llm_instance: LLM, messages: List[LLMMessage], config: LLMConfig
):
    """Stream response from LLM and format for event-stream"""
    full_response = ""

    try:
        async for chunk in llm_instance.generate_stream(messages, config):
            full_response += chunk
            yield f"data: {json.dumps({'content': chunk})}\n\n"

        # Signal completion with the full response
        yield f"data: {json.dumps({'content': '', 'done': True, 'full_response': full_response})}\n\n"

    except Exception as e:
        # Log error and yield error message
        print(f"Error in streaming: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


# Update the chat endpoint in your FastAPI router to ensure Exchange-Id is sent correctly
@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Endpoint for chat-based tutoring with streaming response"""
    try:
        # Set up LLM based on request or defaults
        provider = (
            request.provider.lower()
            if request.provider
            else settings.DEFAULT_LLM_PROVIDER
        )
        llm = LLM(provider=provider)

        # Determine which model to use
        model = request.model or settings.DEFAULT_LLM_MODEL

        # Configure LLM
        config = LLMConfig(
            model=model,
            temperature=0.7,
            max_tokens=2048,
        )

        session = None
        is_new_session = request.new_session or not request.session_id

        # If continuing existing session, retrieve it
        if not is_new_session and request.session_id:
            statement = select(DetailedTutoringSession).where(
                DetailedTutoringSession.id == request.session_id,
                DetailedTutoringSession.user_id == current_user.id,
            )
            # Changed db.exec to db.execute
            result = await db.execute(statement)
            session = result.scalar_one_or_none()

            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tutoring session not found",
                )

        # Create new session if needed
        if is_new_session:
            # Validate topic if provided
            topic = None
            if request.topic_id:
                statement = select(Topic).where(Topic.id == request.topic_id)
                # Changed db.exec to db.execute
                result = await db.execute(statement)
                topic = result.scalar_one_or_none()

                if not topic:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found"
                    )

            # Create new session
            session = DetailedTutoringSession(
                id=str(uuid.uuid4()) if not request.session_id else request.session_id,
                user_id=current_user.id,
                topic_id=request.topic_id if topic else None,
                title=request.session_title or request.messages[0].content[:50],
                session_type="chat",
                interaction_mode="text-only",
                initial_query=request.messages[0].content,
                status="active",
                model=model,
                provider=provider,
            )

            db.add(session)
            await db.commit()
            await db.refresh(session)

        # Extract the latest user message
        user_message = request.messages[-1] if request.messages else None

        if not user_message or user_message.role != "user":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Last message must be from user",
            )

        # Create exchange record for this message
        sequence = 1
        if not is_new_session:
            # Get the current max sequence using SQLModel
            statement = select(func.max(TutoringExchange.sequence)).where(
                TutoringExchange.session_id == session.id
            )
            # Changed db.exec to db.execute
            result = await db.execute(statement)
            last_sequence = result.scalar_one_or_none()
            if last_sequence:
                sequence = last_sequence + 1

        # Record the exchange
        exchange = TutoringExchange(
            session_id=session.id,
            sequence=sequence,
            student_input_type="text",
            student_input={"text": user_message.content},
            ai_response_type="text",
            ai_response={},  # Will be updated after streaming
        )

        db.add(exchange)
        await db.commit()
        await db.refresh(exchange)

        # Store references to exchange and session IDs for the frontend
        exchange_id = exchange.id
        session_id = session.id

        # IMPORTANT: Log the exchange_id for debugging
        print(f"Created exchange {exchange_id} for session {session_id}")

        # Convert messages to LLM format
        llm_messages = [
            LLMMessage(role=msg.role, content=msg.content) for msg in request.messages
        ]

        # Create a streaming response
        generator = generate_streaming_response(llm, llm_messages, config)

        # IMPORTANT: Ensure both IDs are sent as strings in the headers
        response_headers = {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Session-Id": str(session_id),
            "Exchange-Id": str(exchange_id),
        }

        # Log the headers we're sending
        print(f"Sending response headers: {response_headers}")

        # Return a streaming response
        return StreamingResponse(
            generator,
            media_type="text/event-stream",
            headers=response_headers,
        )
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during tutoring: {str(e)}",
        )
    finally:
        # Ensure LLM client is closed properly if created
        if "llm" in locals():
            await llm.close()


@router.post("/complete-exchange/{exchange_id}")
async def complete_exchange(
    exchange_id: int,
    response_data: dict = Body(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Complete an exchange by storing the full AI response"""
    try:
        # Log the received data for debugging
        print(f"Received complete-exchange request for ID {exchange_id}")

        # Get the exchange using SQLModel
        statement = select(TutoringExchange).where(TutoringExchange.id == exchange_id)
        result = await db.execute(statement)
        exchange = result.scalar_one_or_none()

        if not exchange:
            print(f"Exchange {exchange_id} not found")
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Exchange not found"},
            )

        # Verify the user owns this exchange
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == exchange.session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            print(f"User {current_user.id} not authorized for exchange {exchange_id}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Not authorized to access this exchange"},
            )

        # Extract response text from the request
        response_text = None
        for field in ["response_text", "full_response", "text"]:
            if field in response_data and response_data[field]:
                response_text = response_data[field]
                break

        if not response_text:
            print(f"No response text found in request data: {response_data}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "No response text provided"},
            )

        print(f"Response text length: {len(response_text)}")
        print(f"First 50 chars: {response_text[:50]}...")

        # Update the exchange with the complete response
        has_whiteboard = response_data.get("has_whiteboard", False)

        # Create a proper response object
        ai_response = {"text": response_text, "has_whiteboard": has_whiteboard}

        # Set the response in the exchange
        exchange.ai_response = ai_response
        print(
            f"Updated exchange {exchange_id} with response of length {len(response_text)}"
        )

        # REMOVED: No longer trying to update total_messages, user_messages, ai_messages
        # since these fields don't exist in DetailedTutoringSession

        # Save the exchange changes only
        db.add(exchange)
        await db.commit()
        print(f"Committed updates for exchange {exchange_id}")

        return {"status": "success", "message": "Exchange completed"}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error completing exchange: {str(e)}")
        import traceback

        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"An error occurred: {str(e)}"},
        )


@router.get("/sessions")
async def get_sessions(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
    limit: int = 10,
    offset: int = 0,
):
    """Get a list of user's tutoring sessions"""
    try:
        # Get sessions for the current user using SQLModel
        statement = (
            select(DetailedTutoringSession)
            .where(DetailedTutoringSession.user_id == current_user.id)
            .order_by(desc(DetailedTutoringSession.start_time))
            .offset(offset)
            .limit(limit)
        )

        # Changed db.exec to db.execute
        result = await db.execute(statement)
        sessions = result.scalars().all()

        # Count total for pagination
        count_statement = (
            select(func.count())
            .select_from(DetailedTutoringSession)
            .where(DetailedTutoringSession.user_id == current_user.id)
        )
        # Changed db.exec to db.execute
        result = await db.execute(count_statement)
        total_count = result.scalar_one_or_none() or 0

        # Format the response
        formatted_sessions = []
        for session in sessions:
            # Get exchange count for each session separately
            exchange_count_statement = (
                select(func.count())
                .select_from(TutoringExchange)
                .where(TutoringExchange.session_id == session.id)
            )
            # Changed db.exec to db.execute
            result = await db.execute(exchange_count_statement)
            exchange_count = result.scalar_one_or_none() or 0

            formatted_sessions.append(
                {
                    "id": session.id,
                    "title": session.title,
                    "start_time": session.start_time,
                    "end_time": session.end_time,
                    "status": session.status,
                    "topic_id": session.topic_id,
                    "exchange_count": exchange_count,
                    "initial_query": session.initial_query,
                    "model": session.model,
                    "provider": session.provider,
                }
            )

        return {
            "sessions": formatted_sessions,
            "total": total_count,
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error getting sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific tutoring session with all exchanges"""
    try:
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        # Changed db.exec to db.execute
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Get all exchanges for the session
        exchange_statement = (
            select(TutoringExchange)
            .where(TutoringExchange.session_id == session_id)
            .order_by(TutoringExchange.sequence)
        )

        # Changed db.exec to db.execute
        result = await db.execute(exchange_statement)
        exchanges = result.scalars().all()

        # Format the exchanges
        formatted_exchanges = []
        for exchange in exchanges:
            formatted_exchanges.append(
                {
                    "id": exchange.id,
                    "sequence": exchange.sequence,
                    "timestamp": exchange.timestamp,
                    "student_input": exchange.student_input,
                    "ai_response": exchange.ai_response,
                    "is_bookmarked": exchange.is_bookmarked,
                }
            )

        # Format the session with exchanges
        return {
            "id": session.id,
            "title": session.title,
            "user_id": session.user_id,
            "topic_id": session.topic_id,
            "session_type": session.session_type,
            "interaction_mode": session.interaction_mode,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "status": session.status,
            "initial_query": session.initial_query,
            "exchanges": formatted_exchanges,
            "model": session.model,
            "provider": session.provider,
        }
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error getting session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a tutoring session and all its exchanges"""
    from loguru import logger

    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        logger.debug("Session query created")
        # Changed db.exec to db.execute
        result = await db.execute(statement)
        session = result.scalar_one_or_none()
        logger.debug(f"Session found: {session}")

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Delete all exchanges
        exchange_delete = delete(TutoringExchange).where(
            TutoringExchange.session_id == session_id
        )
        await db.execute(exchange_delete)

        # Delete all resources
        resource_delete = delete(SessionResource).where(
            SessionResource.session_id == session_id
        )
        await db.execute(resource_delete)

        # Delete the session itself
        session_delete = delete(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id
        )
        await db.execute(session_delete)

        # Commit the transaction
        await db.commit()

        return {"status": "success", "message": "Session deleted successfully"}
    except Exception as e:
        # Log the error and return appropriate status
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.put("/session/{session_id}/end")
async def end_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """End a tutoring session by marking it as completed"""
    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        # Changed db.exec to db.execute
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Update the session status
        session.status = "completed"
        session.end_time = datetime.utcnow()

        # Calculate duration
        if session.start_time:
            delta = session.end_time - session.start_time
            session.duration_seconds = int(delta.total_seconds())

        db.add(session)
        await db.commit()

        return {"status": "success", "message": "Session completed"}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error ending session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


class InitializeSessionRequest(BaseModel):
    session_id: str
    title: str
    new_session: bool = True
    topic_id: Optional[int] = None


@router.post("/initialize-session")
async def initialize_session(
    request: InitializeSessionRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Initialize a new tutoring session without requiring an initial message"""
    try:
        # Check if session with this ID already exists
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == request.session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        result = await db.execute(statement)
        existing_session = result.scalar_one_or_none()

        if existing_session:
            return {
                "id": existing_session.id,
                "title": existing_session.title,
                "user_id": existing_session.user_id,
                "status": existing_session.status,
                "start_time": existing_session.start_time,
                "message": "Session already exists",
            }

        # Create new session with naive datetime (without timezone info)
        # This is important because PostgreSQL TIMESTAMP WITHOUT TIME ZONE
        # can't work with Python timezone-aware datetimes
        from datetime import datetime

        current_time = datetime.utcnow()  # Use naive UTC time

        session = DetailedTutoringSession()
        # Set attributes manually instead of in constructor
        session.id = request.session_id
        session.user_id = current_user.id
        session.topic_id = request.topic_id
        session.title = request.title
        session.session_type = "chat"
        session.interaction_mode = "text-only"
        session.initial_query = ""
        session.status = "active"
        session.model = settings.DEFAULT_LLM_MODEL
        session.provider = settings.DEFAULT_LLM_PROVIDER
        session.start_time = current_time

        # Explicitly set defaults for JSON fields to avoid NULL issues
        session.config = {}
        session.concepts_learned = []
        session.skills_practiced = []

        db.add(session)
        await db.commit()
        await db.refresh(session)

        return {
            "id": session.id,
            "title": session.title,
            "user_id": session.user_id,
            "status": session.status,
            "start_time": session.start_time,
            "message": "Session initialized successfully",
        }
    except Exception as e:
        print(f"Error initializing session: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.put("/exchange/{exchange_id}/bookmark")
async def bookmark_exchange(
    exchange_id: int,
    bookmark_data: dict = Body(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Bookmark or unbookmark an exchange"""
    try:
        # Get the exchange
        statement = select(TutoringExchange).where(TutoringExchange.id == exchange_id)
        # Changed db.exec to db.execute
        result = await db.execute(statement)
        exchange = result.scalar_one_or_none()

        if not exchange:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Exchange not found"
            )

        # Verify the user owns this exchange
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == exchange.session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        # Changed db.exec to db.execute
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this exchange",
            )

        # Update the bookmark status
        is_bookmarked = bookmark_data.get("is_bookmarked", False)
        exchange.is_bookmarked = is_bookmarked

        if is_bookmarked:
            exchange.bookmarked_at = datetime.utcnow()
        else:
            exchange.bookmarked_at = None

        db.add(exchange)
        await db.commit()

        return {"status": "success", "is_bookmarked": exchange.is_bookmarked}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error bookmarking exchange: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# Add a new endpoint to get available LLM providers and models
@router.get("/llm-options")
async def get_llm_options():
    """Get available LLM providers and their models"""
    try:
        # You can customize this based on your available providers and models
        providers = {
            "openai": {
                "models": ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
                "default": settings.DEFAULT_OPENAI_MODEL,
            },
            "groq": {
                "models": [
                    "llama3-8b-8192",
                    "llama3-70b-8192",
                    "mixtral-8x7b-32768",
                    "gemma-7b-it",
                    "llama-3.3-70b-versatile",
                ],
                "default": settings.DEFAULT_GROQ_MODEL,
            },
        }

        return {
            "providers": providers,
            "default_provider": settings.DEFAULT_LLM_PROVIDER,
        }
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error getting LLM options: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
