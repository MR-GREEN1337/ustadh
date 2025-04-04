from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncio
import json
import uuid

from src.db import get_session as get_db_session
from src.db.models.tutoring import (
    DetailedTutoringSession,
    TutoringExchange,
    SessionResource,
)
from src.db.models.content import Topic
from src.db.models.user import User
from src.api.endpoints.auth import get_current_active_user

# You would need to import your LLM integration
# For example, using OpenAI:
"""import openai
from openai import OpenAI, AsyncOpenAI"""

# Set your API key
# openai.api_key = settings.OPENAI_API_KEY

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


# Mock LLM response for testing - replace with actual LLM call
async def stream_llm_response(messages):
    """Simulate streaming from an LLM API"""
    # Replace this with actual LLM API call when ready
    # For example with OpenAI:
    # client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    # response = await client.chat.completions.create(
    #     model="gpt-4",
    #     messages=[{"role": m.role, "content": m.content} for m in messages],
    #     stream=True
    # )
    # async for chunk in response:
    #     if chunk.choices[0].delta.content:
    #         yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
    #     await asyncio.sleep(0.01)

    # Mock response for development
    response = (
        "I'll help you understand this concept. Let's break it down into simpler parts."
    )
    tokens = response.split()

    for token in tokens:
        yield f"data: {json.dumps({'content': token + ' '})}\n\n"
        await asyncio.sleep(0.1)

    yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Endpoint for chat-based tutoring with streaming response"""
    try:
        session = None
        is_new_session = request.new_session or not request.session_id

        # If continuing existing session, retrieve it
        if not is_new_session and request.session_id:
            result = await db.execute(
                select(DetailedTutoringSession).where(
                    DetailedTutoringSession.id == request.session_id,
                    DetailedTutoringSession.user_id == current_user.id,
                )
            )
            session = result.scalars().first()

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
                result = await db.execute(
                    select(Topic).where(Topic.id == request.topic_id)
                )
                topic = result.scalars().first()

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
            )

            db.add(session)
            await db.flush()  # To get the ID without committing yet

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
            # Get the current max sequence
            result = await db.execute(
                select(TutoringExchange.sequence)
                .where(TutoringExchange.session_id == session.id)
                .order_by(TutoringExchange.sequence.desc())
            )
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

        # Return a streaming response
        return StreamingResponse(
            stream_llm_response(request.messages),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Session-Id": str(session.id),
                "Exchange-Id": str(exchange.id),
            },
        )
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during tutoring: {str(e)}",
        )


@router.post("/complete-exchange/{exchange_id}")
async def complete_exchange(
    exchange_id: int,
    response_text: str = "",
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Complete an exchange by storing the full AI response"""
    try:
        # Get the exchange
        result = await db.execute(
            select(TutoringExchange).where(TutoringExchange.id == exchange_id)
        )
        exchange = result.scalars().first()

        if not exchange:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Exchange not found"
            )

        # Verify the user owns this exchange
        result = await db.execute(
            select(DetailedTutoringSession).where(
                DetailedTutoringSession.id == exchange.session_id,
                DetailedTutoringSession.user_id == current_user.id,
            )
        )
        session = result.scalars().first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this exchange",
            )

        # Update the exchange with the complete response
        exchange.ai_response = {"text": response_text}

        # Update session stats
        session.total_messages = (
            session.total_messages + 2 if session.total_messages else 2
        )
        session.user_messages = (
            session.user_messages + 1 if session.user_messages else 1
        )
        session.ai_messages = session.ai_messages + 1 if session.ai_messages else 1

        await db.commit()

        return {"status": "success", "message": "Exchange completed"}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error completing exchange: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
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
        # Get sessions for the current user
        result = await db.execute(
            select(DetailedTutoringSession)
            .where(DetailedTutoringSession.user_id == current_user.id)
            .order_by(DetailedTutoringSession.start_time.desc())
            .limit(limit)
            .offset(offset)
        )
        sessions = result.scalars().all()

        # Count total for pagination
        count_result = await db.execute(
            select(func.count())
            .select_from(DetailedTutoringSession)
            .where(DetailedTutoringSession.user_id == current_user.id)
        )
        total_count = count_result.scalar() or 0

        # Format the response
        formatted_sessions = []
        for session in sessions:
            # Get exchange count for each session separately
            exchange_count_result = await db.execute(
                select(func.count())
                .select_from(TutoringExchange)
                .where(TutoringExchange.session_id == session.id)
            )
            exchange_count = exchange_count_result.scalar() or 0

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
        result = await db.execute(
            select(DetailedTutoringSession).where(
                DetailedTutoringSession.id == session_id,
                DetailedTutoringSession.user_id == current_user.id,
            )
        )
        session = result.scalars().first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Get all exchanges for the session
        result = await db.execute(
            select(TutoringExchange)
            .where(TutoringExchange.session_id == session_id)
            .order_by(TutoringExchange.sequence)
        )
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
        result = await db.execute(
            select(DetailedTutoringSession).where(
                DetailedTutoringSession.id == session_id,
                DetailedTutoringSession.user_id == current_user.id,
            )
        )
        logger.debug(f"Session query result: {result}")
        session = result.scalars().first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Delete all exchanges - make sure to use await with db.execute
        await db.execute(
            delete(TutoringExchange).where(TutoringExchange.session_id == session_id)
        )

        # Delete all resources - make sure to use await with db.execute
        await db.execute(
            delete(SessionResource).where(SessionResource.session_id == session_id)
        )

        # Delete the session itself - make sure to use await with db.execute
        await db.execute(
            delete(DetailedTutoringSession).where(
                DetailedTutoringSession.id == session_id
            )
        )

        # Make sure to commit the transaction
        await db.commit()

        return {"status": "success", "message": "Session deleted successfully"}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error deleting session: {str(e)}")
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
        result = await db.execute(
            select(DetailedTutoringSession).where(
                DetailedTutoringSession.id == session_id,
                DetailedTutoringSession.user_id == current_user.id,
            )
        )
        session = result.scalars().first()

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

        await db.commit()

        return {"status": "success", "message": "Session completed"}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error ending session: {str(e)}")
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
        result = await db.execute(
            select(TutoringExchange).where(TutoringExchange.id == exchange_id)
        )
        exchange = result.scalars().first()

        if not exchange:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Exchange not found"
            )

        # Verify the user owns this exchange
        result = await db.execute(
            select(DetailedTutoringSession).where(
                DetailedTutoringSession.id == exchange.session_id,
                DetailedTutoringSession.user_id == current_user.id,
            )
        )
        session = result.scalars().first()

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

        await db.commit()

        return {"status": "success", "is_bookmarked": exchange.is_bookmarked}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error bookmarking exchange: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
