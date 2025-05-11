from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import StreamingResponse, JSONResponse
from sqlmodel import select
from sqlalchemy import func, delete, desc
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
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
from src.db.models.user import User
from src.db.models import SchoolProfessor
from src.api.endpoints.auth import get_current_active_user
from src.core.llm import LLM, Message as LLMMessage, LLMConfig
from src.core.settings import settings

router = APIRouter(prefix="/professors/ai", tags=["professor_ai"])


class Message(BaseModel):
    role: str
    content: str
    attached_files: Optional[List[Dict[str, Any]]] = None


class AssistantChatRequest(BaseModel):
    messages: List[Message]
    session_id: Optional[str] = None
    new_session: bool = False
    session_title: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None
    attached_files: Optional[List[Dict[str, Any]]] = None


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


async def get_current_professor(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Get the current user and verify they are a professor"""
    if (
        current_user.user_type != "professor"
        and current_user.user_type != "school_admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professors can access this endpoint",
        )

    # Get professor record
    statement = select(SchoolProfessor).where(
        SchoolProfessor.user_id == current_user.id
    )
    result = await db.execute(statement)
    professor = result.scalar_one_or_none()

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor profile not found",
        )

    return current_user, professor


@router.post("/assistant/chat/stream")
async def assistant_chat(
    request: AssistantChatRequest,
    db: AsyncSession = Depends(get_db_session),
    auth_data=Depends(get_current_professor),
):
    """Endpoint for professor assistant chat with streaming response"""
    current_user, professor = auth_data

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
                    detail="Assistant session not found",
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
            # Create new session
            session = DetailedTutoringSession(
                id=str(uuid.uuid4()) if not request.session_id else request.session_id,
                user_id=current_user.id,
                topic_id=None,  # No topic ID for professor assistant
                title=request.session_title or user_message.content[:50],
                session_type="professor_assistant",  # Mark as professor assistant
                interaction_mode="text-only",
                initial_query=user_message.content,
                status="active",
                model=model,
                provider=provider,
                config={"professor_id": professor.id},  # Store professor ID in config
                start_time=datetime.utcnow(),
            )

            db.add(session)
            await db.commit()
            await db.refresh(session)

        # Create exchange record for this message
        sequence = 1
        if not is_new_session:
            # Get the current max sequence
            statement = select(func.max(TutoringExchange.sequence)).where(
                TutoringExchange.session_id == session.id
            )
            result = await db.execute(statement)
            last_sequence = result.scalar_one_or_none()
            if last_sequence:
                sequence = last_sequence + 1

        # Process attached files if any
        attached_files = request.attached_files or user_message.attached_files or []
        has_attachments = len(attached_files) > 0

        # Record the exchange
        exchange = TutoringExchange(
            session_id=session.id,
            sequence=sequence,
            student_input_type="text",
            student_input={
                "text": user_message.content,
                "has_attachments": has_attachments,
                "attachments": attached_files,
                "is_professor": True,  # Add flag to identify professor exchanges
            },
            ai_response_type="text",
            ai_response={},  # Will be updated after streaming
            timestamp=datetime.utcnow(),
        )

        db.add(exchange)
        await db.commit()
        await db.refresh(exchange)

        # Store references to exchange and session IDs for the frontend
        exchange_id = exchange.id
        session_id = session.id

        # Convert messages to LLM format
        llm_messages = []

        # Add system prompt if not already present
        has_system_message = any(msg.role == "system" for msg in request.messages)

        if not has_system_message:
            # Define system prompt for professor assistant
            system_prompt = """You are a professional educational assistant specifically designed to help professors and teachers. Your expertise includes:

1. Creating and improving educational content:
   - Designing course curricula and syllabi
   - Developing lesson plans with clear learning objectives
   - Crafting engaging assignments and projects
   - Creating fair and effective assessments (quizzes, tests, rubrics)

2. Pedagogical guidance:
   - Suggesting teaching methods for different learning styles
   - Providing strategies for student engagement and active learning
   - Offering approaches for teaching complex or challenging topics
   - Recommending differentiation techniques for diverse learners

3. Student analysis and support:
   - Interpreting student performance data
   - Identifying learning gaps and misconceptions
   - Suggesting targeted interventions for struggling students
   - Creating personalized learning pathways

4. Professional development:
   - Explaining educational research and best practices
   - Suggesting innovative teaching techniques
   - Providing guidance on educational technology
   - Offering content-specific teaching strategies

5. Administrative assistance:
   - Drafting communications to students, parents, or administrators
   - Creating efficient grading systems and academic record-keeping
   - Planning academic calendars and schedules
   - Developing classroom policies and procedures

IMPORTANT: Always respond in the same language the professor uses. Be concise yet thorough, focusing on practical, evidence-based advice. Provide specific examples and actionable recommendations. Maintain a professional, supportive tone that respects the professor's expertise while offering valuable insights.

For mathematical or scientific content, use LaTeX formatting when appropriate:
- Inline expressions: $x^2 + 2x + 1$
- Display equations: $$\\frac{dy}{dx} = 2x + 2$$

Provide balanced perspectives on educational approaches, acknowledging that teaching contexts vary and multiple valid solutions may exist.
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

        # Return a streaming response
        return StreamingResponse(
            generator,
            media_type="text/event-stream",
            headers=response_headers,
        )
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error in assistant chat endpoint: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
    finally:
        # Ensure LLM client is closed properly if created
        if "llm" in locals():
            await llm.close()


@router.post("/assistant/exchanges/{exchange_id}/complete")
async def complete_assistant_exchange(
    exchange_id: int,
    response_data: dict = Body(...),
    db: AsyncSession = Depends(get_db_session),
    auth_data=Depends(get_current_professor),
):
    """Complete an exchange by storing the full AI response"""
    current_user, professor = auth_data

    try:
        # Get the exchange
        statement = select(TutoringExchange).where(TutoringExchange.id == exchange_id)
        result = await db.execute(statement)
        exchange = result.scalar_one_or_none()

        if not exchange:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Exchange not found"},
            )

        # Verify the professor owns this exchange
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == exchange.session_id,
            DetailedTutoringSession.user_id == current_user.id,
            DetailedTutoringSession.session_type == "professor_assistant",
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

        if not session:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Not authorized to access this exchange"},
            )

        # Extract response text from the request
        response_text = None
        for field in ["response_text", "full_response", "text", "response"]:
            if field in response_data and response_data[field]:
                response_text = response_data[field]
                break

        if not response_text:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "No response text provided"},
            )

        # Update the exchange with the complete response
        ai_response = {"text": response_text}

        # Set the response in the exchange
        exchange.ai_response = ai_response

        # Save the exchange changes
        db.add(exchange)
        await db.commit()

        return {"success": True, "message": "Exchange completed"}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error completing exchange: {str(e)}")
        import traceback

        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"An error occurred: {str(e)}"},
        )


@router.get("/assistant/sessions")
async def get_assistant_sessions(
    db: AsyncSession = Depends(get_db_session),
    auth_data=Depends(get_current_professor),
    limit: int = 10,
    offset: int = 0,
):
    """Get a list of professor's assistant sessions"""
    current_user, professor = auth_data

    try:
        # Get sessions for the current professor - filtered to professor_assistant type
        statement = (
            select(DetailedTutoringSession)
            .where(
                DetailedTutoringSession.user_id == current_user.id,
                DetailedTutoringSession.session_type == "professor_assistant",
            )
            .order_by(desc(DetailedTutoringSession.start_time))
            .offset(offset)
            .limit(limit)
        )
        result = await db.execute(statement)
        sessions = result.scalars().all()

        # Count total for pagination
        count_statement = (
            select(func.count())
            .select_from(DetailedTutoringSession)
            .where(
                DetailedTutoringSession.user_id == current_user.id,
                DetailedTutoringSession.session_type == "professor_assistant",
            )
        )
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
            result = await db.execute(exchange_count_statement)
            exchange_count = result.scalar_one_or_none() or 0

            formatted_sessions.append(
                {
                    "id": session.id,
                    "title": session.title,
                    "start_time": session.start_time,
                    "end_time": session.end_time,
                    "status": session.status,
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
        print(f"Error getting assistant sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.get("/assistant/session/{session_id}")
async def get_assistant_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
    auth_data=Depends(get_current_professor),
):
    """Get a specific assistant session with all exchanges"""
    current_user, professor = auth_data

    try:
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
            DetailedTutoringSession.session_type == "professor_assistant",
        )
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
            "session_type": session.session_type,
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
        print(f"Error getting assistant session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.delete("/assistant/sessions/{session_id}")
async def delete_assistant_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
    auth_data=Depends(get_current_professor),
):
    """Delete an assistant session and all its related data"""
    current_user, professor = auth_data

    try:
        # Verify the session exists, belongs to the professor, and is of assistant type
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id,
            DetailedTutoringSession.user_id == current_user.id,
            DetailedTutoringSession.session_type == "professor_assistant",
        )
        result = await db.execute(statement)
        session = result.scalar_one_or_none()

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

        # Finally, delete the session itself
        session_delete = delete(DetailedTutoringSession).where(
            DetailedTutoringSession.id == session_id
        )
        await db.execute(session_delete)

        # Commit the transaction
        await db.commit()

        return {"success": True, "message": "Session deleted successfully"}
    except Exception as e:
        # Log the error and return appropriate status
        print(f"Error deleting session: {str(e)}")
        # Rollback the transaction in case of error
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


class InitializeSessionRequest(BaseModel):
    session_id: str
    title: str
    new_session: bool = True


@router.post("/assistant/sessions")
async def initialize_assistant_session(
    request: InitializeSessionRequest,
    db: AsyncSession = Depends(get_db_session),
    auth_data=Depends(get_current_professor),
):
    """Initialize a new assistant session without requiring an initial message"""
    current_user, professor = auth_data

    try:
        # Check if session with this ID already exists
        statement = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id == request.session_id,
            DetailedTutoringSession.user_id == current_user.id,
            DetailedTutoringSession.session_type == "professor_assistant",
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

        # Create new session
        current_time = datetime.utcnow()

        session = DetailedTutoringSession(
            id=request.session_id,
            user_id=current_user.id,
            topic_id=None,  # No topic ID for professor assistant
            title=request.title,
            session_type="professor_assistant",
            interaction_mode="text-only",
            initial_query="",
            status="active",
            model=settings.DEFAULT_LLM_MODEL,
            provider=settings.DEFAULT_LLM_PROVIDER,
            config={"professor_id": professor.id},  # Store professor ID in config
            start_time=current_time,
        )

        # Explicitly set defaults for JSON fields to avoid NULL issues
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
        print(f"Error initializing assistant session: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# Add routes for course content generation and assignment generation


class CourseGenerationRequest(BaseModel):
    title: Optional[str] = None
    subject_area: str
    education_level: str
    academic_track: Optional[str] = None
    difficulty: Optional[str] = None
    focus_areas: Optional[List[str]] = None
    duration: Optional[str] = None
    include_assessments: Optional[bool] = True


class AssignmentGenerationRequest(BaseModel):
    course_id: int
    title: Optional[str] = None
    type: str  # homework, project, quiz, exam
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    due_in_days: Optional[int] = None
    include_rubric: Optional[bool] = True
    include_solutions: Optional[bool] = False
    estimated_time_minutes: Optional[int] = None


@router.post("/generate-course")
async def generate_course(
    request: CourseGenerationRequest,
    auth_data=Depends(get_current_professor),
):
    """Generate a new course structure using AI"""
    current_user, professor = auth_data

    try:
        # Set up LLM
        provider = settings.DEFAULT_LLM_PROVIDER
        llm = LLM(provider=provider)

        # Configure LLM
        config = LLMConfig(
            model=settings.DEFAULT_LLM_MODEL,
            temperature=0.7,
            max_tokens=4000,
        )

        # Create system prompt
        system_prompt = """You are an expert educational curriculum designer specializing in creating detailed course structures and syllabi.
        Your task is to generate a comprehensive course based on the provided parameters. The output should be in a structured JSON format."""

        # Create the prompt for course generation
        duration_text = request.duration or "semester"
        difficulty_text = request.difficulty or "intermediate"
        focus_areas_text = (
            ", ".join(request.focus_areas)
            if request.focus_areas
            else "core curriculum topics"
        )

        user_prompt = f"""
        Create a detailed course structure for a {difficulty_text}-level course in {request.subject_area} for {request.education_level} students.

        Course details:
        - Title: {request.title or f"{request.subject_area} for {request.education_level}"}
        - Academic track: {request.academic_track or "General"}
        - Duration: {duration_text}
        - Focus areas: {focus_areas_text}
        - Should include assessments: {request.include_assessments}

        The course should include:
        1. A clear course description
        2. Learning objectives (5-8)
        3. Main topics to be covered (10-15)
        4. Syllabus sections with weekly breakdowns
        5. Required materials and resources

        Format the response as a JSON object with the following structure:
        ```json
        {
          "title": "Course title",
          "description": "Comprehensive description",
          "learning_objectives": ["objective 1", "objective 2", ...],
          "topics": ["topic 1", "topic 2", ...],
          "syllabus": {
            "week1": {
              "title": "Introduction to...",
              "content": "Description of this week's content",
              "activities": ["activity 1", "activity 2", ...]
            },
            "week2": {
              ...
            }
          },
          "assessments": [
            {
              "title": "Assessment title",
              "description": "Description of assessment",
              "weight": "Percentage of final grade",
              "type": "quiz/exam/project/etc."
            }
          ],
          "materials": [
            {
              "title": "Material title",
              "type": "textbook/article/video/etc.",
              "description": "Brief description"
            }
          ]
        }
        ```

        Make sure the course is academically rigorous, pedagogically sound, and aligned with modern educational standards for {request.education_level} level in {request.subject_area}.
        """

        # Create messages for the LLM
        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=user_prompt),
        ]

        # Get response from LLM
        response = await llm.generate(messages, config)

        # Extract JSON from response
        import re
        import json

        json_match = re.search(r"```json(.+?)```", response, re.DOTALL)
        if not json_match:
            json_match = re.search(r"```(.+?)```", response, re.DOTALL)

        if json_match:
            json_str = json_match.group(1).strip()
        else:
            json_str = response

        # Clean up any non-JSON content
        json_str = re.sub(r"```json|```", "", json_str)

        # Parse JSON
        course_data = json.loads(json_str)

        return course_data

    except Exception as e:
        print(f"Error generating course: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
    finally:
        # Ensure LLM client is closed properly if created
        if "llm" in locals():
            await llm.close()


@router.post("/generate-assignment")
async def generate_assignment(
    request: AssignmentGenerationRequest,
    db: AsyncSession = Depends(get_db_session),
    auth_data=Depends(get_current_professor),
):
    """Generate a new assignment for a course using AI"""
    current_user, professor = auth_data

    try:
        # Verify the course exists and belongs to the professor
        from src.db.models.school import SchoolCourse

        statement = select(SchoolCourse).where(SchoolCourse.id == request.course_id)
        result = await db.execute(statement)
        course = result.scalar_one_or_none()

        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
            )

        # Set up LLM
        provider = settings.DEFAULT_LLM_PROVIDER
        llm = LLM(provider=provider)

        # Configure LLM
        config = LLMConfig(
            model=settings.DEFAULT_LLM_MODEL,
            temperature=0.7,
            max_tokens=4000,
        )

        # Create system prompt
        system_prompt = """You are an expert educational assessment designer specializing in creating effective, engaging, and fair assessments.
        Your task is to generate a comprehensive assignment based on the provided parameters. The output should be in a structured JSON format."""

        # Create the prompt for assignment generation
        difficulty_text = request.difficulty or "medium"
        topic_text = request.topic or "course material covered so far"
        due_days_text = (
            f"{request.due_in_days} days from now"
            if request.due_in_days
            else "two weeks from now"
        )
        estimated_time = request.estimated_time_minutes or (
            30 if request.type == "quiz" else 60 if request.type == "homework" else 120
        )

        user_prompt = f"""
        Create a detailed {request.type} assignment for the course "{course.title}" about {topic_text}.

        Assignment details:
        - Title: {request.title or f"{request.type.capitalize()} on {topic_text}"}
        - Difficulty: {difficulty_text}
        - Type: {request.type}
        - Due date: {due_days_text}
        - Estimated completion time: {estimated_time} minutes
        - Include rubric: {request.include_rubric}
        - Include solutions: {request.include_solutions}

        The assignment should include:
        1. Clear instructions and objectives
        2. Detailed questions or tasks
        3. Point values for each question/section
        4. Any necessary resources or materials

        Format the response as a JSON object with the following structure:
        ```json
        {
          "title": "Assignment title",
          "description": "Brief overview of the assignment",
          "instructions": "Detailed instructions for students",
          "points_possible": 100,
          "due_date": "2023-XX-XX",
          "questions": [
            {
              "id": 1,
              "text": "Question text",
              "type": "multiple_choice/short_answer/essay/etc.",
              "points": 10,
              "options": ["option 1", "option 2", ...] // for multiple choice
            }
          ],
          "rubric": {
            "criteria": [
              {
                "name": "Understanding of concepts",
                "description": "Demonstrates thorough understanding of key concepts",
                "levels": [
                ]
              }
            ]
          },
          "solutions": {
            "1": "Answer to question 1",
            "2": "Answer to question 2",
            ...
          },
          "materials": [
            {
              "title": "Resource title",
              "type": "textbook/article/video/etc.",
              "description": "Brief description"
            }
          ]
        }
        ```

        Make sure the assignment is academically rigorous, well-aligned with course objectives, clearly written, and appropriate for the specified difficulty level and time estimate.
        """

        # Create messages for the LLM
        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=user_prompt),
        ]

        # Get response from LLM
        response = await llm.generate(messages, config)

        # Extract JSON from response
        import re
        import json

        json_match = re.search(r"```json(.+?)```", response, re.DOTALL)
        if not json_match:
            json_match = re.search(r"```(.+?)```", response, re.DOTALL)

        if json_match:
            json_str = json_match.group(1).strip()
        else:
            json_str = response

        # Clean up any non-JSON content
        json_str = re.sub(r"```json|```", "", json_str)

        # Parse JSON
        assignment_data = json.loads(json_str)

        # Calculate due date
        from datetime import timedelta

        if request.due_in_days:
            due_date = datetime.utcnow() + timedelta(days=request.due_in_days)
            assignment_data["due_date"] = due_date.isoformat()

        return assignment_data

    except Exception as e:
        print(f"Error generating assignment: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
    finally:
        # Ensure LLM client is closed properly if created
        if "llm" in locals():
            await llm.close()


class FeedbackRequest(BaseModel):
    material_type: str  # "assignment", "lesson_plan", "rubric", etc.
    content: str
    feedback: str


@router.post("/feedback")
async def get_ai_feedback(
    request: FeedbackRequest,
    auth_data=Depends(get_current_professor),
):
    """Get AI feedback and improvements for educational material"""
    current_user, professor = auth_data

    try:
        # Set up LLM
        provider = settings.DEFAULT_LLM_PROVIDER
        llm = LLM(provider=provider)

        # Configure LLM
        config = LLMConfig(
            model=settings.DEFAULT_LLM_MODEL,
            temperature=0.7,
            max_tokens=3000,
        )

        # Create system prompt
        system_prompt = f"""You are an expert educational consultant specializing in {request.material_type}s.
        Your task is to provide constructive feedback and improvements on the provided content based on the professor's specific requests.
        You should first analyze the material, then provide specific suggestions for improvement, and finally provide an improved version."""

        # Create the prompt
        user_prompt = f"""
        Please review this {request.material_type} and provide feedback based on the following request:

        FEEDBACK REQUEST:
        {request.feedback}

        CONTENT TO REVIEW:
        {request.content}

        Please provide:
        1. An analysis of the current strengths and weaknesses
        2. Specific suggestions for improvement
        3. An improved version of the content

        Format your response as JSON with the following structure:
        ```json
        {{
          "analysis": "Your analysis here...",
          "suggestions": [
            "Suggestion 1",
            "Suggestion 2",
            ...
          ],
          "improved_content": "Your improved version here..."
        }}
        ```
        """

        # Create messages for the LLM
        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=user_prompt),
        ]

        # Get response from LLM
        response = await llm.generate(messages, config)

        # Extract JSON from response
        import re
        import json

        json_match = re.search(r"```json(.+?)```", response, re.DOTALL)
        if not json_match:
            json_match = re.search(r"```(.+?)```", response, re.DOTALL)

        if json_match:
            json_str = json_match.group(1).strip()
        else:
            json_str = response

        # Clean up any non-JSON content
        json_str = re.sub(r"```json|```", "", json_str)

        # Parse JSON
        feedback_data = json.loads(json_str)

        return feedback_data

    except Exception as e:
        print(f"Error getting feedback: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
    finally:
        # Ensure LLM client is closed properly if created
        if "llm" in locals():
            await llm.close()


@router.get("/assistant/llm-options")
async def get_assistant_llm_options():
    """Get available LLM providers and their models for the professor assistant"""
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
