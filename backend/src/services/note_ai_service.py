# src/services/note_ai_service.py
from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
import uuid
import logging

from src.db.models.notes import Note, AISuggestion
from src.core.llm import LLM, Message, LLMConfig  # Import your LLM class
from src.core.settings import settings

# Configure logging
logger = logging.getLogger(__name__)


class NoteAIService:
    """Service for generating AI-powered suggestions for notes."""

    @staticmethod
    async def generate_suggestions(
        note_id: str, db: AsyncSession, background_tasks: BackgroundTasks
    ):
        """Queue suggestion generation in the background to avoid blocking API response."""
        background_tasks.add_task(NoteAIService._generate_suggestions_task, note_id, db)
        return {"message": "Suggestion generation queued successfully"}

    @staticmethod
    async def _generate_suggestions_task(note_id: str, db: AsyncSession):
        """Background task to generate AI suggestions for a note."""
        # Get the note
        result = await db.execute(select(Note).where(Note.id == note_id))
        note = result.scalars().first()

        if not note:
            logger.error(f"Note {note_id} not found when generating suggestions")
            return

        # Enable the AI enhancement flag if not already set
        if not note.ai_enhanced:
            note.ai_enhanced = True
            db.add(note)
            await db.commit()

        # Initialize LLM client
        llm = LLM(provider=settings.DEFAULT_LLM_PROVIDER)

        # Generate suggestions using AI
        try:
            # Generate different types of suggestions
            completion = await NoteAIService._generate_completion(
                note.title, note.content, llm
            )
            clarification = await NoteAIService._generate_clarification(
                note.content, llm
            )
            connections = await NoteAIService._generate_connections(
                note.title, note.content, llm, note.tags
            )
            insights = await NoteAIService._generate_insights(note.content, llm)

            # Save the generated suggestions to the database
            suggestions = []

            if completion:
                suggestions.append(
                    AISuggestion(
                        id=str(uuid.uuid4()),
                        note_id=note_id,
                        content=completion,
                        type="completion",
                        created_at=datetime.utcnow(),
                        applied=False,
                    )
                )

            if clarification:
                suggestions.append(
                    AISuggestion(
                        id=str(uuid.uuid4()),
                        note_id=note_id,
                        content=clarification,
                        type="clarification",
                        created_at=datetime.utcnow(),
                        applied=False,
                    )
                )

            if connections:
                suggestions.append(
                    AISuggestion(
                        id=str(uuid.uuid4()),
                        note_id=note_id,
                        content=connections,
                        type="connection",
                        created_at=datetime.utcnow(),
                        applied=False,
                    )
                )

            if insights:
                suggestions.append(
                    AISuggestion(
                        id=str(uuid.uuid4()),
                        note_id=note_id,
                        content=insights,
                        type="insight",
                        created_at=datetime.utcnow(),
                        applied=False,
                    )
                )

            # Add all suggestions to the database
            for suggestion in suggestions:
                db.add(suggestion)

            await db.commit()
            logger.info(f"Generated {len(suggestions)} suggestions for note {note_id}")

        except Exception as e:
            logger.error(f"Error generating suggestions for note {note_id}: {str(e)}")
            # Ensure the transaction is rolled back in case of error
            await db.rollback()
        finally:
            # Close the LLM client
            await llm.close()

    @staticmethod
    async def _generate_completion(title: str, content: str, llm: LLM) -> str:
        """Generate a completion suggestion based on the note content."""
        try:
            # Create LLM configuration
            config = LLMConfig(
                model=settings.DEFAULT_LLM_MODEL, temperature=0.7, max_tokens=500
            )

            # Create messages
            messages = [
                Message(
                    role="system",
                    content="You are an intelligent assistant that helps complete academic notes with relevant, factual information. Your suggestions should be scholarly and maintain the style and tone of the original note.",
                ),
                Message(
                    role="user",
                    content=f"""
                    Title: {title}

                    Content:
                    {content}

                    Task: Complete this note with additional relevant information.
                    Consider what would naturally follow from the existing content.
                    Provide 2-3 paragraphs of additional information that would enrich this note.
                    """,
                ),
            ]

            # Generate completion
            response = await llm.generate(messages, config)
            return response.strip()
        except Exception as e:
            logger.error(f"Error generating completion: {str(e)}")
            return ""

    @staticmethod
    async def _generate_clarification(content: str, llm: LLM) -> str:
        """Generate a clarification for complex concepts in the note."""
        try:
            # Create LLM configuration
            config = LLMConfig(
                model=settings.DEFAULT_LLM_MODEL, temperature=0.7, max_tokens=400
            )

            # Create messages
            messages = [
                Message(
                    role="system",
                    content="You are an intelligent tutor that helps clarify complex academic concepts. Your explanations should be clear, precise, and educational.",
                ),
                Message(
                    role="user",
                    content=f"""
                    Content:
                    {content}

                    Task: Find a complex concept or term in this note that could benefit from additional explanation.
                    Identify the concept and provide a clear, accessible explanation that would help a student understand it better.
                    Structure your response to clearly identify what you're clarifying, then provide the explanation.
                    """,
                ),
            ]

            # Generate clarification
            response = await llm.generate(messages, config)
            return response.strip()
        except Exception as e:
            logger.error(f"Error generating clarification: {str(e)}")
            return ""

    @staticmethod
    async def _generate_connections(
        title: str, content: str, llm: LLM, tags: list = None
    ) -> str:
        """Generate connections to other topics and concepts."""
        try:
            tags_str = ", ".join(tags) if tags else "No tags provided"

            # Create LLM configuration
            config = LLMConfig(
                model=settings.DEFAULT_LLM_MODEL, temperature=0.7, max_tokens=500
            )

            # Create messages
            messages = [
                Message(
                    role="system",
                    content="You are an intelligent academic advisor that helps identify meaningful connections between topics and concepts. Your goal is to enhance interdisciplinary understanding and provide valuable context.",
                ),
                Message(
                    role="user",
                    content=f"""
                    Title: {title}

                    Content:
                    {content}

                    Tags: {tags_str}

                    Task: Identify 3-5 related topics or concepts that connect to this note.
                    For each connection, provide:
                    1. The name of the related topic/concept
                    2. A brief explanation of how it connects to the content of this note
                    3. Why understanding this connection would be valuable

                    Format your response as a list of connections, with each connection clearly separated.
                    """,
                ),
            ]

            # Generate connections
            response = await llm.generate(messages, config)
            return response.strip()
        except Exception as e:
            logger.error(f"Error generating connections: {str(e)}")
            return ""

    @staticmethod
    async def _generate_insights(content: str, llm: LLM) -> str:
        """Generate insights or key takeaways from the note content."""
        try:
            # Create LLM configuration
            config = LLMConfig(
                model=settings.DEFAULT_LLM_MODEL, temperature=0.7, max_tokens=400
            )

            # Create messages
            messages = [
                Message(
                    role="system",
                    content="You are an intelligent academic mentor that helps extract key insights and reflections from educational content. Your insights should be thoughtful, meaningful, and promote deeper understanding.",
                ),
                Message(
                    role="user",
                    content=f"""
                    Content:
                    {content}

                    Task: Analyze this note and provide 2-3 key insights or reflections that would help deepen understanding.
                    These insights should:
                    1. Go beyond summarizing the content
                    2. Offer a perspective or interpretation that might not be immediately obvious
                    3. Help connect the content to broader principles or applications

                    Format your response as clearly articulated insights.
                    """,
                ),
            ]

            # Generate insights
            response = await llm.generate(messages, config)
            return response.strip()
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return ""

    @staticmethod
    async def generate_live_suggestions(note_content: str, callback=None):
        """Generate real-time suggestions while the user is typing.

        This method can be used with WebSockets to provide live suggestions.

        Args:
            note_content: The current content of the note
            callback: Optional callback function to receive streaming content

        Returns:
            A suggestion string if callback is None, otherwise None
        """
        try:
            # Initialize LLM client
            llm = LLM(provider=settings.DEFAULT_LLM_PROVIDER)

            try:
                # Create LLM configuration
                config = LLMConfig(
                    model=settings.DEFAULT_LLM_MODEL, temperature=0.7, max_tokens=100
                )

                # Create messages
                messages = [
                    Message(
                        role="system",
                        content="You are an intelligent writing assistant that provides helpful suggestions as a user writes academic notes. Offer concise, helpful ideas that could enhance the note without being intrusive.",
                    ),
                    Message(
                        role="user",
                        content=f"""
                        The user is currently writing the following note:

                        {note_content}

                        Provide a brief, helpful suggestion that might:
                        - Complete their current thought
                        - Add a relevant detail or example
                        - Suggest a clarification or improvement

                        Keep your suggestion brief (1-2 sentences) and directly relevant to what they're currently writing.
                        """,
                    ),
                ]

                # If a callback is provided (for streaming), use it
                if callback:
                    accumulated_response = ""

                    async for chunk in llm.generate_stream(messages, config):
                        accumulated_response += chunk
                        await callback(chunk)

                    return None
                else:
                    # Otherwise, return the full response
                    response = await llm.generate(messages, config)
                    return response.strip()

            except Exception as e:
                logger.error(f"Error generating live suggestions: {str(e)}")
                return "" if callback is None else None

        finally:
            # Close the LLM client
            if "llm" in locals():
                await llm.close()
