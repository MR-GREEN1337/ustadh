"""
Qdrant Vector Database Client Wrapper

This module provides a wrapper around the Qdrant client for vector similarity search.
It handles connection, collection management, and search operations.
"""

import os
from typing import List, Dict, Any, Optional, Union
import numpy as np
import logging
from qdrant_client import models
from qdrant_client.async_qdrant_client import AsyncQdrantClient

logger = logging.getLogger(__name__)


class QdrantClientWrapper:
    """Wrapper for Qdrant client with async operations"""

    def __init__(
        self,
        url: Optional[str] = None,
        api_key: Optional[str] = None,
        prefer_grpc: bool = False,
        timeout: float = 10.0,
    ):
        """Initialize Qdrant client connection parameters"""
        self.url = url or os.getenv("QDRANT_HOST", "localhost")
        self.api_key = api_key or os.getenv("QDRANT_API_KEY")
        self.prefer_grpc = prefer_grpc or os.getenv(
            "QDRANT_PREFER_GRPC", ""
        ).lower() in ("true", "1", "yes")
        self.timeout = timeout
        self.client = None

        # Client will be initialized at application startup

    async def init_client(self):
        """Initialize the async Qdrant client"""
        logger.info(f"Initializing Qdrant client connection to {self.url}")

        try:
            # Create the async client
            self.client = AsyncQdrantClient(
                url=self.url,
                api_key=self.api_key,
                timeout=self.timeout,
                prefer_grpc=self.prefer_grpc,
            )

            # Test the connection
            collections = await self.client.get_collections()
            logger.info(
                f"Qdrant connection established successfully. Found {len(collections.collections)} collections"
            )

            # Initialize required collections
            await self.init_collections()

            return True

        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            raise

    async def close(self):
        """Close the Qdrant client connection"""
        if self.client:
            await self.client.close()
            logger.info("Qdrant client connection closed")

    async def init_collections(self):
        """Initialize required collections if they don't exist"""
        # Define collections to be created
        collections_config = {
            "course_content": {
                "vector_size": 1536,  # OpenAI embeddings dimension
                "distance": models.Distance.COSINE,
            },
            "student_profiles": {
                "vector_size": 1536,
                "distance": models.Distance.COSINE,
            },
            "assessment_items": {
                "vector_size": 1536,
                "distance": models.Distance.COSINE,
            },
        }

        # Get existing collections
        collections_response = await self.client.get_collections()
        existing_collections = [c.name for c in collections_response.collections]

        # Create missing collections
        for collection_name, config in collections_config.items():
            if collection_name not in existing_collections:
                logger.info(f"Creating collection '{collection_name}'")

                # Define vector params
                vector_params = models.VectorParams(
                    size=config["vector_size"], distance=config["distance"]
                )

                # Create collection
                await self.client.create_collection(
                    collection_name=collection_name, vectors_config=vector_params
                )

                # Define schema for collection
                if collection_name == "course_content":
                    await self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name="course_id",
                        field_schema=models.PayloadSchemaType.INTEGER,
                    )
                    await self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name="content_type",
                        field_schema=models.PayloadSchemaType.KEYWORD,
                    )

                elif collection_name == "student_profiles":
                    await self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name="student_id",
                        field_schema=models.PayloadSchemaType.INTEGER,
                    )
                    await self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name="education_level",
                        field_schema=models.PayloadSchemaType.KEYWORD,
                    )

                elif collection_name == "assessment_items":
                    await self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name="course_id",
                        field_schema=models.PayloadSchemaType.INTEGER,
                    )
                    await self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name="difficulty",
                        field_schema=models.PayloadSchemaType.FLOAT,
                    )

                logger.info(f"Collection '{collection_name}' created successfully")
            else:
                logger.info(f"Collection '{collection_name}' already exists")

    async def upsert_vectors(
        self,
        collection_name: str,
        vectors: List[np.ndarray],
        ids: List[str],
        payloads: List[Dict[str, Any]],
    ) -> bool:
        """
        Insert or update vectors in the collection

        Args:
            collection_name: Name of the collection
            vectors: List of vector embeddings
            ids: List of unique IDs for the vectors
            payloads: List of metadata payloads

        Returns:
            bool: Success status
        """
        if not self.client:
            raise ValueError("Qdrant client not initialized")

        try:
            # Convert numpy arrays to lists if needed
            vector_data = []
            for i, vec in enumerate(vectors):
                # Convert numpy arrays to Python lists
                if isinstance(vec, np.ndarray):
                    vec = vec.tolist()

                vector_data.append(
                    models.PointStruct(id=ids[i], vector=vec, payload=payloads[i])
                )

            # Upsert vectors
            await self.client.upsert(
                collection_name=collection_name, points=vector_data
            )

            return True

        except Exception as e:
            logger.error(f"Failed to upsert vectors: {str(e)}")
            return False

    async def search_similar(
        self,
        collection_name: str,
        query_vector: Union[List[float], np.ndarray],
        limit: int = 10,
        filter_condition: Optional[models.Filter] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors in the collection

        Args:
            collection_name: Name of the collection
            query_vector: Query embedding vector
            limit: Maximum number of results
            filter_condition: Optional filter condition

        Returns:
            List of search results with scores and payloads
        """
        if not self.client:
            raise ValueError("Qdrant client not initialized")

        try:
            # Convert numpy array to list if needed
            if isinstance(query_vector, np.ndarray):
                query_vector = query_vector.tolist()

            # Execute search
            search_results = await self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                query_filter=filter_condition,
                with_payload=True,
            )

            # Format results
            results = []
            for result in search_results:
                results.append(
                    {"id": result.id, "score": result.score, **result.payload}
                )

            return results

        except Exception as e:
            logger.error(f"Failed to search similar vectors: {str(e)}")
            return []

    async def search_similar_courses(
        self,
        query_vector: Union[List[float], np.ndarray],
        limit: int = 10,
        exclude_ids: Optional[List[int]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar courses based on content embeddings

        Args:
            query_vector: Query embedding vector
            limit: Maximum number of results
            exclude_ids: Optional list of course IDs to exclude

        Returns:
            List of similar courses with similarity scores
        """
        # Build filter condition to exclude specific course IDs
        filter_condition = None
        if exclude_ids and len(exclude_ids) > 0:
            filter_condition = models.Filter(
                must_not=[
                    models.FieldCondition(
                        key="course_id", match=models.MatchAny(any=exclude_ids)
                    )
                ]
            )

        # Search for similar vectors
        return await self.search_similar(
            collection_name="course_content",
            query_vector=query_vector,
            limit=limit,
            filter_condition=filter_condition,
        )

    async def delete_by_course_id(self, collection_name: str, course_id: int) -> bool:
        """
        Delete all vectors for a specific course

        Args:
            collection_name: Name of the collection
            course_id: Course ID to delete

        Returns:
            bool: Success status
        """
        if not self.client:
            raise ValueError("Qdrant client not initialized")

        try:
            # Build filter condition for course ID
            filter_condition = models.Filter(
                must=[
                    models.FieldCondition(
                        key="course_id", match=models.MatchValue(value=course_id)
                    )
                ]
            )

            # Delete points
            await self.client.delete(
                collection_name=collection_name,
                points_selector=models.FilterSelector(filter=filter_condition),
            )

            return True

        except Exception as e:
            logger.error(f"Failed to delete vectors for course {course_id}: {str(e)}")
            return False
