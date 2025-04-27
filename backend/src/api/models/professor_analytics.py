from pydantic import BaseModel, RootModel
from typing import List, Optional

# Response models for analytics endpoints


class CoursePerformance(BaseModel):
    id: int
    title: str
    totalStudents: int
    averageGrade: float
    completionRate: int
    engagementScore: int
    difficultyRating: int
    aiGeneratedImprovement: str


class CoursePerformanceResponse(RootModel):
    root: List[CoursePerformance]


class TopicPerformance(BaseModel):
    topic: str
    score: float
    difficulty: float
    engagementLevel: float
    timeSpent: int
    improvementSuggestion: Optional[str] = None


class TopicPerformanceResponse(RootModel):
    root: List[TopicPerformance]


class StudentActivity(BaseModel):
    date: str
    activeStudents: int
    submissions: int
    tutoringSessions: int


class StudentActivityResponse(RootModel):
    root: List[StudentActivity]


class ProblemArea(BaseModel):
    id: int
    title: str
    category: str
    affectedStudents: int
    severity: str  # 'low', 'medium', 'high'
    suggestedAction: str


class ProblemAreasResponse(RootModel):
    root: List[ProblemArea]


class LearningOutcome(BaseModel):
    id: str
    name: str
    achievementRate: float
    targetRate: float


class LearningOutcomesResponse(RootModel):
    root: List[LearningOutcome]


class StrengthWeakness(BaseModel):
    strength: bool
    topic: str
    details: str
    students: int
    impact: int


class StrengthsWeaknessesResponse(RootModel):
    root: List[StrengthWeakness]


# Request models for analytics endpoints


class AIInsightsRequest(BaseModel):
    courseId: int
    includeProblems: Optional[bool] = True
    includeTopics: Optional[bool] = True
    includeEngagement: Optional[bool] = True
    includeOutcomes: Optional[bool] = True


class TopicSuggestion(BaseModel):
    topic: str
    improvement: str


class AIInsightsResponse(BaseModel):
    problemAreas: Optional[List[ProblemArea]] = None
    topicSuggestions: Optional[List[TopicSuggestion]] = None
    engagementRecommendations: Optional[List[str]] = None
    outcomeImprovements: Optional[List[str]] = None


class AnalyticsExportResponse(BaseModel):
    downloadUrl: str
    format: str
    generatedAt: str
