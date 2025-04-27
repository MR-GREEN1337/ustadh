"""
Analytics Engine for Professor Dashboard

This module handles the complex analytics processing, including:
1. Data collection and preprocessing
2. Statistical analysis
3. AI insights generation
4. Embedding-based content analysis
"""

from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime
import json
import logging

from src.db.qdrant import QdrantClientWrapper
from src.core.ai.embeddings.course import CourseEmbeddingsService
from src.core.llm import LLM as LLMClient
from ...db.models.school import (
    SchoolCourse,
    Assignment,
    AssignmentSubmission,
    CourseEnrollment,
)
from ...db.models.tutoring import DetailedTutoringSession

logger = logging.getLogger(__name__)


class AnalyticsEngine:
    """Core engine for processing analytics data and generating insights"""

    def __init__(
        self,
        session: AsyncSession,
        embeddings_service: CourseEmbeddingsService,
        qdrant_client: QdrantClientWrapper,
        llm_client: LLMClient,
    ):
        self.session = session
        self.embeddings_service = embeddings_service
        self.qdrant_client = qdrant_client
        self.llm_client = llm_client

    async def gather_course_data(self, course_id: int) -> Dict[str, Any]:
        """Gather all relevant data for a course"""

        # Get course details
        course_query = select(SchoolCourse).where(SchoolCourse.id == course_id)
        course_result = await self.session.execute(course_query)
        course = course_result.scalar_one_or_none()

        if not course:
            raise ValueError(f"Course with ID {course_id} not found")

        # Get all enrollments
        enrollments_query = select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id
        )
        enrollments_result = await self.session.execute(enrollments_query)
        enrollments = enrollments_result.scalars().all()

        # Get all assignments
        assignments_query = select(Assignment).where(Assignment.course_id == course_id)
        assignments_result = await self.session.execute(assignments_query)
        assignments = assignments_result.scalars().all()

        # Get all submissions
        submissions_query = (
            select(AssignmentSubmission)
            .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id)
            .where(Assignment.course_id == course_id)
        )
        submissions_result = await self.session.execute(submissions_query)
        submissions = submissions_result.scalars().all()

        # Get all tutoring sessions
        tutoring_query = select(DetailedTutoringSession).where(
            DetailedTutoringSession.related_course_id == course_id
        )
        tutoring_result = await self.session.execute(tutoring_query)
        tutoring_sessions = tutoring_result.scalars().all()

        # Compile all data
        course_data = {
            "course": {
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "education_level": course.education_level,
                "academic_track": course.academic_track,
                "syllabus": course.syllabus,
                "learning_objectives": course.learning_objectives,
                "start_date": course.start_date.isoformat()
                if course.start_date
                else None,
                "end_date": course.end_date.isoformat() if course.end_date else None,
                "status": course.status,
            },
            "enrollments": [
                {
                    "id": enrollment.id,
                    "student_id": enrollment.student_id,
                    "enrollment_date": enrollment.enrollment_date.isoformat(),
                    "status": enrollment.status,
                    "grade": enrollment.grade,
                    "grade_letter": enrollment.grade_letter,
                    "attendance_percentage": enrollment.attendance_percentage,
                    "completion_date": enrollment.completion_date.isoformat()
                    if enrollment.completion_date
                    else None,
                }
                for enrollment in enrollments
            ],
            "assignments": [
                {
                    "id": assignment.id,
                    "title": assignment.title,
                    "description": assignment.description,
                    "assignment_type": assignment.assignment_type,
                    "assigned_date": assignment.assigned_date.isoformat(),
                    "due_date": assignment.due_date.isoformat(),
                    "points_possible": assignment.points_possible,
                    "grading_criteria": assignment.grading_criteria,
                    "is_published": assignment.is_published,
                }
                for assignment in assignments
            ],
            "submissions": [
                {
                    "id": submission.id,
                    "assignment_id": submission.assignment_id,
                    "student_id": submission.student_id,
                    "submission_date": submission.submission_date.isoformat(),
                    "status": submission.status,
                    "grade": submission.grade,
                    "feedback": submission.feedback,
                    "graded_at": submission.graded_at.isoformat()
                    if submission.graded_at
                    else None,
                }
                for submission in submissions
            ],
            "tutoring_sessions": [
                {
                    "id": session.id,
                    "student_id": session.user_id,
                    "session_type": session.session_type,
                    "interaction_mode": session.interaction_mode,
                    "start_time": session.start_time.isoformat(),
                    "end_time": session.end_time.isoformat()
                    if session.end_time
                    else None,
                    "duration_seconds": session.duration_seconds,
                    "initial_query": session.initial_query,
                    "status": session.status,
                    "concepts_learned": session.concepts_learned,
                }
                for session in tutoring_sessions
            ],
        }

        return course_data

    async def compute_performance_metrics(
        self, course_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compute performance metrics from course data"""

        # Calculate overall metrics
        total_students = len(set(e["student_id"] for e in course_data["enrollments"]))
        completed_students = len(
            [e for e in course_data["enrollments"] if e["status"] == "completed"]
        )
        completion_rate = (
            round((completed_students / total_students) * 100)
            if total_students > 0
            else 0
        )

        # Calculate grade statistics
        grades = [
            e["grade"] for e in course_data["enrollments"] if e["grade"] is not None
        ]
        avg_grade = sum(grades) / len(grades) if grades else 0

        # Calculate engagement metrics
        submissions_per_student = {}
        tutoring_per_student = {}

        for submission in course_data["submissions"]:
            student_id = submission["student_id"]
            submissions_per_student[student_id] = (
                submissions_per_student.get(student_id, 0) + 1
            )

        for session in course_data["tutoring_sessions"]:
            student_id = session["student_id"]
            tutoring_per_student[student_id] = (
                tutoring_per_student.get(student_id, 0) + 1
            )

        avg_submissions = (
            sum(submissions_per_student.values()) / total_students
            if total_students > 0
            else 0
        )
        avg_tutoring = (
            sum(tutoring_per_student.values()) / total_students
            if total_students > 0
            else 0
        )

        # Calculate an engagement score (0-10)
        engagement_score = min(10, round((avg_submissions * 2 + avg_tutoring * 3) / 2))

        # Calculate assignment completion rates
        assignment_completion = {}
        for assignment in course_data["assignments"]:
            assignment_id = assignment["id"]
            submissions = [
                s
                for s in course_data["submissions"]
                if s["assignment_id"] == assignment_id
            ]
            completion_rate = (
                len(submissions) / total_students if total_students > 0 else 0
            )
            assignment_completion[assignment_id] = {
                "title": assignment["title"],
                "completion_rate": completion_rate,
                "avg_grade": sum(
                    [s["grade"] for s in submissions if s["grade"] is not None]
                )
                / len(submissions)
                if submissions
                else 0,
            }

        metrics = {
            "overall": {
                "total_students": total_students,
                "completed_students": completed_students,
                "completion_rate": completion_rate,
                "avg_grade": avg_grade,
                "engagement_score": engagement_score,
            },
            "engagement": {
                "avg_submissions_per_student": avg_submissions,
                "avg_tutoring_sessions_per_student": avg_tutoring,
            },
            "assignments": assignment_completion,
        }

        return metrics

    async def identify_problems(
        self, course_id: int, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Identify problem areas in course content and student performance"""

        # In a real implementation, this would use the data to identify patterns
        # of low performance, engagement issues, content gaps, etc.

        # Gather the course data
        course_data = await self.gather_course_data(course_id)

        # Compute performance metrics
        metrics = await self.compute_performance_metrics(course_data)

        # Use LLM to analyze the data and identify problem areas
        llm_prompt = f"""
        I have a course with the following details:
        Title: {course_data['course']['title']}
        Description: {course_data['course']['description']}

        The performance metrics for this course are:
        Total students: {metrics['overall']['total_students']}
        Completion rate: {metrics['overall']['completion_rate']}%
        Average grade: {metrics['overall']['avg_grade']}
        Engagement score: {metrics['overall']['engagement_score']}

        Based on this data, identify 3-5 potential problem areas in the course.
        Each problem should include:
        - A descriptive title of the problem
        - A category (Content, Understanding, Engagement, Structure, etc.)
        - Estimated percentage of affected students
        - Severity (low, medium, high)
        - A suggested action to address the problem

        Format the response as JSON with the following structure:
        [
            {
                "title": "Problem title",
                "category": "Category",
                "affected_percentage": 42,
                "severity": "medium",
                "suggested_action": "Action to take"
            },
            ...
        ]
        """

        # Call the LLM to analyze the data
        llm_response = await self.llm_client.generate_text(llm_prompt)

        try:
            # Parse the JSON response
            problems_data = json.loads(llm_response)

            # Format the response
            problems = []
            for i, problem in enumerate(problems_data):
                affected_students = round(
                    problem["affected_percentage"]
                    * metrics["overall"]["total_students"]
                    / 100
                )
                problems.append(
                    {
                        "id": i + 1,
                        "title": problem["title"],
                        "category": problem["category"],
                        "affectedStudents": affected_students,
                        "severity": problem["severity"],
                        "suggestedAction": problem["suggested_action"],
                    }
                )

            return problems

        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM response as JSON: {llm_response}")
            # Return a fallback response
            return [
                {
                    "id": 1,
                    "title": "Error analyzing course data",
                    "category": "System",
                    "affectedStudents": 0,
                    "severity": "low",
                    "suggestedAction": "Please try again later or contact support if the issue persists.",
                }
            ]

    async def analyze_content_embeddings(self, course_id: int) -> Dict[str, Any]:
        """Analyze course content using embeddings"""

        # Get course embeddings from the embeddings service
        course_embeddings = await self.embeddings_service.get_course_embeddings(  # noqa: F841
            course_id
        )

        # Analyze content coherence
        # This would typically involve comparing embeddings between related content items
        # to ensure they form a coherent learning progression

        # Identify content gaps
        # This would involve looking for missing concepts or skills based on the
        # curriculum standards or learning objectives

        # Find content strengths
        # Identify areas where content is particularly well-structured or effective

        # In a real implementation, this would use more sophisticated analysis
        # For now, we'll return a simplified analysis

        return {
            "content_coherence": 0.75,  # 0-1 score
            "identified_gaps": [
                "Practical applications of theoretical concepts",
                "Bridging content between modules 3 and 4",
            ],
            "content_strengths": [
                "Clear explanations of fundamental concepts",
                "Well-structured progression in module 2",
            ],
            "improvement_suggestions": [
                "Add more practical examples in module 3",
                "Create a transitional lesson between modules 3 and 4",
            ],
        }

    async def compare_to_similar_courses(self, course_id: int) -> Dict[str, Any]:
        """Compare course performance to similar courses using embeddings"""

        # Get course embedding
        course_embedding = await self.embeddings_service.get_course_embedding(course_id)

        # Search for similar courses in Qdrant
        similar_courses = await self.qdrant_client.search_similar_courses(
            course_embedding, limit=5, exclude_ids=[course_id]
        )

        # Gather performance data for similar courses
        similar_course_metrics = []
        for course in similar_courses:
            course_data = await self.gather_course_data(course["id"])
            metrics = await self.compute_performance_metrics(course_data)
            similar_course_metrics.append(
                {
                    "id": course["id"],
                    "title": course["title"],
                    "similarity": course["score"],
                    "metrics": metrics["overall"],
                }
            )

        # Get this course's metrics
        course_data = await self.gather_course_data(course_id)
        course_metrics = await self.compute_performance_metrics(course_data)

        # Compare metrics
        avg_completion_rate = (
            sum([c["metrics"]["completion_rate"] for c in similar_course_metrics])
            / len(similar_course_metrics)
            if similar_course_metrics
            else 0
        )
        avg_grade = (
            sum([c["metrics"]["avg_grade"] for c in similar_course_metrics])
            / len(similar_course_metrics)
            if similar_course_metrics
            else 0
        )
        avg_engagement = (
            sum([c["metrics"]["engagement_score"] for c in similar_course_metrics])
            / len(similar_course_metrics)
            if similar_course_metrics
            else 0
        )

        completion_diff = (
            course_metrics["overall"]["completion_rate"] - avg_completion_rate
        )
        grade_diff = course_metrics["overall"]["avg_grade"] - avg_grade
        engagement_diff = course_metrics["overall"]["engagement_score"] - avg_engagement

        return {
            "course_metrics": course_metrics["overall"],
            "similar_courses": similar_course_metrics,
            "comparison": {
                "completion_rate_diff": completion_diff,
                "avg_grade_diff": grade_diff,
                "engagement_diff": engagement_diff,
            },
        }

    async def generate_ai_insights(
        self, course_data: Dict[str, Any], course_embeddings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate AI-powered insights for a course"""

        # Compute performance metrics
        metrics = await self.compute_performance_metrics(course_data)

        # Analyze content using embeddings
        content_analysis = await self.analyze_content_embeddings(
            course_data["course"]["id"]
        )

        # Compare to similar courses
        comparison = await self.compare_to_similar_courses(course_data["course"]["id"])

        # Prepare data for LLM analysis
        analysis_data = {
            "course": course_data["course"],
            "metrics": metrics,
            "content_analysis": content_analysis,
            "comparison": comparison,
        }

        # Generate insights using LLM
        llm_prompt = f"""
        I have analyzed a course and gathered the following data:

        Course: {json.dumps(analysis_data['course'])}

        Performance Metrics: {json.dumps(analysis_data['metrics'])}

        Content Analysis: {json.dumps(analysis_data['content_analysis'])}

        Comparison to Similar Courses: {json.dumps(analysis_data['comparison'])}

        Based on this comprehensive analysis, generate insights and actionable recommendations in the following categories:

        1. Problem Areas: Identify 2-3 specific issues that need addressing
        2. Topic Improvements: Suggest improvements for 2-3 specific topics or content areas
        3. Engagement Recommendations: Provide 2-3 specific strategies to improve student engagement

        Format the response as JSON with the following structure:
        {{
            "problemAreas": [
                {{
                    "id": 1,
                    "title": "Problem title",
                    "category": "Category",
                    "affectedStudents": 25,
                    "severity": "medium",
                    "suggestedAction": "Detailed action to take"
                }},
                ...
            ],
            "topicSuggestions": [
                {{
                    "topic": "Topic name",
                    "improvement": "Detailed improvement suggestion"
                }},
                ...
            ],
            "engagementRecommendations": [
                "Detailed recommendation 1",
                ...
            ]
        }}
        """

        # Call the LLM to generate insights
        llm_response = await self.llm_client.generate_text(llm_prompt)

        try:
            # Parse the JSON response
            insights = json.loads(llm_response)
            return insights

        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM response as JSON: {llm_response}")
            # Return a fallback response
            return {
                "problemAreas": [
                    {
                        "id": 1,
                        "title": "Error generating insights",
                        "category": "System",
                        "affectedStudents": 0,
                        "severity": "low",
                        "suggestedAction": "Please try again later or contact support if the issue persists.",
                    }
                ],
                "topicSuggestions": [],
                "engagementRecommendations": [],
            }
