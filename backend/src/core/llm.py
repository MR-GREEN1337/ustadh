# src/core/llm.py
from enum import Enum
from typing import List, Optional, AsyncGenerator, Union
from pydantic import BaseModel

# Import specific provider libraries
from openai import AsyncOpenAI
from groq import AsyncGroq

from src.core.settings import settings


class LLMProvider(str, Enum):
    """Supported LLM providers"""

    OPENAI = "openai"
    GROQ = "groq"


class Message(BaseModel):
    """Message format for LLM APIs"""

    role: str
    content: str


class LLMConfig(BaseModel):
    """Configuration for LLM requests"""

    model: str
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0


class LLM:
    """
    LLM integration class that provides a unified interface for different LLM providers
    with support for both streaming and non-streaming requests.
    """

    def __init__(self, provider: Union[LLMProvider, str] = LLMProvider.OPENAI):
        """Initialize the LLM class with a specific provider"""
        # Convert string to enum if needed
        if isinstance(provider, str):
            provider = LLMProvider(provider.lower())

        self.provider = provider
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the appropriate client based on the selected provider"""
        if self.provider == LLMProvider.OPENAI:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        elif self.provider == LLMProvider.GROQ:
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    async def generate(self, messages: List[Message], config: LLMConfig) -> str:
        """
        Generate a response from the LLM (non-streaming)

        Args:
            messages: List of message objects with role and content
            config: LLM configuration settings

        Returns:
            Complete response text from the LLM
        """
        if self.provider == LLMProvider.OPENAI:
            return await self._generate_openai(messages, config)
        elif self.provider == LLMProvider.GROQ:
            return await self._generate_groq(messages, config)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    async def generate_stream(
        self, messages: List[Message], config: LLMConfig
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response from the LLM

        Args:
            messages: List of message objects with role and content
            config: LLM configuration settings

        Yields:
            Chunks of the response as they become available
        """
        if self.provider == LLMProvider.OPENAI:
            async for chunk in self._generate_stream_openai(messages, config):
                yield chunk
        elif self.provider == LLMProvider.GROQ:
            async for chunk in self._generate_stream_groq(messages, config):
                yield chunk
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    async def _generate_openai(self, messages: List[Message], config: LLMConfig) -> str:
        """Generate a response using OpenAI's API (non-streaming)"""
        try:
            response = await self.client.chat.completions.create(
                model=config.model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty,
                stream=False,
            )
            return response.choices[0].message.content
        except Exception as e:
            # Log and re-raise with more context
            print(f"OpenAI API error: {str(e)}")
            raise Exception(f"Failed to generate response from OpenAI: {str(e)}")

    async def _generate_stream_openai(
        self, messages: List[Message], config: LLMConfig
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response using OpenAI's API"""
        try:
            response = await self.client.chat.completions.create(
                model=config.model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty,
                stream=True,
            )

            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            # Log and re-raise with more context
            print(f"OpenAI streaming API error: {str(e)}")
            raise Exception(f"Failed to stream response from OpenAI: {str(e)}")

    async def _generate_groq(self, messages: List[Message], config: LLMConfig) -> str:
        """Generate a response using Groq's API (non-streaming)"""
        try:
            response = await self.client.chat.completions.create(
                model=config.model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                temperature=config.temperature,
                max_completion_tokens=config.max_tokens if config.max_tokens else 1024,
                top_p=config.top_p,
                stream=False,
            )

            return response.choices[0].message.content
        except Exception as e:
            # Log and re-raise with more context
            print(f"Groq API error: {str(e)}")
            raise Exception(f"Failed to generate response from Groq: {str(e)}")

    async def _generate_stream_groq(
        self, messages: List[Message], config: LLMConfig
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response using Groq's API"""
        try:
            response = await self.client.chat.completions.create(
                model=config.model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                temperature=config.temperature,
                max_completion_tokens=config.max_tokens if config.max_tokens else 1024,
                top_p=config.top_p,
                stream=True,
            )

            async for chunk in response:
                if (
                    chunk.choices
                    and hasattr(chunk.choices[0], "delta")
                    and chunk.choices[0].delta.content
                ):
                    yield chunk.choices[0].delta.content
        except Exception as e:
            # Log and re-raise with more context
            print(f"Groq streaming API error: {str(e)}")
            raise Exception(f"Failed to stream response from Groq: {str(e)}")

    async def close(self):
        """Close any open connections and resources"""
        # The default clients usually handle their own cleanup
        pass
