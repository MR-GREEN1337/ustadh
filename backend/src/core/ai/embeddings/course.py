"""
Course Embeddings Service

This module handles the management of course embeddings, including:
1. Creating embeddings for course content.
2. Upserting embeddings into the Qdrant database.
3. Searching for similar courses based on embeddings.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.qdrant import QdrantClientWrapper
from src.core.ai.embeddings import EmbeddingModel


class CourseEmbeddingsService:
    """Service for managing course embeddings"""

    def __init__(
        self,
        session: AsyncSession,
        qdrant_client: QdrantClientWrapper,
        embeddings_service: EmbeddingModel,
    ):
        self.session = session
        self.qdrant_client = qdrant_client
        self.embeddings_service = embeddings_service

    async def create_course_embedding(self, course_id: int, content: str) -> np.ndarray:
        """
        Create an embedding for a course based on its content.

        Args:
            course_id: The ID of the course.
            content: The content to generate an embedding for.

        Returns:
            np.ndarray: The generated embedding.
        """
        # Generate the embedding using the embedding model
        embedding = await self.embeddings_service.generate_embedding(content)

        # Upsert the embedding into Qdrant
        await self.qdrant_client.upsert_vectors(
            collection_name="course_content",
            vectors=[embedding],
            ids=[str(course_id)],
            payloads=[{"course_id": course_id}],
        )

        return embedding

    async def get_course_embedding(self, course_id: int) -> Optional[np.ndarray]:
        """
        Retrieve the embedding for a specific course.

        Args:
            course_id: The ID of the course.

        Returns:
            np.ndarray: The course embedding, or None if not found.
        """
        # Search for the course embedding in Qdrant
        results = await self.qdrant_client.search_similar_courses(
            query_vector=[course_id],  # This should be the actual embedding vector
            limit=1,
        )

        if results:
            return results[0][
                "embedding"
            ]  # Assuming the embedding is returned in the results

        return None

    async def search_similar_courses(
        self, course_id: int, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for courses similar to the given course based on embeddings.

        Args:
            course_id: The ID of the course to find similar courses for.
            limit: The maximum number of similar courses to return.

        Returns:
            List[Dict[str, Any]]: A list of similar courses with their similarity scores.
        """
        # Get the embedding for the course
        course_embedding = await self.get_course_embedding(course_id)

        if course_embedding is None:
            return []  # No embedding found for the course

        # Search for similar courses
        similar_courses = await self.qdrant_client.search_similar_courses(
            query_vector=course_embedding, limit=limit
        )

        return similar_courses

    async def update_course_embedding(
        self, course_id: int, new_content: str
    ) -> np.ndarray:
        """
        Update the embedding for a course with new content.

        Args:
            course_id: The ID of the course.
            new_content: The new content to generate an updated embedding for.

        Returns:
            np.ndarray: The updated embedding.
        """
        # Create a new embedding for the updated content
        updated_embedding = await self.create_course_embedding(course_id, new_content)

        return updated_embedding
