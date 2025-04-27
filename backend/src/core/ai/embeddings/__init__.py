"""
Embedding Model Service

This module handles the embedding generation using OpenAI's embedding models.
It provides a consistent interface for generating embeddings for text.
"""

import numpy as np
from typing import List, Dict, Any, Optional
import logging
import httpx
import tenacity
from openai import AsyncOpenAI
from src.core.settings import settings

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """Service for generating text embeddings"""

    def __init__(
        self,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        embedding_dimension: Optional[int] = None,
        max_retries: int = 3,
        timeout: float = 30.0,
    ):
        """Initialize the embedding model"""
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.embedding_dimension = embedding_dimension or int(
            settings.EMBEDDING_DIMENSION
        )
        self.max_retries = max_retries
        self.timeout = timeout
        self.client = None

        # Client will be initialized at application startup

    async def init_client(self):
        """Initialize the OpenAI client"""
        logger.info(f"Initializing embedding model: {self.model_name}")

        try:
            # Validate API key
            if not self.api_key:
                raise ValueError("OpenAI API key is not set")

            # Create OpenAI client
            self.client = AsyncOpenAI(
                api_key=self.api_key, timeout=httpx.Timeout(self.timeout)
            )

            # Test the client with a simple embedding request
            test_result = await self.generate_embedding("Test embedding")
            if len(test_result) != self.embedding_dimension:
                logger.warning(
                    f"Embedding dimension mismatch: expected {self.embedding_dimension}, got {len(test_result)}"
                )
                self.embedding_dimension = len(test_result)

            logger.info(
                f"Embedding model initialized successfully. Dimension: {self.embedding_dimension}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {str(e)}")
            raise

    @tenacity.retry(
        retry=tenacity.retry_if_exception_type(Exception),
        wait=tenacity.wait_exponential(multiplier=1, min=2, max=10),
        stop=tenacity.stop_after_attempt(3),
        reraise=True,
    )
    async def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text

        Args:
            text: Input text

        Returns:
            numpy.ndarray: Embedding vector
        """
        if not self.client:
            raise ValueError("Embedding model client not initialized")

        try:
            # Call the OpenAI API
            response = await self.client.embeddings.create(
                model=self.model_name, input=text, encoding_format="float"
            )

            # Extract the embedding
            embedding = response.data[0].embedding

            # Convert to numpy array
            return np.array(embedding, dtype=np.float32)

        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise

    @tenacity.retry(
        retry=tenacity.retry_if_exception_type(Exception),
        wait=tenacity.wait_exponential(multiplier=1, min=2, max=10),
        stop=tenacity.stop_after_attempt(3),
        reraise=True,
    )
    async def generate_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts

        Args:
            texts: List of input texts

        Returns:
            List[numpy.ndarray]: List of embedding vectors
        """
        if not self.client:
            raise ValueError("Embedding model client not initialized")

        if not texts:
            return []

        try:
            # Call the OpenAI API
            response = await self.client.embeddings.create(
                model=self.model_name, input=texts, encoding_format="float"
            )

            # Extract embeddings and sort them by index to preserve original order
            embeddings_dict = {item.index: item.embedding for item in response.data}
            embeddings = [embeddings_dict[i] for i in range(len(texts))]

            # Convert to numpy arrays
            return [np.array(emb, dtype=np.float32) for emb in embeddings]

        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            raise

    async def cosine_similarity(
        self, embedding1: np.ndarray, embedding2: np.ndarray
    ) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            float: Cosine similarity score (0-1)
        """
        # Calculate dot product
        dot_product = np.dot(embedding1, embedding2)

        # Calculate magnitudes
        magnitude1 = np.linalg.norm(embedding1)
        magnitude2 = np.linalg.norm(embedding2)

        # Calculate cosine similarity
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)

    async def find_most_similar(
        self, query_embedding: np.ndarray, candidate_embeddings: List[np.ndarray]
    ) -> List[Dict[str, Any]]:
        """
        Find most similar embeddings from a list of candidates

        Args:
            query_embedding: Query embedding vector
            candidate_embeddings: List of candidate embedding vectors

        Returns:
            List of similarity scores with indices, sorted by similarity
        """
        results = []

        # Calculate similarity for each candidate
        for i, candidate in enumerate(candidate_embeddings):
            similarity = await self.cosine_similarity(query_embedding, candidate)
            results.append({"index": i, "similarity": similarity})

        # Sort by similarity (descending)
        results.sort(key=lambda x: x["similarity"], reverse=True)

        return results
