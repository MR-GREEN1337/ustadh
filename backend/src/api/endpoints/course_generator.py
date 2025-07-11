from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    BackgroundTasks,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import json
from datetime import datetime, timedelta
import asyncio
import logging

from src.db.postgresql import get_session
from src.db.models.user import User
from src.db.models.school import SchoolCourse, SchoolStaff, Department
from src.api.endpoints.auth import get_current_active_user
from src.core.llm import LLM, Message, LLMConfig, LLMProvider
from src.core.settings import settings
from src.core.security import decode_access_token
from starlette.websockets import WebSocketState

from sqlalchemy import and_
from src.db.models import (
    CourseGenerationSession,
    SchoolProfessor,
    Assignment,
)

# Logger
logger = logging.getLogger(__name__)

# Fix 1: Update the router prefix
router = APIRouter(prefix="/course-generator", tags=["course-generator"])

# Maintain active WebSocket connections
active_connections: Dict[str, Dict[str, WebSocket]] = {}

# Maintain active generation sessions
active_sessions: Dict[str, Dict[str, Any]] = {}


# Models
class CourseGenerationRequest(BaseModel):
    subject_area: str
    education_level: str
    key_topics: Optional[str] = None
    course_duration: str = "semester"
    difficulty_level: Optional[str] = "intermediate"
    additional_context: Optional[str] = None
    include_assessments: bool = True
    include_project_ideas: bool = True
    teaching_materials: bool = True


class CourseAssessment(BaseModel):
    title: str
    type: str  # 'quiz', 'assignment', 'project', 'exam'
    description: str
    weight: Optional[float] = None


class CourseSyllabus(BaseModel):
    week: int
    title: str
    topics: List[str]
    description: str
    activities: Optional[List[str]] = None


class CourseData(BaseModel):
    title: str
    code: str
    description: str
    status: str = "draft"
    topics: List[str]
    learning_objectives: List[str]
    prerequisites: Optional[List[str]] = None
    assessments: Optional[List[CourseAssessment]] = None
    syllabus: List[CourseSyllabus]
    recommended_materials: Optional[List[str]] = None


# WebSocket connection manager
class ConnectionManager:
    @staticmethod
    def add_connection(session_id: str, user_id: str, websocket: WebSocket):
        """Add a WebSocket connection to the active connections."""
        if session_id not in active_connections:
            active_connections[session_id] = {}
        active_connections[session_id][user_id] = websocket
        logger.info(f"Added connection for session {session_id}, user {user_id}")

    @staticmethod
    def remove_connection(session_id: str, user_id: str):
        """Remove a WebSocket connection from active connections."""
        try:
            if (
                session_id in active_connections
                and user_id in active_connections[session_id]
            ):
                del active_connections[session_id][user_id]
                if not active_connections[session_id]:
                    del active_connections[session_id]
                logger.info(
                    f"Removed connection for session {session_id}, user {user_id}"
                )
        except Exception as e:
            logger.error(f"Error removing connection: {str(e)}")

    @staticmethod
    async def send_personal_message(message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific WebSocket with error handling."""
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_text(json.dumps(message))
                return True
        except Exception as e:
            logger.error(f"Error sending personal message: {str(e)}")
            return False
        return False

    @staticmethod
    async def broadcast(session_id: str, message: Dict[str, Any]):
        """Broadcast a message to all connections in a session with improved error handling."""
        if session_id not in active_connections:
            logger.warning(f"No active connections for session {session_id}")
            return

        disconnected = []
        successful_sends = 0

        for user_id, websocket in active_connections[session_id].items():
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_text(json.dumps(message))
                    successful_sends += 1
                else:
                    disconnected.append(user_id)
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {str(e)}")
                disconnected.append(user_id)

        # Clean up disconnected websockets
        for user_id in disconnected:
            ConnectionManager.remove_connection(session_id, user_id)

        logger.info(
            f"Broadcast to session {session_id}: {successful_sends} successful, {len(disconnected)} failed"
        )


# Course generation service
class CourseGenerator:
    """Course generation using direct LLM integration."""

    @staticmethod
    async def extract_topics_from_text(text: str) -> List[str]:
        """Extract topics from text that may be formatted as a list."""
        topics = []
        for line in text.split("\n"):
            line = line.strip()
            if line and (
                line.startswith("-")
                or line.startswith("*")
                or any(line.startswith(f"{i}.") for i in range(1, 20))
            ):
                # Clean up the topic text
                topic = line.lstrip("-*0123456789. ").strip()
                if topic:
                    topics.append(topic)

        # If no topics were parsed, try to extract them from the text
        if not topics:
            # Simple fallback to extract potential topics
            topics = [t.strip() for t in text.split(",") if t.strip()]
            if not topics and len(text.strip()) > 0:
                # Last resort: split by newlines or periods
                topics = [
                    t.strip()
                    for t in text.replace("\n", ".").split(".")
                    if len(t.strip()) > 10
                ]

        return topics

    @staticmethod
    async def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
        """Attempt to extract JSON from text."""
        json_start = text.find("{")
        json_end = text.rfind("}") + 1

        if json_start >= 0 and json_end > json_start:
            json_str = text[json_start:json_end]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass

        json_start = text.find("[")
        json_end = text.rfind("]") + 1

        if json_start >= 0 and json_end > json_start:
            json_str = text[json_start:json_end]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass

        return None

    @staticmethod
    async def start_generation(
        session_id: str,
        user_id: str,
        data: Dict[str, Any],
        background_tasks: BackgroundTasks,
        db: AsyncSession,
    ):
        """Start the course generation process."""
        # Initialize session data
        if session_id not in active_sessions:
            active_sessions[session_id] = {
                "user_id": user_id,
                "status": "brainstorming",
                "progress": 0,
                "data": data,
                "course_data": None,
                "messages": [],
                "files": [],
                "start_time": datetime.utcnow(),
            }

        # Add generation task to background tasks
        background_tasks.add_task(
            CourseGenerator.generate_course,
            session_id,
            user_id,
            data,
            db,
        )

        # Return initial status
        return {
            "session_id": session_id,
            "status": "initiated",
            "message": "Course generation has been started in the background.",
        }

    @staticmethod
    async def generate_course(
        session_id: str, user_id: str, data: Dict[str, Any], db: AsyncSession
    ):
        """Main course generation process that runs in the background."""
        try:
            # Initialize LLM with configured provider (default to OpenAI if not specified)
            llm_provider = (
                settings.DEFAULT_LLM_PROVIDER
                if hasattr(settings, "DEFAULT_LLM_PROVIDER")
                else LLMProvider.OPENAI
            )
            llm = LLM(provider=llm_provider)

            # LLM model selection based on provider
            llm_model = (
                "gpt-4-turbo-preview"
                if llm_provider == LLMProvider.OPENAI
                else "llama3-70b-8192"
            )

            # Update status
            await CourseGenerator.update_status(
                session_id, "brainstorming", 5, "Researching subject area..."
            )

            # Get user and school info
            result = await db.execute(
                select(SchoolStaff).where(SchoolStaff.user_id == int(user_id))
            )
            school_staff = result.scalars().first()

            if not school_staff:
                await CourseGenerator.update_status(
                    session_id, "error", 0, "User is not associated with any school."
                )
                await llm.close()
                return

            # Step 1: Initial research and brainstorming (15%)
            await CourseGenerator.update_status(
                session_id, "brainstorming", 10, "Brainstorming topics..."
            )

            # Generate topics
            topics_messages = [
                Message(
                    role="system",
                    content="You are an expert curriculum designer specialized in creating comprehensive course outlines. "
                    "Your task is to generate a list of key topics for a course based on the provided information.",
                ),
                Message(
                    role="user",
                    content=f"I'm designing a course on {data.get('subjectArea')} for {data.get('educationLevel')} level students. "
                    f"The course will run for a {data.get('courseDuration')}. "
                    f"Please suggest 10-15 key topics that should be covered in this course."
                    f"{f' Here are some topics I\'d like to include: {data.get('keyTopics')}' if data.get('keyTopics') else ''}",
                ),
            ]

            topics_config = LLMConfig(model=llm_model, temperature=0.7, max_tokens=1000)

            topics_response = await llm.generate(topics_messages, topics_config)
            topics = await CourseGenerator.extract_topics_from_text(topics_response)

            # Ensure we have at least a few topics
            if len(topics) < 3:
                topics = [
                    f"Introduction to {data.get('subjectArea')}",
                    f"Fundamentals of {data.get('subjectArea')}",
                    f"Advanced concepts in {data.get('subjectArea')}",
                    f"Applications of {data.get('subjectArea')}",
                    f"Future trends in {data.get('subjectArea')}",
                ]

            # Add AI message about topics
            await CourseGenerator.add_message(
                session_id,
                "assistant",
                "I've brainstormed some key topics for this course:\n\n"
                + "\n".join([f"- {topic}" for topic in topics[:5]])
                + "\n\n...and more. What specific areas would you like to emphasize?",
            )

            await asyncio.sleep(1)  # Brief pause to simulate thinking

            # Step 2: Generate learning objectives (30%)
            await CourseGenerator.update_status(
                session_id, "structuring", 25, "Developing learning objectives..."
            )

            # Construct topics string from the list
            topics_str = "\n".join([f"- {topic}" for topic in topics])

            # Generate learning objectives
            objectives_messages = [
                Message(
                    role="system",
                    content="You are an expert curriculum designer specialized in creating measurable learning objectives. "
                    "Your task is to generate a list of learning objectives for a course based on the provided information.",
                ),
                Message(
                    role="user",
                    content=f"I'm designing a course on {data.get('subjectArea')} for {data.get('educationLevel')} level students. "
                    f"The course will run for a {data.get('courseDuration')}. "
                    f"Here are the key topics we'll be covering:\n\n{topics_str}\n\n"
                    f"Please generate 5-7 measurable learning objectives for this course. These should be specific, "
                    f"measurable statements describing what students should know or be able to do by the end of the course.",
                ),
            ]

            objectives_config = LLMConfig(
                model=llm_model, temperature=0.7, max_tokens=1000
            )

            objectives_response = await llm.generate(
                objectives_messages, objectives_config
            )
            learning_objectives = await CourseGenerator.extract_topics_from_text(
                objectives_response
            )

            # Ensure we have some learning objectives
            if len(learning_objectives) < 3:
                learning_objectives = [
                    f"Understand the core principles of {data.get('subjectArea')}",
                    f"Apply key theories and methods in {data.get('subjectArea')} to solve relevant problems",
                    f"Analyze and evaluate information related to {data.get('subjectArea')}",
                    f"Develop critical thinking skills within the context of {data.get('subjectArea')}",
                ]

            # Add AI message about learning objectives
            await CourseGenerator.add_message(
                session_id,
                "assistant",
                "Based on the subject area, I've developed these learning objectives:\n\n"
                + "\n".join([f"- {obj}" for obj in learning_objectives[:3]])
                + "\n\nDoes this align with your goals for the course?",
            )

            await asyncio.sleep(1)  # Brief pause to simulate thinking

            # Step 3: Generate syllabus (60%)
            await CourseGenerator.update_status(
                session_id, "detailing", 40, "Creating syllabus outline..."
            )

            # Determine number of weeks based on course duration
            duration_to_weeks = {"short": 4, "quarter": 10, "semester": 15, "year": 30}
            num_weeks = duration_to_weeks.get(
                data.get("courseDuration", "semester"), 15
            )

            # Generate syllabus
            objectives_str = "\n".join([f"- {obj}" for obj in learning_objectives])

            syllabus_messages = [
                Message(
                    role="system",
                    content="You are an expert curriculum designer specialized in creating detailed course syllabi. "
                    "Your task is to generate a weekly breakdown of a course in JSON format.",
                ),
                Message(
                    role="user",
                    content=f"I'm designing a {num_weeks}-week course on {data.get('subjectArea')} for {data.get('educationLevel')} level students. "
                    f"Here are the key topics:\n\n{topics_str}\n\n"
                    f"And the learning objectives:\n\n{objectives_str}\n\n"
                    f"Please create a weekly syllabus breakdown. For each week include: week number, title, list of topics, "
                    f"brief description, and suggested activities. Output the result as a JSON array with these fields.",
                ),
            ]

            syllabus_config = LLMConfig(
                model=llm_model, temperature=0.7, max_tokens=2000
            )

            syllabus_response = await llm.generate(syllabus_messages, syllabus_config)

            # Try to extract JSON
            syllabus_json = await CourseGenerator.extract_json_from_text(
                syllabus_response
            )

            # Process and validate syllabus
            if syllabus_json and isinstance(syllabus_json, list):
                syllabus = syllabus_json

                # Ensure each week has the required fields
                for week in syllabus:
                    if "week" not in week:
                        week["week"] = syllabus.index(week) + 1
                    if "title" not in week:
                        week["title"] = f"Week {week['week']}"
                    if "topics" not in week or not isinstance(week["topics"], list):
                        week["topics"] = [f"Topic for Week {week['week']}"]
                    if "description" not in week:
                        week["description"] = f"Content for Week {week['week']}"
                    if "activities" not in week or not isinstance(
                        week["activities"], list
                    ):
                        week["activities"] = [f"Activity for Week {week['week']}"]
            else:
                # Create a default syllabus if extraction failed
                syllabus = []
                topics_index = 0

                for week in range(1, num_weeks + 1):
                    week_topics = [topics[topics_index % len(topics)]]
                    topics_index += 1

                    syllabus.append(
                        {
                            "week": week,
                            "title": f"Week {week}: {week_topics[0]}",
                            "topics": week_topics,
                            "description": f"Introduction to {week_topics[0]} and related concepts.",
                            "activities": [
                                f"Discussion on {week_topics[0]}",
                                f"Exercise on {week_topics[0]}",
                            ],
                        }
                    )

            # Step 4: Generate assessments
            await CourseGenerator.update_status(
                session_id, "detailing", 60, "Designing assessments..."
            )

            # Generate assessments
            assessments_messages = [
                Message(
                    role="system",
                    content="You are an expert in educational assessment design. "
                    "Your task is to generate a set of assessments for a course in JSON format.",
                ),
                Message(
                    role="user",
                    content=f"I'm designing assessments for a course on {data.get('subjectArea')} for {data.get('educationLevel')} level students. "
                    f"Here are the key topics:\n\n{topics_str}\n\n"
                    f"And the learning objectives:\n\n{objectives_str}\n\n"
                    f"Please create 4-6 assessments, each with a title, type (quiz, assignment, project, exam), description, "
                    f"and weight (percentage of final grade). Output the result as a JSON array.",
                ),
            ]

            assessments_config = LLMConfig(
                model=llm_model, temperature=0.7, max_tokens=1500
            )

            assessments_response = await llm.generate(
                assessments_messages, assessments_config
            )

            # Try to extract JSON
            assessments_json = await CourseGenerator.extract_json_from_text(
                assessments_response
            )

            # Process and validate assessments
            if assessments_json and isinstance(assessments_json, list):
                assessments = assessments_json

                # Ensure each assessment has the required fields
                for assessment in assessments:
                    if "title" not in assessment:
                        assessment["title"] = "Assessment"
                    if "type" not in assessment:
                        assessment["type"] = "exam"
                    if "description" not in assessment:
                        assessment["description"] = (
                            f"Assessment for {data.get('subjectArea')}"
                        )
                    if "weight" not in assessment:
                        assessment["weight"] = 100 // len(assessments)

                # Normalize weights to sum to 100%
                total_weight = sum(
                    assessment.get("weight", 0) for assessment in assessments
                )
                if total_weight != 100 and total_weight > 0:
                    factor = 100 / total_weight
                    for assessment in assessments:
                        assessment["weight"] = round(assessment["weight"] * factor)
            else:
                # Create default assessments if extraction failed
                assessments = [
                    {
                        "title": "Midterm Exam",
                        "type": "exam",
                        "description": f"Comprehensive assessment covering the first half of {data.get('subjectArea')} topics.",
                        "weight": 30,
                    },
                    {
                        "title": "Final Project",
                        "type": "project",
                        "description": f"In-depth exploration of a chosen topic in {data.get('subjectArea')}.",
                        "weight": 40,
                    },
                    {
                        "title": "Quizzes",
                        "type": "quiz",
                        "description": "Regular quizzes to assess ongoing understanding of course material.",
                        "weight": 15,
                    },
                    {
                        "title": "Assignments",
                        "type": "assignment",
                        "description": "Regular practical assignments to apply course concepts.",
                        "weight": 15,
                    },
                ]

            # Add AI message about syllabus and assessments
            await CourseGenerator.add_message(
                session_id,
                "assistant",
                "I've drafted a syllabus structure with weekly topics and a set of assessments. Would you like to see the full course preview?",
            )

            # Step 5: Generate course materials recommendations
            await CourseGenerator.update_status(
                session_id, "finalizing", 80, "Recommending materials..."
            )

            # Generate materials recommendations
            materials_messages = [
                Message(
                    role="system",
                    content="You are an expert in educational resources. "
                    "Your task is to recommend learning materials for a course.",
                ),
                Message(
                    role="user",
                    content=f"I'm looking for recommended learning materials for a course on {data.get('subjectArea')} "
                    f"for {data.get('educationLevel')} level students. Please suggest 3-5 resources, "
                    f"which could include textbooks, online courses, websites, or other relevant materials. "
                    f"Be specific with your recommendations, including titles and authors where applicable.",
                ),
            ]

            materials_config = LLMConfig(
                model=llm_model, temperature=0.7, max_tokens=1000
            )

            materials_response = await llm.generate(
                materials_messages, materials_config
            )
            recommended_materials = await CourseGenerator.extract_topics_from_text(
                materials_response
            )

            # Ensure we have some material recommendations
            if len(recommended_materials) < 2:
                recommended_materials = [
                    f"Textbook: Introduction to {data.get('subjectArea')}",
                    f"Online course: {data.get('subjectArea')} Fundamentals",
                    f"Resource website: {data.get('subjectArea')} Hub",
                ]

            # Step 6: Finalize course
            await CourseGenerator.update_status(
                session_id, "finalizing", 90, "Finalizing course details..."
            )

            # Generate course title and code
            title_messages = [
                Message(
                    role="system",
                    content="You are an expert in course naming and cataloging. Your task is to create an appropriate title and course code.",
                ),
                Message(
                    role="user",
                    content=f"Please suggest a concise, professional title and course code for a {data.get('educationLevel')} level "
                    f"course on {data.get('subjectArea')}. The title should be clear and descriptive. "
                    f"The course code should be in the format of a department prefix (2-4 letters) followed by "
                    f"a number (100-499). Output as JSON with 'title' and 'code' fields.",
                ),
            ]

            title_config = LLMConfig(model=llm_model, temperature=0.7, max_tokens=500)

            title_response = await llm.generate(title_messages, title_config)

            # Try to extract JSON
            title_json = await CourseGenerator.extract_json_from_text(title_response)

            # Set title and code
            if (
                title_json
                and isinstance(title_json, dict)
                and "title" in title_json
                and "code" in title_json
            ):
                title = title_json["title"]
                code = title_json["code"]
            else:
                # Extract from text or use defaults
                if (
                    "title:" in title_response.lower()
                    and "code:" in title_response.lower()
                ):
                    title_lines = title_response.split("\n")
                    title = ""
                    code = ""

                    for line in title_lines:
                        if "title:" in line.lower():
                            title = line.split(":", 1)[1].strip()
                        elif "code:" in line.lower():
                            code = line.split(":", 1)[1].strip()
                else:
                    # Default values
                    title = f"{data.get('subjectArea')} for {data.get('educationLevel')} Students"
                    subject_prefix = "".join(
                        [c for c in data.get("subjectArea") if c.isupper()]
                    )
                    if not subject_prefix:
                        subject_prefix = data.get("subjectArea")[:3].upper()
                    code = f"{subject_prefix}101"

            # Generate course description
            description_messages = [
                Message(
                    role="system",
                    content="You are an expert in writing course descriptions for academic catalogs.",
                ),
                Message(
                    role="user",
                    content=f"Please write a concise, informative course description for a {data.get('educationLevel')} level "
                    f"course titled '{title}' on {data.get('subjectArea')}. The description should be 2-3 sentences "
                    f"highlighting the main focus and value of the course.",
                ),
            ]

            description_config = LLMConfig(
                model=llm_model, temperature=0.7, max_tokens=500
            )

            description = await llm.generate(description_messages, description_config)

            # Assemble complete course data
            course_data = {
                "title": title,
                "code": code,
                "description": description,
                "status": "draft",
                "topics": topics,
                "learning_objectives": learning_objectives,
                "prerequisites": ["Basic understanding of " + data.get("subjectArea")],
                "assessments": assessments,
                "syllabus": syllabus,
                "recommended_materials": recommended_materials,
            }

            # Save course data to session
            if session_id in active_sessions:
                active_sessions[session_id]["course_data"] = course_data

            # Update status to complete
            await CourseGenerator.update_status(
                session_id, "complete", 100, "Course generation completed!"
            )

            # Send course data to client
            await ConnectionManager.broadcast(
                session_id, {"type": "course_data", "courseData": course_data}
            )

            # Add final message
            await CourseGenerator.add_message(
                session_id,
                "assistant",
                "I've completed the course generation! You can now review, edit, and save the course. Feel free to ask if you need any adjustments.",
            )

            await llm.close()

        except Exception as e:
            logger.error(f"Error generating course: {str(e)}")
            await CourseGenerator.update_status(
                session_id, "error", 0, f"Error generating course: {str(e)}"
            )
            await ConnectionManager.broadcast(
                session_id,
                {
                    "type": "error",
                    "message": f"An error occurred during course generation: {str(e)}",
                },
            )
            try:
                await llm.close()
            except Exception as e:
                logger.error(f"Error closing LLM: {str(e)}")

    @staticmethod
    async def update_status(session_id: str, status: str, progress: int, step: str):
        """Update the status of a generation session and broadcast to clients."""
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = status
            active_sessions[session_id]["progress"] = progress
            active_sessions[session_id]["current_step"] = step

            # Broadcast status update
            await ConnectionManager.broadcast(
                session_id,
                {
                    "type": "status_update",
                    "status": status,
                    "progress": progress,
                    "step": step,
                },
            )

    @staticmethod
    async def add_message(session_id: str, role: str, content: str):
        """Add a message to the session and broadcast to clients."""
        if session_id in active_sessions:
            message = {
                "messageId": f"msg-{uuid.uuid4()}",
                "role": role,
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
            }

            active_sessions[session_id]["messages"].append(message)

            # Only broadcast non-user messages to prevent duplicates
            # User messages are already shown optimistically in the frontend
            if role != "user":
                await ConnectionManager.broadcast(
                    session_id, {"type": "message", **message}
                )

    @staticmethod
    async def process_user_message(
        session_id: str, user_id: str, content: str, db: AsyncSession
    ):
        """Process a user message and generate a response."""
        if session_id not in active_sessions:
            return {"error": "Session not found"}

        # Add user message to session but don't broadcast it (frontend already shows it)
        user_message = {
            "messageId": f"msg-{uuid.uuid4()}",
            "role": "user",
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
        active_sessions[session_id]["messages"].append(user_message)

        # Add user message to session
        await CourseGenerator.add_message(session_id, "user", content)

        try:
            # Initialize LLM
            llm_provider = (
                settings.DEFAULT_LLM_PROVIDER
                if hasattr(settings, "DEFAULT_LLM_PROVIDER")
                else LLMProvider.OPENAI
            )
            llm = LLM(provider=llm_provider)

            # LLM model selection based on provider
            llm_model = (
                "gpt-4-turbo-preview"
                if llm_provider == LLMProvider.OPENAI
                else "llama3-70b-8192"
            )

            # Get session context
            context = active_sessions[session_id]["data"]
            course_data = active_sessions[session_id].get("course_data", {})

            # Prepare prompt context with conversation history
            conversation_history = []
            for msg in active_sessions[session_id]["messages"]:
                if msg["role"] in ["user", "assistant"]:
                    conversation_history.append(
                        {"role": msg["role"], "content": msg["content"]}
                    )

            # Format course data for context
            course_context = json.dumps(
                {
                    "subject_area": context.get("subjectArea", ""),
                    "education_level": context.get("educationLevel", ""),
                    "course_duration": context.get("courseDuration", ""),
                    "course_data": {
                        k: v
                        for k, v in course_data.items()
                        if k
                        in [
                            "title",
                            "code",
                            "topics",
                            "learning_objectives",
                            "prerequisites",
                        ]
                    }
                    if course_data
                    else {},
                },
                indent=2,
            )

            # Construct messages for the LLM
            messages = [
                Message(
                    role="system",
                    content=f"You are an AI assistant helping a professor design a course. You provide helpful, supportive guidance. "
                    f"You have access to the following course context:\n```json\n{course_context}\n```\n"
                    f"If the professor asks for changes or has suggestions, you should acknowledge them and provide thoughtful responses. "
                    f"Answer questions clearly and concisely, focusing on educational best practices.",
                )
            ]

            # Add conversation history
            for msg in conversation_history[
                -10:
            ]:  # Only use the last 10 messages to avoid token limits
                messages.append(Message(role=msg["role"], content=msg["content"]))

            # Configure LLM request
            config = LLMConfig(model=llm_model, temperature=0.7, max_tokens=1000)

            # Generate response
            response_text = await llm.generate(messages, config)

            # Add AI response to session
            await CourseGenerator.add_message(session_id, "assistant", response_text)

            # Check if we need to update the course based on the user message
            update_course = False
            updated_data = {}

            # Check if user message suggests course updates
            lower_msg = content.lower()
            if any(
                phrase in lower_msg
                for phrase in [
                    "change",
                    "modify",
                    "update",
                    "add",
                    "remove",
                    "include",
                    "instead of",
                    "rather than",
                    "prefer",
                    "suggestion",
                ]
            ):
                # Check if it's about specific parts of the course
                if any(part in lower_msg for part in ["title", "name", "subject"]):
                    update_course = True

                    # Generate new title
                    title_messages = [
                        Message(
                            role="system",
                            content="You are an expert in course naming. Your task is to create an appropriate title for a course.",
                        ),
                        Message(
                            role="user",
                            content=f"Based on this conversation:\n\n{content}\n\nSuggest a new title for the course on {context.get('subjectArea')}.",
                        ),
                    ]

                    title_config = LLMConfig(
                        model=llm_model, temperature=0.5, max_tokens=100
                    )

                    new_title = await llm.generate(title_messages, title_config)
                    updated_data["title"] = new_title.strip()

                if any(part in lower_msg for part in ["topic", "content", "subject"]):
                    update_course = True

                    # Extract suggested topics from user message
                    suggested_topics = []
                    for line in content.split("\n"):
                        line = line.strip()
                        if line and (
                            line.startswith("-")
                            or line.startswith("*")
                            or any(line.startswith(f"{i}.") for i in range(1, 20))
                        ):
                            topic = line.lstrip("-*0123456789. ").strip()
                            if topic:
                                suggested_topics.append(topic)

                    if suggested_topics:
                        # Merge with existing topics
                        existing_topics = course_data.get("topics", [])
                        updated_data["topics"] = list(
                            set(existing_topics + suggested_topics)
                        )
                    else:
                        # Generate topics based on user message
                        topics_messages = [
                            Message(
                                role="system",
                                content="You are an expert curriculum designer. Extract or suggest topics based on the user's message.",
                            ),
                            Message(
                                role="user",
                                content=f"Based on this message:\n\n{content}\n\nExtract or suggest specific topics for a course on {context.get('subjectArea')}. Provide a list of 3-5 topics.",
                            ),
                        ]

                        topics_config = LLMConfig(
                            model=llm_model, temperature=0.5, max_tokens=500
                        )

                        topics_response = await llm.generate(
                            topics_messages, topics_config
                        )
                        new_topics = await CourseGenerator.extract_topics_from_text(
                            topics_response
                        )

                        if new_topics:
                            existing_topics = course_data.get("topics", [])
                            updated_data["topics"] = list(
                                set(existing_topics + new_topics)
                            )

                if any(part in lower_msg for part in ["objective", "goal", "outcome"]):
                    update_course = True

                    # Extract suggested objectives from user message
                    suggested_objectives = []
                    for line in content.split("\n"):
                        line = line.strip()
                        if line and (
                            line.startswith("-")
                            or line.startswith("*")
                            or any(line.startswith(f"{i}.") for i in range(1, 20))
                        ):
                            objective = line.lstrip("-*0123456789. ").strip()
                            if objective:
                                suggested_objectives.append(objective)

                    if suggested_objectives:
                        # Merge with existing objectives
                        existing_objectives = course_data.get("learning_objectives", [])
                        updated_data["learning_objectives"] = list(
                            set(existing_objectives + suggested_objectives)
                        )
                    else:
                        # Generate objectives based on user message
                        objectives_messages = [
                            Message(
                                role="system",
                                content="You are an expert in educational design. Extract or suggest learning objectives based on the user's message.",
                            ),
                            Message(
                                role="user",
                                content=f"Based on this message:\n\n{content}\n\nExtract or suggest learning objectives for a course on {context.get('subjectArea')}. Provide a list of 3-5 measurable objectives.",
                            ),
                        ]

                        objectives_config = LLMConfig(
                            model=llm_model, temperature=0.5, max_tokens=500
                        )

                        objectives_response = await llm.generate(
                            objectives_messages, objectives_config
                        )
                        new_objectives = await CourseGenerator.extract_topics_from_text(
                            objectives_response
                        )

                        if new_objectives:
                            existing_objectives = course_data.get(
                                "learning_objectives", []
                            )
                            updated_data["learning_objectives"] = list(
                                set(existing_objectives + new_objectives)
                            )

                if any(
                    part in lower_msg
                    for part in ["assessment", "exam", "quiz", "assignment", "project"]
                ):
                    update_course = True

                    # Generate new assessments based on user message
                    assessments_messages = [
                        Message(
                            role="system",
                            content="You are an expert in educational assessment design. Your task is to update assessments based on user feedback.",
                        ),
                        Message(
                            role="user",
                            content=f"Based on this feedback:\n\n{content}\n\nUpdate or generate assessments for a course on {context.get('subjectArea')}. "
                            f"Include title, type, description, and weight for each. Output as JSON.",
                        ),
                    ]

                    assessments_config = LLMConfig(
                        model=llm_model, temperature=0.5, max_tokens=1000
                    )

                    assessments_response = await llm.generate(
                        assessments_messages, assessments_config
                    )
                    assessments_json = await CourseGenerator.extract_json_from_text(
                        assessments_response
                    )

                    if assessments_json and isinstance(assessments_json, list):
                        # Validate the assessments
                        for assessment in assessments_json:
                            if "title" not in assessment:
                                assessment["title"] = "Assessment"
                            if "type" not in assessment:
                                assessment["type"] = "exam"
                            if "description" not in assessment:
                                assessment["description"] = (
                                    f"Assessment for {context.get('subjectArea')}"
                                )
                            if "weight" not in assessment:
                                assessment["weight"] = 100 // len(assessments_json)

                        # Normalize weights
                        total_weight = sum(
                            assessment.get("weight", 0)
                            for assessment in assessments_json
                        )
                        if total_weight != 100 and total_weight > 0:
                            factor = 100 / total_weight
                            for assessment in assessments_json:
                                assessment["weight"] = round(
                                    assessment["weight"] * factor
                                )

                        updated_data["assessments"] = assessments_json

            # If we have updates, update the course data
            if update_course and updated_data:
                # Merge updates into existing course data
                if course_data:
                    for key, value in updated_data.items():
                        if key in course_data:
                            course_data[key] = value
                else:
                    course_data = updated_data

                # Save updated data
                active_sessions[session_id]["course_data"] = course_data

                # Broadcast updated course data
                await ConnectionManager.broadcast(
                    session_id, {"type": "course_data", "courseData": course_data}
                )

            await llm.close()
            return {"success": True}

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            await ConnectionManager.broadcast(
                session_id,
                {
                    "type": "error",
                    "message": f"An error occurred while processing your message: {str(e)}",
                },
            )
            try:
                await llm.close()
            except Exception as e:
                logger.error(f"Error closing LLM: {str(e)}")
            return {"error": str(e)}


# API Endpoints
@router.post("/start", status_code=201)
async def start_course_generation(
    request: CourseGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Start a course generation process."""
    session_id = f"course-gen-{uuid.uuid4()}"

    # Start generation
    result = await CourseGenerator.start_generation(
        session_id, str(current_user.id), request.dict(), background_tasks, db
    )

    return {"session_id": session_id, **result}


@router.get("/sessions/{session_id}", status_code=200)
async def get_session_status(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get the status of a course generation session."""
    print(active_sessions)
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if user has access to this session
    if str(active_sessions[session_id]["user_id"]) != str(current_user.id):
        raise HTTPException(
            status_code=403, detail="Not authorized to access this session"
        )

    return {
        "session_id": session_id,
        "status": active_sessions[session_id]["status"],
        "progress": active_sessions[session_id]["progress"],
        "current_step": active_sessions[session_id].get("current_step", ""),
        "messages_count": len(active_sessions[session_id]["messages"]),
        "start_time": active_sessions[session_id]["start_time"].isoformat(),
    }


@router.get("/sessions/{session_id}/messages", status_code=200)
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get the messages from a course generation session."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if user has access to this session
    if str(active_sessions[session_id]["user_id"]) != str(current_user.id):
        raise HTTPException(
            status_code=403, detail="Not authorized to access this session"
        )

    return {"messages": active_sessions[session_id]["messages"]}


@router.post("/sessions/{session_id}/save", status_code=201)
async def save_generated_course(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Save a generated course to the database."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if user has access to this session
    if str(active_sessions[session_id]["user_id"]) != str(current_user.id):
        raise HTTPException(
            status_code=403, detail="Not authorized to access this session"
        )

    # Check if course generation is complete
    if active_sessions[session_id]["status"] != "complete":
        raise HTTPException(status_code=400, detail="Course generation is not complete")

    # Get course data
    course_data = active_sessions[session_id]["course_data"]
    if not course_data:
        raise HTTPException(status_code=400, detail="No course data available")

    try:
        # Get user's school staff record
        result = await db.execute(
            select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
        )
        school_staff = result.scalars().first()

        if not school_staff:
            raise HTTPException(
                status_code=400, detail="User is not associated with any school"
            )

        # Get default department or create one if needed
        result = await db.execute(
            select(Department)
            .where(Department.school_id == school_staff.school_id)
            .limit(1)
        )
        department = result.scalars().first()

        # Create the course
        new_course = SchoolCourse(
            school_id=school_staff.school_id,
            department_id=department.id if department else None,
            teacher_id=school_staff.id,
            title=course_data["title"],
            code=course_data["code"],
            description=course_data["description"],
            academic_year=datetime.utcnow().year,
            education_level=active_sessions[session_id]["data"]["educationLevel"],
            ai_tutoring_enabled=True,
            status="draft",
            learning_objectives=course_data["learning_objectives"],
            prerequisites=course_data.get("prerequisites", []),
            suggested_topics=course_data["topics"],
            syllabus={
                "weeks": [
                    {
                        "week": week["week"],
                        "title": week["title"],
                        "topics": week["topics"],
                        "description": week["description"],
                        "activities": week.get("activities", []),
                    }
                    for week in course_data["syllabus"]
                ]
            },
            assessment_types=[
                assessment["type"] for assessment in course_data.get("assessments", [])
            ],
            grading_schema={
                "assessments": [
                    {
                        "title": assessment["title"],
                        "type": assessment["type"],
                        "description": assessment["description"],
                        "weight": assessment.get("weight", 0),
                    }
                    for assessment in course_data.get("assessments", [])
                ]
            },
            required_materials={
                "textbooks": [
                    material
                    for material in course_data.get("recommended_materials", [])
                    if "textbook" in material.lower()
                ],
                "other": [
                    material
                    for material in course_data.get("recommended_materials", [])
                    if "textbook" not in material.lower()
                ],
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(new_course)
        await db.commit()
        await db.refresh(new_course)

        return {
            "id": new_course.id,
            "title": new_course.title,
            "message": "Course saved successfully",
        }

    except Exception as e:
        logger.error(f"Error saving course: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving course: {str(e)}")


@router.websocket("/ws")
async def websocket_course_generator(
    websocket: WebSocket,
    token: str = Query(...),
    user_id: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
):
    """WebSocket endpoint for real-time course generation."""

    # Accept connection IMMEDIATELY
    await websocket.accept()

    db = None
    try:
        # Verify the token and get the user (with error handling)
        try:
            payload = decode_access_token(token)
            username = payload.get("sub")

            if not username:
                await websocket.send_text(
                    json.dumps(
                        {"type": "error", "message": "Invalid authentication token"}
                    )
                )
                await websocket.close(code=1008, reason="Invalid authentication")
                return
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            await websocket.send_text(
                json.dumps({"type": "error", "message": "Authentication failed"})
            )
            await websocket.close(code=1008, reason="Authentication failed")
            return

        # Set up the database session with error handling
        try:
            async_session = get_session()
            db = await anext(async_session)
        except Exception as e:
            logger.error(f"Failed to get database session: {str(e)}")
            await websocket.send_text(
                json.dumps({"type": "error", "message": "Database connection failed"})
            )
            await websocket.close(code=1011, reason="Database connection failed")
            return

        # Find user and validate
        try:
            result = await db.execute(select(User).where(User.username == username))
            user = result.scalars().first()

            if not user:
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "User not found"})
                )
                await websocket.close(code=1008, reason="User not found")
                return
        except Exception as e:
            logger.error(f"User lookup failed: {str(e)}")
            await websocket.send_text(
                json.dumps({"type": "error", "message": "User lookup failed"})
            )
            await websocket.close(code=1011, reason="User lookup failed")
            return

        user_id = user_id or str(user.id)
        session_id = session_id or f"course-gen-{uuid.uuid4()}"

        # Add connection to manager
        ConnectionManager.add_connection(session_id, user_id, websocket)

        # Send confirmation message
        await ConnectionManager.send_personal_message(
            {
                "type": "connection_established",
                "message": "Connected to course generator",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "session_id": session_id,
            },
            websocket,
        )

        # Process messages from client
        while True:
            try:
                # Receive message with proper timeout
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_text(), timeout=60.0
                    )
                except asyncio.TimeoutError:
                    # Send ping to check if client is still alive
                    await websocket.send_text(json.dumps({"type": "ping"}))
                    continue
                except WebSocketDisconnect:
                    logger.info(
                        f"WebSocket disconnected gracefully for session {session_id}"
                    )
                    break

                # Parse message with error handling
                try:
                    content = json.loads(data)
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON: {e}")
                    await ConnectionManager.send_personal_message(
                        {"type": "error", "message": "Invalid JSON format"},
                        websocket,
                    )
                    continue

                msg_type = content.get("type")
                logger.info(f"Processing message type: {msg_type}")

                # Process different message types
                if msg_type == "start_generation":
                    # Use background tasks for long operations
                    asyncio.create_task(
                        handle_start_generation(
                            session_id, user_id, content.get("data", {}), db
                        )
                    )

                elif msg_type == "message":
                    # Process user message asynchronously
                    message_content = content.get("data", {}).get("content", "")
                    if message_content.strip():
                        asyncio.create_task(
                            handle_user_message(
                                session_id, user_id, message_content, db
                            )
                        )

                elif msg_type == "ping":
                    # Respond to ping
                    await ConnectionManager.send_personal_message(
                        {
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        websocket,
                    )

                # Send acknowledgment for received message
                await ConnectionManager.send_personal_message(
                    {
                        "type": "message_received",
                        "original_type": msg_type,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    websocket,
                )

            except Exception as e:
                logger.error(f"Error in message loop: {type(e).__name__}: {e}")
                try:
                    await ConnectionManager.send_personal_message(
                        {
                            "type": "error",
                            "message": f"Message processing error: {str(e)}",
                        },
                        websocket,
                    )
                except Exception as e:
                    logger.error(f"Error sending message: {type(e).__name__}: {e}")
                    break

    except Exception as e:
        logger.error(f"WebSocket handler error: {type(e).__name__}: {e}")
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": f"Server error: {str(e)}"})
            )
        except Exception as e:
            logger.error(f"Error sending message: {type(e).__name__}: {e}")
            pass
    finally:
        # Cleanup
        ConnectionManager.remove_connection(session_id, user_id)
        if db:
            try:
                await db.close()
            except Exception as e:
                logger.error(f"Error closing database session: {type(e).__name__}: {e}")
                pass


# Helper functions to handle long operations
async def handle_start_generation(
    session_id: str, user_id: str, data: Dict[str, Any], db: AsyncSession
):
    """Handle course generation start in background"""
    try:
        background_tasks = BackgroundTasks()
        await CourseGenerator.start_generation(
            session_id,
            user_id,
            data,
            background_tasks,
            db,
        )
        # Execute background tasks
        await background_tasks()
    except Exception as e:
        logger.error(f"Error in start_generation: {e}")
        await ConnectionManager.broadcast(
            session_id, {"type": "error", "message": f"Generation error: {str(e)}"}
        )


async def handle_user_message(
    session_id: str, user_id: str, content: str, db: AsyncSession
):
    """Handle user message processing in background"""
    try:
        await CourseGenerator.process_user_message(session_id, user_id, content, db)
    except Exception as e:
        logger.error(f"Error processing user message: {e}")
        await ConnectionManager.broadcast(
            session_id,
            {"type": "error", "message": f"Error processing message: {str(e)}"},
        )


@router.get("/sessions", status_code=200)
async def get_course_generation_sessions(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Get all course generation sessions for the current user."""
    query = select(CourseGenerationSession).where(
        CourseGenerationSession.user_id == current_user.id
    )

    if status:
        query = query.where(CourseGenerationSession.status == status)

    query = (
        query.order_by(CourseGenerationSession.last_activity.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    sessions = result.scalars().all()

    # Transform sessions for frontend
    response_sessions = []
    for session in sessions:
        # Use actual title from course_data if available, otherwise generate one
        course_data = session.course_data or {}
        title = (
            course_data.get("title")
            or session.title
            or f"{session.subject} - {session.education_level}"
        )
        description = course_data.get("description", "")

        response_session = {
            "id": session.id,
            "subject": session.subject,
            "educationLevel": session.education_level,
            "duration": session.duration,
            "status": session.status,
            "progress": session.progress,
            "createdAt": session.created_at.isoformat(),
            "lastActivity": session.last_activity.isoformat(),
            "title": title,
            "description": description,
            "lastModified": session.updated_at.isoformat()
            if session.updated_at
            else None,
            "difficulty": session.difficulty,
            "language": session.language,
        }
        response_sessions.append(response_session)

    return {"sessions": response_sessions}


@router.get("/sessions/{session_id}", status_code=200)
async def get_course_generation_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Get a specific course generation session."""
    result = await db.execute(
        select(CourseGenerationSession).where(
            and_(
                CourseGenerationSession.id == session_id,
                CourseGenerationSession.user_id == current_user.id,
            )
        )
    )
    session: CourseGenerationSession = result.scalars().first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    course_data = session.course_data or {}

    return {
        "sessionId": session.id,
        "status": session.status,
        "progress": session.progress,
        "currentStep": session.current_step,
        "courseData": course_data,
        "messages": session.messages,
        "error": session.error_message,
        "subject": session.subject,
        "educationLevel": session.education_level,
        "duration": session.duration,
        "difficulty": session.difficulty,
        "language": session.language,
        "preferences": session.preferences,
        "createdAt": session.created_at.isoformat(),
        "lastActivity": session.last_activity.isoformat(),
        "updatedAt": session.updated_at.isoformat() if session.updated_at else None,
    }


@router.post("/sessions", status_code=201)
async def create_course_generation_session(
    request: CourseGenerationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new course generation session without starting generation."""
    session_id = f"course-gen-{uuid.uuid4()}"

    # Get professor info if user is a professor
    result = await db.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = result.scalars().first()

    # Create session in database
    session = CourseGenerationSession(
        id=session_id,
        user_id=current_user.id,
        professor_id=professor.id if professor else None,
        subject=request.subject_area,
        education_level=request.education_level,
        duration=request.course_duration,
        difficulty=request.difficulty_level or "intermediate",
        focus="comprehensive",  # Default for now
        language="en",  # Default for now
        preferences={
            "key_topics": request.key_topics,
            "include_assessments": request.include_assessments,
            "include_project_ideas": request.include_project_ideas,
            "teaching_materials": request.teaching_materials,
            "additional_context": request.additional_context,
        },
        status="created",
        progress=0,
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "sessionId": session.id,
        "status": session.status,
        "message": "Session created successfully",
    }


@router.delete("/sessions/{session_id}", status_code=200)
async def delete_course_generation_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Delete a course generation session."""
    result = await db.execute(
        select(CourseGenerationSession).where(
            and_(
                CourseGenerationSession.id == session_id,
                CourseGenerationSession.user_id == current_user.id,
            )
        )
    )
    session: CourseGenerationSession = result.scalars().first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Delete the session
    await db.delete(session)
    await db.commit()

    return {"message": "Session deleted successfully"}


@router.post("/sessions/{session_id}/duplicate", status_code=201)
async def duplicate_course_generation_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Duplicate an existing course generation session."""
    result = await db.execute(
        select(CourseGenerationSession).where(
            and_(
                CourseGenerationSession.id == session_id,
                CourseGenerationSession.user_id == current_user.id,
            )
        )
    )
    original_session: CourseGenerationSession = result.scalars().first()

    if not original_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Create new session ID
    new_session_id = f"course-gen-{uuid.uuid4()}"

    # Create duplicate session
    duplicate_session = CourseGenerationSession(
        id=new_session_id,
        user_id=original_session.user_id,
        professor_id=original_session.professor_id,
        subject=original_session.subject,
        education_level=original_session.education_level,
        duration=original_session.duration,
        difficulty=original_session.difficulty,
        focus=original_session.focus,
        language=original_session.language,
        preferences=original_session.preferences.copy(),
        status="created",
        progress=0,
        # Don't copy course_data or messages - this is a fresh start
    )

    db.add(duplicate_session)
    await db.commit()
    await db.refresh(duplicate_session)

    return {
        "sessionId": duplicate_session.id,
        "message": "Session duplicated successfully",
    }


# Update the existing start endpoint to accept an existing session_id
@router.post("/sessions/{session_id}/start", status_code=201)
async def start_existing_course_generation(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Start generation for an existing session."""
    result = await db.execute(
        select(CourseGenerationSession).where(
            and_(
                CourseGenerationSession.id == session_id,
                CourseGenerationSession.user_id == current_user.id,
            )
        )
    )
    session: CourseGenerationSession = result.scalars().first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status not in ["created", "error"]:
        raise HTTPException(
            status_code=400, detail="Session already started or completed"
        )

    # Reset session for generation
    session.status = "brainstorming"
    session.progress = 0
    session.error_message = None
    await db.commit()

    # Prepare request data from session
    request_data = {
        "subject_area": session.subject,
        "education_level": session.education_level,
        "course_duration": session.duration,
        "difficulty_level": session.difficulty,
        "key_topics": session.preferences.get("key_topics"),
        "include_assessments": session.preferences.get("include_assessments", True),
        "include_project_ideas": session.preferences.get("include_project_ideas", True),
        "teaching_materials": session.preferences.get("teaching_materials", True),
        "additional_context": session.preferences.get("additional_context"),
    }

    # Start generation in background
    background_tasks.add_task(
        CourseGenerator.generate_course,
        session_id,
        str(current_user.id),
        request_data,
        db,
    )

    return {
        "session_id": session_id,
        "status": "initiated",
        "message": "Course generation has been started in the background.",
    }


@router.post("/sessions/{session_id}/export-to-course", status_code=201)
async def export_to_course(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Export a generated course to the courses CRUD system."""
    # Get the session
    result = await db.execute(
        select(CourseGenerationSession).where(
            and_(
                CourseGenerationSession.id == session_id,
                CourseGenerationSession.user_id == current_user.id,
            )
        )
    )
    session: CourseGenerationSession = result.scalars().first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "complete" or not session.course_data:
        raise HTTPException(
            status_code=400, detail="Session not completed or no course data available"
        )

    # Check if course already exported
    result = await db.execute(
        select(SchoolCourse).where(SchoolCourse.generation_session_id == session_id)
    )
    existing_course = result.scalars().first()

    if existing_course:
        raise HTTPException(status_code=400, detail="Course already exported")

    # Get user's school staff record
    result = await db.execute(
        select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
    )
    school_staff = result.scalars().first()

    if not school_staff:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with any school. Please contact your administrator.",
        )

    # Get default department or create one if needed
    result = await db.execute(
        select(Department)
        .where(Department.school_id == school_staff.school_id)
        .limit(1)
    )
    department = result.scalars().first()

    course_data = session.course_data

    # Create the course in SchoolCourse table
    new_course = SchoolCourse(
        school_id=school_staff.school_id,
        department_id=department.id if department else None,
        teacher_id=school_staff.id,
        generation_session_id=session_id,  # Link to the generation session
        # Basic course info
        title=course_data.get("title", f"{session.subject} Course"),
        code=course_data.get("code", f"{session.subject.upper()[:3]}101"),
        description=course_data.get("description", ""),
        # Academic info
        academic_year=str(datetime.utcnow().year),
        education_level=session.education_level,
        academic_track=session.preferences.get("academic_track"),
        credits=course_data.get("credits"),
        # Course structure
        syllabus={
            "weeks": [
                {
                    "week": week.get("week", idx + 1),
                    "title": week.get("title", f"Week {idx + 1}"),
                    "topics": week.get("topics", []),
                    "description": week.get("description", ""),
                    "activities": week.get("activities", []),
                }
                for idx, week in enumerate(course_data.get("syllabus", []))
            ],
            "total_weeks": len(course_data.get("syllabus", [])),
            "generated_from": "ai_generator",
        },
        # Learning objectives
        learning_objectives=course_data.get("learningObjectives", []),
        prerequisites=course_data.get("prerequisites", []),
        # AI configuration
        ai_tutoring_enabled=True,
        suggested_topics=course_data.get("topics", []),
        # Assessment configuration
        assessment_types=[
            assessment["type"] for assessment in course_data.get("assessments", [])
        ],
        grading_schema={
            "assessments": [
                {
                    "title": assessment.get("title", ""),
                    "type": assessment.get("type", "exam"),
                    "description": assessment.get("description", ""),
                    "weight": assessment.get("weight", 0),
                }
                for assessment in course_data.get("assessments", [])
            ],
            "total_weight": sum(
                assessment.get("weight", 0)
                for assessment in course_data.get("assessments", [])
            ),
        },
        # Materials
        required_materials={
            "textbooks": [
                material
                for material in course_data.get("recommendedMaterials", [])
                if "textbook" in material.lower()
            ],
            "online_resources": [
                material
                for material in course_data.get("recommendedMaterials", [])
                if "online" in material.lower() or "website" in material.lower()
            ],
            "other": [
                material
                for material in course_data.get("recommendedMaterials", [])
                if "textbook" not in material.lower()
                and "online" not in material.lower()
                and "website" not in material.lower()
            ],
        },
        # Status
        status="draft",  # Start as draft so professor can review
        # Timestamps
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)

    # Create initial assignments from the course data if any
    if course_data.get("assessments"):
        for assessment in course_data.get("assessments", []):
            if assessment.get("type") in ["assignment", "project"]:
                assignment = Assignment(
                    course_id=new_course.id,
                    professor_id=school_staff.id,
                    title=assessment.get("title", ""),
                    description=assessment.get("description", ""),
                    assignment_type=assessment.get("type", "assignment"),
                    due_date=datetime.utcnow()
                    + timedelta(days=14),  # Default 2 weeks from now
                    points_possible=100,  # Default points
                    is_published=False,  # Keep unpublished initially
                    created_at=datetime.utcnow(),
                )
                db.add(assignment)

    # Update the session to mark it as exported
    session.status = "exported"
    session.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "course_id": new_course.id,
        "title": new_course.title,
        "code": new_course.code,
        "message": "Course exported successfully to your courses dashboard",
        "course_url": f"/dashboard/professor/courses/{new_course.id}",
        "status": "draft",
    }


# Also add this endpoint to get the export status
@router.get("/sessions/{session_id}/export-status", status_code=200)
async def get_export_status(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Check if a session has been exported to a course."""
    # Check if course exists
    result = await db.execute(
        select(SchoolCourse).where(SchoolCourse.generation_session_id == session_id)
    )
    course = result.scalars().first()

    if not course:
        return {"exported": False, "course_id": None, "course_url": None}

    # Verify user owns this session
    result = await db.execute(
        select(CourseGenerationSession).where(
            and_(
                CourseGenerationSession.id == session_id,
                CourseGenerationSession.user_id == current_user.id,
            )
        )
    )
    session = result.scalars().first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "exported": True,
        "course_id": course.id,
        "course_url": f"/dashboard/professor/courses/{course.id}",
        "exported_at": course.created_at.isoformat(),
        "course_title": course.title,
        "course_code": course.code,
        "course_status": course.status,
    }
