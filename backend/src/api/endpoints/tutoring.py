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


# Modify the chat endpoint in router/tutoring.py
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
            result = await db.execute(statement)
            session = result.scalar_one_or_none()

            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tutoring session not found",
                )

        # Extract the latest user message
        user_message = request.messages[-1] if request.messages else None

        if not user_message or user_message.role != "user":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Last message must be from user",
            )

        # Create new session if needed
        if is_new_session:
            # Validate topic if provided
            topic = None
            if request.topic_id:
                statement = select(Topic).where(Topic.id == request.topic_id)
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
                title=request.session_title or user_message.content[:50],
                session_type="chat",
                interaction_mode="text-only",
                initial_query=user_message.content,
                status="active",
                model=model,
                provider=provider,
            )

            db.add(session)
            await db.commit()
            await db.refresh(session)

        # Create exchange record for this message
        sequence = 1
        if not is_new_session:
            # Get the current max sequence using SQLModel
            statement = select(func.max(TutoringExchange.sequence)).where(
                TutoringExchange.session_id == session.id
            )
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

        # Convert messages to LLM format with enhanced LaTeX instructions
        llm_messages = []

        # Add system prompt with strict LaTeX formatting instructions if not already present
        has_system_message = any(msg.role == "system" for msg in request.messages)

        if not has_system_message:
            # Define system prompt instructing the model to use strict LaTeX formatting and match student's language
            system_prompt = """You are a multilingual tutor specializing in mathematics, physics, chemistry, and other technical subjects.

ALWAYS RESPOND IN THE SAME LANGUAGE AS THE STUDENT. This is extremely important. If the student asks in French, answer in French. If the student asks in Spanish, answer in Spanish, etc. Never switch to English unless the student uses English.

Your responses MUST format ALL mathematical expressions using proper LaTeX notation.

CRITICAL REQUIREMENTS FOR FORMATTING:

1. EVERY mathematical expression, formula, equation, variable, or mathematical symbol MUST be in LaTeX format:
   - Even single variables like x, y, z must be formatted as $x$, $y$, $z$
   - ALL numbers with exponents (e.g., x², x³) must be written as $x^2$, $x^3$
   - ALL subscripts must use proper notation: $x_i$ instead of xi
   - ALL mathematical operators (+, -, ×, ÷, =, etc.) within expressions must be inside LaTeX delimiters

2. Use appropriate LaTeX delimiters:
   - For inline expressions: single dollar signs ($...$)
   - For displayed equations: double dollar signs ($$...$$)

3. For mathematical expressions and equations:
   - Use inline LaTeX for simple expressions within text: $f(x) = 3x^5 - 2x^3 + 5x - 7$
   - Use display LaTeX for important equations that should be emphasized:
     $$f'(x) = 15x^4 - 6x^2 + 5$$

4. For derivatives and special notation:
   - Use proper derivative notation: $f'(x)$ or $\\frac{df}{dx}$
   - For partial derivatives: $\\frac{\\partial f}{\\partial x}$
   - For integrals: $\\int f(x) dx$ or $\\int_{a}^{b} f(x) dx$

5. For fractions, always use proper LaTeX formatting:
   - $\\frac{numerator}{denominator}$
   - Example: $\\frac{x^2 + 1}{x - 2}$

6. For powers and exponents:
   - Always use superscript notation: $x^2$, $e^{-x}$, $a^{n+1}$
   - For complex exponents: $x^{n+1}$, $e^{-\\frac{x^2}{2}}$

7. For sets and logical expressions:
   - Use proper set notation: $x \\in \\mathbb{R}$, $A \\subset B$
   - Use proper logical symbols: $\\forall x$, $\\exists y$, $p \\implies q$

8. For matrices and vectors:
   - Format vectors as: $\\vec{v}$ or $\\mathbf{v}$
   - Format matrices using proper environment:
     $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$

9. For Greek letters and special symbols:
   - Use LaTeX commands: $\\alpha$, $\\beta$, $\\gamma$, $\\Delta$, $\\pi$, $\\Sigma$
   - For special mathematical symbols: $\\infty$, $\\nabla$, $\\partial$

10. For chemical equations:
    - Use proper subscripts for molecules: $H_2O$, $CO_2$
    - For reactions: $H_2O + CO_2 \\rightarrow H_2CO_3$

Markdown should still be used for overall structure:
- Use headings (# for main headings, ## for subheadings)
- Use **bold** for emphasis of non-mathematical text
- Use *italics* for definitions of non-mathematical terms
- Use bullet points and numbered lists for steps

IMPORTANT: Do NOT use plain text formatting (x², x³, etc.) or ASCII approximations (x^2, x_i) for ANY mathematical expression. EVERY mathematical symbol or expression MUST be formatted with LaTeX.

You MUST rewrite and correct all mathematical expressions provided by the student into proper LaTeX notation in your response.

REMEMBER TO ALWAYS RESPOND IN THE SAME LANGUAGE AS THE STUDENT'S QUESTION.
"""

            llm_messages.append(LLMMessage(role="system", content=system_prompt))

        # Add user messages
        for msg in request.messages:
            llm_messages.append(LLMMessage(role=msg.role, content=msg.content))

        # Create a streaming response
        generator = generate_streaming_response(llm, llm_messages, config)

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
    """Delete a tutoring session and all its related data"""
    from loguru import logger

    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        logger.debug("Session query created")
        result = await db.execute(statement)
        session = result.scalar_one_or_none()
        logger.debug(f"Session found: {session}")

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # First delete all flashcards associated with this session
        # Import the Flashcard model
        from src.db.models.flashcard import Flashcard as FlashcardModel

        # Delete flashcards
        flashcard_delete = delete(FlashcardModel).where(
            FlashcardModel.session_id == session_id
        )
        await db.execute(flashcard_delete)
        logger.debug(f"Deleted flashcards for session {session_id}")

        # Delete all exchanges
        exchange_delete = delete(TutoringExchange).where(
            TutoringExchange.session_id == session_id
        )
        await db.execute(exchange_delete)
        logger.debug(f"Deleted exchanges for session {session_id}")

        # Delete all resources
        resource_delete = delete(SessionResource).where(
            SessionResource.session_id == session_id
        )
        await db.execute(resource_delete)
        logger.debug(f"Deleted resources for session {session_id}")

        # Finally, delete the session itself
        session_delete = delete(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id
        )
        await db.execute(session_delete)
        logger.debug(f"Deleted session {session_id}")

        # Commit the transaction
        await db.commit()
        logger.debug(f"Committed transaction for deleting session {session_id}")

        return {"status": "success", "message": "Session deleted successfully"}
    except Exception as e:
        # Log the error and return appropriate status
        logger.error(f"Error deleting session: {str(e)}")
        # Rollback the transaction in case of error
        await db.rollback()
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


##################################
########## Flashcards ############
##################################


# Create a new model for flashcards
class Flashcard(BaseModel):
    id: str
    session_id: str
    front: str
    back: str
    tags: Optional[List[str]] = None
    created_at: datetime


class FlashcardCreate(BaseModel):
    front: str
    back: str
    tags: Optional[List[str]] = None


class FlashcardUpdate(BaseModel):
    id: str
    front: Optional[str] = None
    back: Optional[str] = None
    tags: Optional[List[str]] = None


class FlashcardGenerateRequest(BaseModel):
    message: str


@router.get("/session/{session_id}/flashcards")
async def get_flashcards(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get flashcards for a session"""
    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Query flashcards for this session
        # Assuming you have defined a Flashcard model in your database
        from src.db.models.flashcard import Flashcard as FlashcardModel

        statement = select(FlashcardModel).where(
            FlashcardModel.session_id == session_id
        )
        result = await db.execute(statement)
        flashcards = result.scalars().all()

        # Format response
        formatted_flashcards = []
        for card in flashcards:
            formatted_flashcards.append(
                {
                    "id": card.id,
                    "front": card.front,
                    "back": card.back,
                    "tags": card.tags,
                    "created_at": card.created_at.isoformat(),
                }
            )

        return {"flashcards": formatted_flashcards, "total": len(formatted_flashcards)}

    except Exception as e:
        print(f"Error getting flashcards: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.post("/session/{session_id}/flashcards")
async def create_flashcard(
    session_id: str,
    flashcard: FlashcardCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new flashcard for a session"""
    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Create a new flashcard
        from src.db.models.flashcard import Flashcard as FlashcardModel

        new_flashcard = FlashcardModel(
            id=str(uuid.uuid4()),
            session_id=session_id,
            front=flashcard.front,
            back=flashcard.back,
            tags=flashcard.tags or [],
            created_at=datetime.utcnow(),
            user_id=current_user.id,
        )

        db.add(new_flashcard)
        await db.commit()
        await db.refresh(new_flashcard)

        # Return the created flashcard
        return {
            "id": new_flashcard.id,
            "front": new_flashcard.front,
            "back": new_flashcard.back,
            "tags": new_flashcard.tags,
            "created_at": new_flashcard.created_at.isoformat(),
        }

    except Exception as e:
        print(f"Error creating flashcard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.put("/session/{session_id}/flashcards")
async def update_flashcard(
    session_id: str,
    flashcard: FlashcardUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Update an existing flashcard"""
    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Find the flashcard
        from src.db.models.flashcard import Flashcard as FlashcardModel

        statement = select(FlashcardModel).where(
            FlashcardModel.id == flashcard.id, FlashcardModel.session_id == session_id
        )
        result = await db.execute(statement)
        existing_card = result.scalar_one_or_none()

        if not existing_card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found"
            )

        # Update fields
        if flashcard.front is not None:
            existing_card.front = flashcard.front
        if flashcard.back is not None:
            existing_card.back = flashcard.back
        if flashcard.tags is not None:
            existing_card.tags = flashcard.tags

        db.add(existing_card)
        await db.commit()
        await db.refresh(existing_card)

        # Return the updated flashcard
        return {
            "id": existing_card.id,
            "front": existing_card.front,
            "back": existing_card.back,
            "tags": existing_card.tags,
            "created_at": existing_card.created_at.isoformat(),
        }

    except Exception as e:
        print(f"Error updating flashcard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.delete("/session/{session_id}/flashcards/{flashcard_id}")
async def delete_flashcard(
    session_id: str,
    flashcard_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a flashcard"""
    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Find the flashcard
        from src.db.models.flashcard import Flashcard as FlashcardModel

        statement = select(FlashcardModel).where(
            FlashcardModel.id == flashcard_id, FlashcardModel.session_id == session_id
        )
        result = await db.execute(statement)
        card = result.scalar_one_or_none()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found"
            )

        # Delete the flashcard
        await db.delete(card)
        await db.commit()

        return {"status": "success", "message": "Flashcard deleted successfully"}

    except Exception as e:
        print(f"Error deleting flashcard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.post("/session/{session_id}/generate-flashcards")
async def generate_flashcards(
    session_id: str,
    request: FlashcardGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Generate flashcards from a message content using AI"""
    try:
        # Verify the session exists and belongs to the user
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Setup LLM
        provider = settings.DEFAULT_LLM_PROVIDER
        llm = LLM(provider=provider)

        # Configure LLM
        config = LLMConfig(
            model=settings.DEFAULT_LLM_MODEL,
            temperature=0.7,
            max_tokens=2048,
        )

        # Create system prompt
        system_prompt = """You are an educational assistant helping to create flashcards from educational content.
        Analyze the provided text and extract key concepts, terms, definitions, and facts that would be useful as flashcards.

        For each flashcard:
        1. The front should contain a clear, concise question or prompt
        2. The back should contain the answer or explanation
        3. Add relevant tags for categorization

        Format your response as a JSON array of flashcards with the structure:
        [
            {
                "front": "Question or term",
                "back": "Answer or definition",
                "tags": ["tag1", "tag2"]
            }
        ]

        Make sure all content is accurate and educationally valuable. Create 3-5 high-quality flashcards.
        """

        # Create the message for the LLM
        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(
                role="user",
                content=f"Generate flashcards from this content: {request.message}",
            ),
        ]

        # Get response from LLM
        response = await llm.generate(messages, config)

        # Parse the JSON response
        import json
        import re

        # Try to extract JSON from the response
        json_match = re.search(r"\[.*\]", response, re.DOTALL)
        if not json_match:
            raise ValueError("Could not extract valid JSON from LLM response")

        json_str = json_match.group(0)
        generated_cards = json.loads(json_str)

        # Create flashcards in the database
        from src.db.models.flashcard import Flashcard as FlashcardModel

        created_flashcards = []
        for card_data in generated_cards:
            new_card = FlashcardModel(
                id=str(uuid.uuid4()),
                session_id=session_id,
                front=card_data["front"],
                back=card_data["back"],
                tags=card_data.get("tags", []),
                created_at=datetime.utcnow(),
                user_id=current_user.id,
            )

            db.add(new_card)
            created_flashcards.append(
                {
                    "id": new_card.id,
                    "front": new_card.front,
                    "back": new_card.back,
                    "tags": new_card.tags,
                    "created_at": new_card.created_at.isoformat(),
                }
            )

        await db.commit()

        return {
            "flashcards": created_flashcards,
            "total": len(created_flashcards),
            "message": "Successfully generated flashcards",
        }

    except Exception as e:
        print(f"Error generating flashcards: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
    finally:
        # Ensure LLM client is closed properly if created
        if "llm" in locals():
            await llm.close()
