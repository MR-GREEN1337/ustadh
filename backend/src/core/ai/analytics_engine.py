"""
Analytics Engine for Professor Dashboard

This module handles the complex analytics processing, including:
1. Data collection and preprocessing
2. Statistical analysis
3. AI insights generation
4. Embedding-based content analysis
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime
import numpy as np
import json
import logging
import uuid
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
import base64
import io
from fpdf import FPDF
import matplotlib.pyplot as plt

from src.db.qdrant import QdrantClientWrapper
from src.core.llm import LLM
from src.db.models import (
    SchoolCourse,
    DetailedTutoringSession,
    TutoringExchange,
    Topic,
    Subject,
    SchoolStudent,
    User,
    SchoolClass,
    AssignmentSubmission,
    CourseEnrollment,
    Assignment,
)

logger = logging.getLogger(__name__)


class AnalyticsEngine:
    """Core engine for processing analytics data and generating insights"""

    def __init__(self):
        """Initialize the analytics engine with necessary components"""
        self.llm = LLM()  # Assuming an LLM client is already defined in the project
        self.qdrant_client = QdrantClientWrapper()

    async def gather_course_data(
        self, course_id: int, db: AsyncSession
    ) -> Dict[str, Any]:
        """Gather all relevant data for a course"""

        # Get course details
        course_query = select(SchoolCourse).where(SchoolCourse.id == course_id)
        course_result = await db.execute(course_query)
        course = course_result.scalar_one_or_none()

        if not course:
            raise ValueError(f"Course with ID {course_id} not found")

        # Get all enrollments
        enrollments_query = select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id
        )
        enrollments_result = await db.execute(enrollments_query)
        enrollments = enrollments_result.scalars().all()

        # Get all assignments
        assignments_query = select(Assignment).where(Assignment.course_id == course_id)
        assignments_result = await db.execute(assignments_query)
        assignments = assignments_result.scalars().all()

        # Get all submissions
        submissions_query = (
            select(AssignmentSubmission)
            .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id)
            .where(Assignment.course_id == course_id)
        )
        submissions_result = await db.execute(submissions_query)
        submissions = submissions_result.scalars().all()

        # Get all tutoring sessions
        tutoring_query = select(DetailedTutoringSession).where(
            DetailedTutoringSession.related_course_id == course_id
        )
        tutoring_result = await db.execute(tutoring_query)
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

    async def generate_insights(
        self,
        session_ids: List[str],
        class_id: int,
        student_id: Optional[int] = None,
        time_range: str = "30days",
        db: AsyncSession = None,
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered insights from tutoring session data

        Args:
            session_ids: List of tutoring session IDs to analyze
            class_id: The ID of the class
            student_id: Optional ID of a specific student
            time_range: Time range for the analysis
            db: Database session

        Returns:
            List of insight objects
        """
        # If no sessions provided, return empty insights
        if not session_ids:
            return []

        # Fetch details for the specified sessions
        sessions_query = select(DetailedTutoringSession).where(
            DetailedTutoringSession.id.in_(session_ids)
        )

        sessions_result = await db.execute(sessions_query)
        sessions = sessions_result.scalars().all()

        # Fetch exchanges for these sessions
        exchanges_query = (
            select(TutoringExchange)
            .where(TutoringExchange.session_id.in_(session_ids))
            .order_by(TutoringExchange.session_id, TutoringExchange.sequence)
        )

        exchanges_result = await db.execute(exchanges_query)
        exchanges = exchanges_result.scalars().all()

        # Group exchanges by session
        session_exchanges: Dict[str, List[TutoringExchange]] = {}
        for exchange in exchanges:
            session_id = str(exchange.session_id)
            if session_id not in session_exchanges:
                session_exchanges[session_id] = []
            session_exchanges[session_id].append(exchange)

        # Get class details
        class_query = select(SchoolClass).where(SchoolClass.id == class_id)
        class_result = await db.execute(class_query)
        class_details = class_result.scalar_one_or_none()

        # Get student details if specified
        student_details = None
        if student_id:
            student_query = (
                select(SchoolStudent)
                .join(User, SchoolStudent.user_id == User.id)
                .where(SchoolStudent.id == student_id)
            )
            student_result = await db.execute(student_query)
            student_details = student_result.scalar_one_or_none()

        # Extract topics from sessions
        topic_ids = list(
            set([session.topic_id for session in sessions if session.topic_id])
        )

        # Get topic details
        topic_query = select(Topic).where(Topic.id.in_(topic_ids))
        topic_result = await db.execute(topic_query)
        topics = {topic.id: topic for topic in topic_result.scalars().all()}

        # Get subject details for topics
        subject_ids = list(
            set([topic.subject_id for topic in topics.values() if topic.subject_id])
        )
        subject_query = select(Subject).where(Subject.id.in_(subject_ids))
        subject_result = await db.execute(subject_query)
        subjects = {subject.id: subject for subject in subject_result.scalars().all()}

        # Extract confusion points
        confusion_points = []
        for session_id, session_exch in session_exchanges.items():
            for exchange in session_exch:
                # Check if exchange has learning signals indicating confusion
                if (
                    exchange.learning_signals
                    and "misunderstanding" in exchange.learning_signals
                ):
                    misunderstanding_score = exchange.learning_signals.get(
                        "misunderstanding", 0
                    )
                    if misunderstanding_score > 0.5:  # Threshold for confusion
                        # Find the session for this exchange
                        session = next(
                            (s for s in sessions if str(s.id) == session_id), None
                        )
                        if session:
                            topic = topics.get(session.topic_id)
                            subject = subjects.get(topic.subject_id) if topic else None

                            confusion_points.append(
                                {
                                    "session_id": session_id,
                                    "topic_id": session.topic_id if session else None,
                                    "topic_name": topic.name
                                    if topic
                                    else "Unknown Topic",
                                    "subject_id": topic.subject_id if topic else None,
                                    "subject_name": subject.name
                                    if subject
                                    else "Unknown Subject",
                                    "student_question": exchange.student_input.get(
                                        "text", ""
                                    ),
                                    "ai_response": exchange.ai_response.get("text", ""),
                                    "misunderstanding_score": misunderstanding_score,
                                }
                            )

        # Extract learning achievements
        learning_achievements = []
        for session in sessions:
            if session.concepts_learned and len(session.concepts_learned) > 0:
                topic = topics.get(session.topic_id)
                subject = subjects.get(topic.subject_id) if topic else None

                for concept in session.concepts_learned:
                    learning_achievements.append(
                        {
                            "session_id": str(session.id),
                            "topic_id": session.topic_id,
                            "topic_name": topic.name if topic else "Unknown Topic",
                            "subject_id": topic.subject_id if topic else None,
                            "subject_name": subject.name
                            if subject
                            else "Unknown Subject",
                            "concept": concept,
                        }
                    )

        # Count sessions by topic
        topic_counts = {}
        for session in sessions:
            if session.topic_id:
                topic_counts[session.topic_id] = (
                    topic_counts.get(session.topic_id, 0) + 1
                )

        # Sort topics by frequency
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
        popular_topics = [
            {
                "topic_id": topic_id,
                "topic_name": topics.get(topic_id).name
                if topic_id in topics
                else "Unknown Topic",
                "count": count,
                "subject_id": topics.get(topic_id).subject_id
                if topic_id in topics
                else None,
                "subject_name": subjects.get(topics.get(topic_id).subject_id).name
                if topic_id in topics and topics.get(topic_id).subject_id in subjects
                else "Unknown Subject",
            }
            for topic_id, count in sorted_topics[:5]  # Top 5 topics
        ]

        # Prepare data for LLM analysis
        analysis_data = {
            "class_details": {
                "id": class_details.id,
                "name": class_details.name,
                "education_level": class_details.education_level,
                "academic_track": class_details.academic_track,
            }
            if class_details
            else {},
            "student_details": {
                "id": student_details.id,
                "name": student_details.user.full_name
                if hasattr(student_details, "user")
                else "Unknown",
                "education_level": student_details.education_level,
                "academic_track": student_details.academic_track,
            }
            if student_details
            else {"id": None, "name": "All Students"},
            "time_range": time_range,
            "total_sessions": len(sessions),
            "popular_topics": popular_topics,
            "confusion_points": confusion_points[:10],  # Limit to top 10
            "learning_achievements": learning_achievements[:10],  # Limit to top 10
        }

        # Generate insights using LLM
        insights = await self._generate_llm_insights(analysis_data)

        return insights

    async def _generate_llm_insights(
        self, analysis_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Use LLM to generate insights from the analyzed data

        Args:
            analysis_data: Preprocessed data for analysis

        Returns:
            List of insight objects
        """
        # Prepare the prompt for the LLM
        is_individual = analysis_data["student_details"]["id"] is not None
        student_or_class = (
            f"student {analysis_data['student_details']['name']}"
            if is_individual
            else "the entire class"
        )

        prompt = f"""
        As an AI teaching assistant, you are analyzing tutoring data for {student_or_class} in {analysis_data['class_details'].get('name', 'a class')}.

        Class details:
        - Education level: {analysis_data['class_details'].get('education_level', 'Not specified')}
        - Academic track: {analysis_data['class_details'].get('academic_track', 'Not specified')}

        Analysis period: {analysis_data['time_range']}
        Total tutoring sessions analyzed: {analysis_data['total_sessions']}

        Popular topics:
        {json.dumps(analysis_data['popular_topics'], indent=2)}

        Points of confusion:
        {json.dumps(analysis_data['confusion_points'], indent=2)}

        Learning achievements:
        {json.dumps(analysis_data['learning_achievements'], indent=2)}

        Based on this data, please generate THREE different types of insights:

        1. "strength" - Areas where {student_or_class} shows strengths or good understanding
        2. "improvement" - Areas where {student_or_class} needs improvement or has misconceptions
        3. "classroom" - Recommendations for classroom activities that would help address identified gaps

        For each insight, provide:
        - A concise but specific title
        - A helpful description with specific details
        - Relevant subject IDs from the data
        - A relevance score from 1-10

        Format your response as a JSON array of insight objects:
        [
            {
                "id": "unique-id-1",
                "title": "Insight title",
                "description": "Detailed description with specific recommendations",
                "type": "strength|improvement|classroom",
                "subject_ids": [list of relevant subject IDs],
                "relevance": relevance_score
            },
            ...
        ]

        Include 2-3 insights for each type (strength, improvement, classroom).
        """

        try:
            # Call the LLM
            llm_response = await self.llm.generate_text(prompt)

            # Parse the JSON response
            insights = json.loads(llm_response)

            # Add unique IDs if missing
            for insight in insights:
                if "id" not in insight or not insight["id"]:
                    insight["id"] = str(uuid.uuid4())

            return insights

        except Exception as e:
            logger.error(f"Error generating insights with LLM: {str(e)}")

            # Return fallback insights
            return [
                {
                    "id": str(uuid.uuid4()),
                    "title": "Insufficient data for detailed insights",
                    "description": "More AI tutoring sessions are needed to generate meaningful insights. Encourage students to continue using the platform.",
                    "type": "classroom",
                    "subject_ids": [],
                    "relevance": 5,
                }
            ]

    async def generate_visualization(
        self,
        session_texts: Dict[str, List[str]],
        topic_map: Dict[str, Dict[str, Any]],
        topic_colors: Dict[str, str],
        sessions: List[Any],
    ) -> Dict[str, Any]:
        """
        Generate 3D visualization data from session texts when embeddings aren't available

        Args:
            session_texts: Dictionary mapping session IDs to lists of text exchanges
            topic_map: Dictionary mapping topic IDs to topic information
            topic_colors: Dictionary mapping topic IDs to colors
            sessions: List of session objects

        Returns:
            Visualization data for 3D plots
        """
        # Create a mapping of session IDs to topic IDs
        session_to_topic = {str(s.id): str(s.topic_id) for s in sessions}
        session_to_query = {str(s.id): s.initial_query for s in sessions}

        # Combine all texts for each session
        session_combined_texts = {}
        for session_id, texts in session_texts.items():
            session_combined_texts[session_id] = " ".join(texts)

        # Check if we have enough sessions
        if len(session_combined_texts) < 3:
            # Not enough data for meaningful visualization
            # Return minimal data structure
            return {"points": [], "centers": [], "clusters": []}

        try:
            # Create TF-IDF vectors
            vectorizer = TfidfVectorizer(max_features=1000, stop_words="english")
            session_ids = list(session_combined_texts.keys())
            texts = [session_combined_texts[sid] for sid in session_ids]

            # Fit and transform texts to vectors
            tfidf_matrix = vectorizer.fit_transform(texts)

            # Apply PCA for dimensionality reduction to 3D
            pca = PCA(n_components=3)
            coords_3d = pca.fit_transform(tfidf_matrix.toarray())

            # Prepare points data for visualization
            points = []
            for i, session_id in enumerate(session_ids):
                topic_id = session_to_topic.get(session_id)

                if not topic_id:
                    continue

                topic_info = topic_map.get(topic_id, {})
                topic_name = topic_info.get("name", "Unknown Topic")
                color = topic_colors.get(
                    topic_id, "#808080"
                )  # Default to gray if no color assigned

                points.append(
                    {
                        "id": session_id,
                        "cluster_id": topic_id,
                        "x": float(coords_3d[i, 0]),
                        "y": float(coords_3d[i, 1]),
                        "z": float(coords_3d[i, 2]),
                        "label": f"{topic_name}: {session_to_query.get(session_id, '')[:50]}...",
                        "color": color,
                    }
                )

            # Calculate cluster centers
            topic_points = {}
            for point in points:
                topic_id = point["cluster_id"]
                if topic_id not in topic_points:
                    topic_points[topic_id] = []
                topic_points[topic_id].append((point["x"], point["y"], point["z"]))

            centers = []
            for topic_id, coords in topic_points.items():
                if not coords:
                    continue

                # Calculate mean coordinates
                coord_array = np.array(coords)
                mean_x = float(np.mean(coord_array[:, 0]))
                mean_y = float(np.mean(coord_array[:, 1]))
                mean_z = float(np.mean(coord_array[:, 2]))

                topic_info = topic_map.get(topic_id, {})
                topic_name = topic_info.get("name", "Unknown Topic")
                color = topic_colors.get(topic_id, "#808080")

                centers.append(
                    {
                        "id": topic_id,
                        "name": topic_name,
                        "x": mean_x,
                        "y": mean_y,
                        "z": mean_z,
                        "color": color,
                    }
                )

            # Format clusters information
            clusters = []
            for topic_id, info in topic_map.items():
                clusters.append(
                    {
                        "id": topic_id,
                        "name": info.get("name", "Unknown Topic"),
                        "count": info.get("count", 0),
                        "color": topic_colors.get(topic_id, "#808080"),
                    }
                )

            return {"points": points, "centers": centers, "clusters": clusters}

        except Exception as e:
            logger.error(f"Error generating visualization: {str(e)}")
            return {"points": [], "centers": [], "clusters": []}

    async def process_embeddings(
        self,
        embeddings: List[Dict[str, Any]],
        topic_map: Dict[str, Dict[str, Any]],
        topic_colors: Dict[str, str],
    ) -> Dict[str, Any]:
        """
        Process existing embeddings for visualization

        Args:
            embeddings: List of session embedding objects
            topic_map: Dictionary mapping topic IDs to topic information
            topic_colors: Dictionary mapping topic IDs to colors

        Returns:
            Visualization data for 3D plots
        """
        # Check if we have enough embeddings
        if len(embeddings) < 3:
            return {"points": [], "centers": [], "clusters": []}

        try:
            # Extract embedding vectors
            session_ids = [e["id"] for e in embeddings]
            topic_ids = [e["topic_id"] for e in embeddings]
            embedding_vectors = [e["embedding"] for e in embeddings]
            labels = [e["label"] for e in embeddings]

            # Convert to numpy array
            embedding_array = np.array(embedding_vectors)

            # Apply PCA for dimensionality reduction to 3D
            pca = PCA(n_components=3)
            coords_3d = pca.fit_transform(embedding_array)

            # Prepare points data for visualization
            points = []
            for i, session_id in enumerate(session_ids):
                topic_id = topic_ids[i]
                color = topic_colors.get(
                    topic_id, "#808080"
                )  # Default to gray if no color assigned

                points.append(
                    {
                        "id": session_id,
                        "cluster_id": topic_id,
                        "x": float(coords_3d[i, 0]),
                        "y": float(coords_3d[i, 1]),
                        "z": float(coords_3d[i, 2]),
                        "label": labels[i],
                        "color": color,
                    }
                )

            # Calculate cluster centers
            topic_points = {}
            for point in points:
                topic_id = point["cluster_id"]
                if topic_id not in topic_points:
                    topic_points[topic_id] = []
                topic_points[topic_id].append((point["x"], point["y"], point["z"]))

            centers = []
            for topic_id, coords in topic_points.items():
                if not coords:
                    continue

                # Calculate mean coordinates
                coord_array = np.array(coords)
                mean_x = float(np.mean(coord_array[:, 0]))
                mean_y = float(np.mean(coord_array[:, 1]))
                mean_z = float(np.mean(coord_array[:, 2]))

                topic_info = topic_map.get(topic_id, {})
                topic_name = topic_info.get("name", "Unknown Topic")
                color = topic_colors.get(topic_id, "#808080")

                centers.append(
                    {
                        "id": topic_id,
                        "name": topic_name,
                        "x": mean_x,
                        "y": mean_y,
                        "z": mean_z,
                        "color": color,
                    }
                )

            # Format clusters information
            clusters = []
            for topic_id, info in topic_map.items():
                clusters.append(
                    {
                        "id": topic_id,
                        "name": info.get("name", "Unknown Topic"),
                        "count": info.get("count", 0),
                        "color": topic_colors.get(topic_id, "#808080"),
                    }
                )

            return {"points": points, "centers": centers, "clusters": clusters}

        except Exception as e:
            logger.error(f"Error processing embeddings: {str(e)}")
            return {"points": [], "centers": [], "clusters": []}

    async def generate_pdf_report(
        self,
        class_details: Any,
        student_details: Optional[Any],
        activity_data: List[Dict[str, Any]],
        subject_activity: List[Dict[str, Any]],
        insights: List[Dict[str, Any]],
        time_range: str,
    ) -> bytes:
        """
        Generate a PDF report with insights and visualizations

        Args:
            class_details: Class information
            student_details: Optional student information
            activity_data: Activity metrics by date
            subject_activity: Subject activity metrics
            insights: Generated insights
            time_range: Time range for the report

        Returns:
            PDF document as bytes
        """
        try:
            # Create PDF document
            pdf = FPDF()
            pdf.add_page()

            # Set up fonts
            pdf.set_font("Arial", "B", 16)

            # Title
            if student_details:
                pdf.cell(
                    0,
                    10,
                    f"Student AI Insights Report: {student_details.user.full_name if hasattr(student_details, 'user') else 'Unknown'}",
                    ln=True,
                    align="C",
                )
            else:
                pdf.cell(
                    0,
                    10,
                    f"Class AI Insights Report: {class_details.name}",
                    ln=True,
                    align="C",
                )

            # Subtitle with date range
            pdf.set_font("Arial", "I", 12)
            time_range_text = {
                "7days": "Last 7 Days",
                "30days": "Last 30 Days",
                "90days": "Last 90 Days",
                "semester": "This Semester",
            }.get(time_range, time_range)

            pdf.cell(0, 10, f"Period: {time_range_text}", ln=True, align="C")

            # Class details
            pdf.set_font("Arial", "B", 14)
            pdf.cell(0, 15, "Class Information", ln=True)
            pdf.set_font("Arial", "", 12)
            pdf.cell(0, 8, f"Class Name: {class_details.name}", ln=True)
            pdf.cell(0, 8, f"Education Level: {class_details.education_level}", ln=True)
            if class_details.academic_track:
                pdf.cell(
                    0, 8, f"Academic Track: {class_details.academic_track}", ln=True
                )

            # Add student details if applicable
            if student_details:
                pdf.set_font("Arial", "B", 14)
                pdf.cell(0, 15, "Student Information", ln=True)
                pdf.set_font("Arial", "", 12)
                pdf.cell(
                    0,
                    8,
                    f"Student Name: {student_details.user.full_name if hasattr(student_details, 'user') else 'Unknown'}",
                    ln=True,
                )
                pdf.cell(
                    0, 8, f"Education Level: {student_details.education_level}", ln=True
                )
                if student_details.academic_track:
                    pdf.cell(
                        0,
                        8,
                        f"Academic Track: {student_details.academic_track}",
                        ln=True,
                    )

            # Activity overview
            pdf.set_font("Arial", "B", 14)
            pdf.cell(0, 15, "AI Tutoring Activity", ln=True)

            # Generate activity chart
            if activity_data:
                activity_chart = self._create_activity_chart(activity_data)
                if activity_chart:
                    pdf.image(activity_chart, x=10, y=None, w=190)

            # Add some spacing
            pdf.cell(0, 10, "", ln=True)

            # Subject activity
            pdf.set_font("Arial", "B", 14)
            pdf.cell(0, 15, "Subject Activity", ln=True)

            if subject_activity:
                # Generate subject activity chart
                subject_chart = self._create_subject_chart(subject_activity)
                if subject_chart:
                    pdf.image(subject_chart, x=10, y=None, w=190)
            else:
                pdf.set_font("Arial", "I", 12)
                pdf.cell(
                    0,
                    10,
                    "No subject activity data available for this period.",
                    ln=True,
                )

            # Start a new page for insights
            pdf.add_page()

            # AI-Generated Insights
            pdf.set_font("Arial", "B", 16)
            pdf.cell(0, 15, "AI-Generated Insights", ln=True)

            # Filter insights by type
            strength_insights = [
                i for i in insights if i.get("recommendationType") == "strength"
            ]
            improvement_insights = [
                i for i in insights if i.get("recommendationType") == "improvement"
            ]
            classroom_insights = [
                i for i in insights if i.get("recommendationType") == "classroom"
            ]

            # Classroom Activities
            if classroom_insights:
                pdf.set_font("Arial", "B", 14)
                pdf.cell(0, 15, "Recommended Classroom Activities", ln=True)

                for insight in classroom_insights:
                    pdf.set_font("Arial", "B", 12)
                    pdf.cell(0, 10, insight.get("title", ""), ln=True)

                    pdf.set_font("Arial", "", 12)

                    # Word wrap for description
                    description = insight.get("description", "")
                    # Wrap long lines
                    pdf.multi_cell(0, 8, description)

                    if insight.get("subjects"):
                        pdf.set_font("Arial", "I", 10)
                        pdf.cell(
                            0,
                            8,
                            f"Relevant subjects: {', '.join(insight.get('subjects', []))}",
                            ln=True,
                        )

                    pdf.cell(0, 5, "", ln=True)

            # Areas of Strength
            if strength_insights:
                pdf.set_font("Arial", "B", 14)
                pdf.cell(0, 15, "Areas of Strength", ln=True)

                for insight in strength_insights:
                    pdf.set_font("Arial", "B", 12)
                    pdf.cell(0, 10, insight.get("title", ""), ln=True)

                    pdf.set_font("Arial", "", 12)

                    # Word wrap for description
                    description = insight.get("description", "")
                    pdf.multi_cell(0, 8, description)

                    if insight.get("subjects"):
                        pdf.set_font("Arial", "I", 10)
                        pdf.cell(
                            0,
                            8,
                            f"Relevant subjects: {', '.join(insight.get('subjects', []))}",
                            ln=True,
                        )

                    pdf.cell(0, 5, "", ln=True)

            # Areas for Improvement
            if improvement_insights:
                pdf.set_font("Arial", "B", 14)
                pdf.cell(0, 15, "Areas for Improvement", ln=True)

                for insight in improvement_insights:
                    pdf.set_font("Arial", "B", 12)
                    pdf.cell(0, 10, insight.get("title", ""), ln=True)

                    pdf.set_font("Arial", "", 12)

                    # Word wrap for description
                    description = insight.get("description", "")
                    pdf.multi_cell(0, 8, description)

                    if insight.get("subjects"):
                        pdf.set_font("Arial", "I", 10)
                        pdf.cell(
                            0,
                            8,
                            f"Relevant subjects: {', '.join(insight.get('subjects', []))}",
                            ln=True,
                        )

                    pdf.cell(0, 5, "", ln=True)

            # Footer
            pdf.set_y(-20)
            pdf.set_font("Arial", "I", 8)
            pdf.cell(
                0,
                10,
                f"Generated on {datetime.utcnow().strftime('%Y-%m-%d')} - AI Tutoring Insights",
                ln=True,
                align="C",
            )

            # Output the PDF
            return pdf.output(dest="S").encode("latin1")

        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")

            # Create a simple error PDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", "B", 16)
            pdf.cell(0, 10, "Error Generating Report", ln=True, align="C")
            pdf.set_font("Arial", "", 12)
            pdf.cell(0, 10, "An error occurred while generating this report.", ln=True)
            pdf.cell(
                0,
                10,
                "Please try again later or contact support if the issue persists.",
                ln=True,
            )

            return pdf.output(dest="S").encode("latin1")

    def _create_activity_chart(
        self, activity_data: List[Dict[str, Any]]
    ) -> Optional[str]:
        """Create activity chart and return as base64 image"""
        try:
            # Extract data
            dates = [item.get("date") for item in activity_data]
            total = [item.get("total") for item in activity_data]
            questions = [item.get("questions") for item in activity_data]
            practice = [item.get("practice") for item in activity_data]

            # Create the figure and axis
            plt.figure(figsize=(10, 5))
            plt.plot(dates, total, marker="o", label="Total Activity")
            plt.plot(dates, questions, marker="s", label="Questions")
            plt.plot(dates, practice, marker="^", label="Practice")

            # Add labels and title
            plt.xlabel("Date")
            plt.ylabel("Number of Sessions")
            plt.title("AI Tutoring Activity Over Time")
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.legend()
            plt.grid(True, linestyle="--", alpha=0.7)

            # Save to in-memory file
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format="png")
            plt.close()

            # Encode as base64
            img_buffer.seek(0)
            return (
                "data:image/png;base64,"
                + base64.b64encode(img_buffer.getvalue()).decode()
            )

        except Exception as e:
            logger.error(f"Error creating activity chart: {str(e)}")
            return None

    def _create_subject_chart(
        self, subject_data: List[Dict[str, Any]]
    ) -> Optional[str]:
        """Create subject activity chart and return as base64 image"""
        try:
            # Extract data
            subjects = [item.get("subject") for item in subject_data]
            activity = [item.get("activity") for item in subject_data]
            strength = [item.get("strength") for item in subject_data]
            improvement = [item.get("improvement") for item in subject_data]

            # Create the figure and axis
            plt.figure(figsize=(10, 6))

            # Adjust color for better contrast in PDF
            bar_width = 0.25
            x = np.arange(len(subjects))

            plt.bar(
                x - bar_width,
                activity,
                width=bar_width,
                label="Activity Level",
                color="#4f46e5",
            )
            plt.bar(x, strength, width=bar_width, label="Strengths", color="#0891b2")
            plt.bar(
                x + bar_width,
                improvement,
                width=bar_width,
                label="Areas for Improvement",
                color="#f59e0b",
            )

            # Add labels and title
            plt.xlabel("Subject")
            plt.ylabel("Score")
            plt.title("Subject Activity Analysis")
            plt.xticks(x, subjects, rotation=45, ha="right")
            plt.tight_layout()
            plt.legend()
            plt.grid(True, linestyle="--", alpha=0.7)

            # Save to in-memory file
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format="png")
            plt.close()

            # Encode as base64
            img_buffer.seek(0)
            return (
                "data:image/png;base64,"
                + base64.b64encode(img_buffer.getvalue()).decode()
            )

        except Exception as e:
            logger.error(f"Error creating subject chart: {str(e)}")
            return None

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

    async def analyze_content_embeddings(
        self, course_id: int, db: AsyncSession
    ) -> Dict[str, Any]:
        """Analyze course content using embeddings"""
        try:
            # Get course details
            course_query = select(SchoolCourse).where(SchoolCourse.id == course_id)
            course_result = await db.execute(course_query)
            course = course_result.scalar_one_or_none()

            if not course:
                raise ValueError(f"Course with ID {course_id} not found")

            # Get all tutoring sessions related to this course
            tutoring_query = select(DetailedTutoringSession).where(
                DetailedTutoringSession.related_course_id == course_id
            )
            tutoring_result = await db.execute(tutoring_query)
            tutoring_sessions = tutoring_result.scalars().all()

            # Count topics by frequency
            topic_counts = {}
            for session in tutoring_sessions:
                if session.topic_id:
                    topic_counts[session.topic_id] = (
                        topic_counts.get(session.topic_id, 0) + 1
                    )

            # Get topics from database
            if topic_counts:
                topic_ids = list(topic_counts.keys())
                topics_query = select(Topic).where(Topic.id.in_(topic_ids))
                topics_result = await db.execute(topics_query)
                topics = topics_result.scalars().all()

                # Analyze topic cohesion and gaps
                topic_names = [topic.name for topic in topics]
                learning_objectives = (
                    course.learning_objectives if course.learning_objectives else []
                )

                # Compare learning objectives with covered topics
                covered_objectives = []
                missing_objectives = []

                for objective in learning_objectives:
                    is_covered = any(
                        objective.lower() in topic.lower() for topic in topic_names
                    )
                    if is_covered:
                        covered_objectives.append(objective)
                    else:
                        missing_objectives.append(objective)

                # Calculate content coherence score based on topic coverage
                content_coherence = (
                    len(covered_objectives) / len(learning_objectives)
                    if learning_objectives
                    else 0.5
                )

                # Identify strengths based on frequently discussed topics
                sorted_topics = sorted(
                    topic_counts.items(), key=lambda x: x[1], reverse=True
                )
                top_topic_ids = [topic_id for topic_id, _ in sorted_topics[:3]]
                strength_topics = [
                    topic for topic in topics if topic.id in top_topic_ids
                ]
                content_strengths = [topic.name for topic in strength_topics]

                # Generate improvement suggestions
                improvement_suggestions = []
                for objective in missing_objectives[:2]:
                    improvement_suggestions.append(
                        f"Add more content covering '{objective}'"
                    )

                if len(tutoring_sessions) > 0:
                    # Check for topics with high confusion indicators
                    confusion_counts = {}
                    for session in tutoring_sessions:
                        if session.topic_id and hasattr(session, "exchanges"):
                            for exchange in session.exchanges:
                                if (
                                    exchange.learning_signals
                                    and exchange.learning_signals.get(
                                        "misunderstanding", 0
                                    )
                                    > 0.6
                                ):
                                    confusion_counts[session.topic_id] = (
                                        confusion_counts.get(session.topic_id, 0) + 1
                                    )

                    # Find topics with high confusion
                    if confusion_counts:
                        confused_topics = sorted(
                            confusion_counts.items(), key=lambda x: x[1], reverse=True
                        )
                        for topic_id, count in confused_topics[:2]:
                            topic = next((t for t in topics if t.id == topic_id), None)
                            if topic:
                                improvement_suggestions.append(
                                    f"Improve explanations for '{topic.name}' to address student confusion"
                                )

                return {
                    "content_coherence": content_coherence,
                    "identified_gaps": missing_objectives[:3],
                    "content_strengths": content_strengths,
                    "improvement_suggestions": improvement_suggestions,
                }

            # Fallback if no topic data available
            return {
                "content_coherence": 0.5,  # Default middle value
                "identified_gaps": [
                    "Insufficient data to identify specific gaps",
                ],
                "content_strengths": [
                    "Insufficient data to identify specific strengths",
                ],
                "improvement_suggestions": [
                    "Encourage more AI tutoring sessions to gather data",
                    "Define learning objectives for better analysis",
                ],
            }

        except Exception as e:
            logger.error(f"Error analyzing content embeddings: {str(e)}")
            return {
                "content_coherence": 0.5,
                "identified_gaps": [
                    "Error during content analysis",
                ],
                "content_strengths": [
                    "Error during content analysis",
                ],
                "improvement_suggestions": [
                    "Try again later or contact support",
                ],
            }
