import base64
import asyncio
import tempfile
import os
import time
from typing import Dict, Any

from src.core.llm import LLM, LLMConfig, Message


class WhiteboardAIService:
    """Service to process whiteboard screenshots and extract mathematical content using AI vision."""

    def __init__(self, provider: str = "openai", model: str = "gpt-4-vision-preview"):
        self.llm = LLM(provider=provider)
        self.model = model

    async def process_screenshot(self, image_data: str) -> Dict[str, Any]:
        """
        Process a screenshot of a whiteboard to extract and analyze mathematical content.

        Args:
            image_data: Base64 encoded image data, usually in format "data:image/png;base64,..."

        Returns:
            Dict containing analysis results
        """
        try:
            start_time = time.time()

            # Extract the base64 data part
            if "," in image_data:
                image_data = image_data.split(",", 1)[1]

            # Decode base64 image
            image_bytes = base64.b64decode(image_data)

            # Use a vision model to analyze the image
            result = await self._analyze_with_vision_model(image_bytes)

            end_time = time.time()
            processing_time_ms = int((end_time - start_time) * 1000)

            # Add processing time to the result
            result["processing_time_ms"] = processing_time_ms

            return result
        except Exception as e:
            print(f"Error processing whiteboard screenshot: {str(e)}")
            raise

    async def _analyze_with_vision_model(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Use a vision model to analyze the image and extract mathematical content.

        Args:
            image_bytes: Raw image bytes

        Returns:
            Dict containing analysis results
        """
        # Save the image to a temporary file for processing
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        try:
            # Encode image to base64 for API request
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

            # Prepare messages for LLM with vision capability
            messages = [
                Message(
                    role="system",
                    content=(
                        "You are a mathematics expert assistant specialized in analyzing "
                        "mathematical content from whiteboard images. Extract and analyze "
                        "any mathematical expressions, equations, graphs, or diagrams. "
                        "Identify the concepts being worked on and provide helpful insights. "
                        "Your response should be structured with these sections: "
                        "1. identified_math (the exact mathematical expression/equation you see) "
                        "2. explanation (a brief explanation of what the mathematics represents) "
                        "3. suggestions (2-3 helpful next steps or insights for the student) "
                        "Be precise about the mathematical notation. Use LaTeX format for formulas."
                    ),
                ),
                Message(
                    role="user",
                    content=[
                        {
                            "type": "text",
                            "text": "Analyze this mathematical content from my whiteboard:",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            },
                        },
                    ],
                ),
            ]

            # Configure LLM
            config = LLMConfig(model=self.model, temperature=0.2, max_tokens=800)

            # Get response from LLM
            response_text = await self.llm.generate(messages, config)

            # Parse the response for structured data
            result = self._parse_vision_response(response_text)

            return result

        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def _parse_vision_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the structured response from the vision model.

        Args:
            response_text: Raw text response from the vision model

        Returns:
            Structured response as a dictionary
        """
        # Initialize default structure
        result = {"identified_math": "", "explanation": "", "suggestions": []}

        # Try to extract structured data based on keywords/sections
        lines = response_text.split("\n")
        current_section = None

        for line in lines:
            line = line.strip()

            # Check for section headers
            if (
                "identified math" in line.lower()
                or "identified mathematical expression" in line.lower()
            ):
                current_section = "identified_math"
                continue
            elif "explanation" in line.lower():
                current_section = "explanation"
                continue
            elif (
                "suggestion" in line.lower() or "recommended next steps" in line.lower()
            ):
                current_section = "suggestions"
                continue

            # Skip empty lines
            if not line:
                continue

            # Process content based on current section
            if current_section == "identified_math":
                # Skip any markdown formatting like ```
                if "```" in line:
                    continue
                # Clean up any LaTeX markers
                line = line.replace("$", "").replace("\\(", "").replace("\\)", "")
                result["identified_math"] += line + " "
            elif current_section == "explanation":
                result["explanation"] += line + " "
            elif current_section == "suggestions":
                # Check if this is a list item
                if (
                    line.startswith("-")
                    or line.startswith("*")
                    or (line[0].isdigit() and line[1] in [".", ")"])
                ):
                    # Remove list marker
                    suggestion = line.split(" ", 1)[1].strip()
                    result["suggestions"].append(suggestion)
                else:
                    # If not a list item but we're in suggestions section, add to last suggestion or create new one
                    if result["suggestions"]:
                        result["suggestions"][-1] += " " + line
                    else:
                        result["suggestions"].append(line)

        # Clean up results
        result["identified_math"] = result["identified_math"].strip()
        result["explanation"] = result["explanation"].strip()

        # If parsing failed, use a simpler approach
        if (
            not result["identified_math"]
            and not result["explanation"]
            and not result["suggestions"]
        ):
            # Fallback to simpler parsing
            return self._simple_parse_response(response_text)

        return result

    def _simple_parse_response(self, response_text: str) -> Dict[str, Any]:
        """
        Simpler parsing for unstructured responses.

        Args:
            response_text: Raw text response

        Returns:
            Best-effort structured response
        """
        # Initialize with the full text as explanation
        result = {
            "identified_math": "",
            "explanation": response_text.strip(),
            "suggestions": [],
        }

        # Try to find mathematical expressions (common patterns)
        import re

        # Look for math expressions like y = ..., f(x) = ..., etc.
        math_patterns = [
            r"[y|f\(x\)] ?= ?[^,\.\n]+",  # y = ... or f(x) = ...
            r"\\\(.*?\\\)",  # LaTeX inline: \(...\)
            r"\$.*?\$",  # LaTeX inline: $...$
            r"\\begin\{equation\}.*?\\end\{equation\}",  # LaTeX equation environment
        ]

        for pattern in math_patterns:
            matches = re.findall(pattern, response_text)
            if matches:
                result["identified_math"] = (
                    matches[0].replace("$", "").replace("\\(", "").replace("\\)", "")
                )
                break

        # Extract potential suggestions (look for sentences that sound like suggestions)
        suggestion_starters = [
            "try",
            "consider",
            "you could",
            "it would be helpful",
            "next step",
            "you might want",
            "you should",
            "recommend",
        ]

        sentences = re.split(r"[.!?]", response_text)
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and any(
                starter in sentence.lower() for starter in suggestion_starters
            ):
                result["suggestions"].append(sentence)

        # Limit to 3 suggestions
        result["suggestions"] = result["suggestions"][:3]

        return result


# Example usage
async def test_service():
    """Test function for the WhiteboardAIService."""
    # This would be a base64 encoded image in a real application
    test_image_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

    service = WhiteboardAIService()
    result = await service.process_screenshot(test_image_data)

    print("Analysis result:")
    print(f"Identified math: {result['identified_math']}")
    print(f"Explanation: {result['explanation']}")
    print("Suggestions:")
    for suggestion in result["suggestions"]:
        print(f" - {suggestion}")
    print(f"Processing time: {result['processing_time_ms']} ms")


if __name__ == "__main__":
    # Run the test function
    asyncio.run(test_service())
