from pydantic import BaseModel
from typing import List, Optional


class ClassStudentResponse(BaseModel):
    id: int
    name: str
    education_level: str
    academic_track: str
    activity_score: int
    last_active: Optional[str]  # ISO format date string


class ActivityDataResponse(BaseModel):
    date: str  # Format: YYYY-MM-DD
    total: int
    questions: int
    practice: int


class SubjectActivityResponse(BaseModel):
    subject: str
    activity: int
    strength: float
    improvement: float


class AIInsightResponse(BaseModel):
    id: str
    title: str
    description: str
    recommendationType: str  # e.g., "classroom", "individual"
    subjects: List[str]  # List of subject names
    relevance: float


class TopicClusterResponse(BaseModel):
    id: str
    name: str
    count: int
    difficulty: float
    color: str  # Hex color code


class VisualizationDataResponse(BaseModel):
    points: List[dict]  # List of points for visualization
    centers: List[dict]  # List of centers for clusters
    clusters: List[dict]  # List of clusters
