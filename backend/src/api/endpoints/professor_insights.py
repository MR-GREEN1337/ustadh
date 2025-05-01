"""
Professor AI Insights API Endpoints

This module provides API endpoints for professors to access AI-driven insights
about student learning patterns and tutoring session analysis.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func

from src.api.endpoints.auth import get_current_user
from src.db.postgresql import get_session as get_db
from src.db.models import (
    User,
    SchoolStaff,
    SchoolStudent,
    SchoolClass,
    DetailedTutoringSession,
    TutoringExchange,
    SchoolCourse,
    Topic,
    CourseEnrollment,
    Subject,
    ClassEnrollment,
    SchoolProfessor,
    ProfessorCourse,
)
from src.db.qdrant import QdrantClientWrapper
from src.core.ai.analytics_engine import AnalyticsEngine

# Import Pydantic models for request/response
from src.api.models.professor_student_analytics import (
    ClassStudentResponse,
    ActivityDataResponse,
    SubjectActivityResponse,
    AIInsightResponse,
    TopicClusterResponse,
    VisualizationDataResponse,
)

from qdrant_client import models

router = APIRouter(prefix="/professor/insights", tags=["professor_insights"])

# Initialize clients
qdrant_client = QdrantClientWrapper()
analytics_engine = AnalyticsEngine()


# Helper Functions
async def validate_professor_access(
    db: AsyncSession, user_id: int, class_id: int
) -> bool:
    """Validate that the user is a professor with access to the specified class"""
    professor_query = select(SchoolStaff).where(
        SchoolStaff.user_id == user_id,
        SchoolStaff.staff_type.in_(["teacher", "professor"]),
        SchoolStaff.is_active,
    )

    professor_result = await db.execute(professor_query)
    professor = professor_result.scalar_one_or_none()

    if not professor:
        return False

    # Check if the professor teaches this class
    class_query = (
        select(SchoolClass)
        .join(SchoolClass.class_schedules)
        .where(SchoolClass.id == class_id, SchoolClass.school_id == professor.school_id)
    )

    class_result = await db.execute(class_query)
    class_schedule = class_result.scalar_one_or_none()

    return class_schedule is not None


def get_time_range_filter(time_range: str) -> datetime:
    """Convert time range string to a datetime filter"""
    now = datetime.utcnow()

    if time_range == "7days":
        return now - timedelta(days=7)
    elif time_range == "30days":
        return now - timedelta(days=30)
    elif time_range == "90days":
        return now - timedelta(days=90)
    elif time_range == "semester":
        # Roughly 4-5 months for a semester
        return now - timedelta(days=150)
    else:
        # Default to 30 days
        return now - timedelta(days=30)


@router.get("/classes", response_model=List[Dict[str, Any]])
async def get_professor_classes(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Get all classes taught by the professor
    """
    # Get professor record using SchoolProfessor model instead of SchoolStaff
    professor_query = select(SchoolProfessor).where(
        SchoolProfessor.user_id == current_user.id,
        SchoolProfessor.is_active,
    )

    professor_result = await db.execute(professor_query)
    professor = professor_result.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=403, detail="User is not a professor")

    # Get classes taught by the professor through ProfessorCourse relationship
    classes_query = (
        select(
            SchoolClass.id,
            SchoolClass.name,
            SchoolClass.education_level,
            SchoolClass.academic_track,
            func.count(ClassEnrollment.student_id.distinct()).label("student_count"),
        )
        .join(SchoolCourse, SchoolCourse.id == SchoolClass.id)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .join(SchoolClass.students, isouter=True)
        .where(ProfessorCourse.professor_id == professor.id)
        .group_by(
            SchoolClass.id,
            SchoolClass.name,
            SchoolClass.education_level,
            SchoolClass.academic_track,
        )
    )

    classes_result = await db.execute(classes_query)
    classes = classes_result.fetchall()

    # Format as JSON
    formatted_classes = []
    for class_item in classes:
        formatted_classes.append(
            {
                "id": class_item.id,
                "name": class_item.name,
                "education_level": class_item.education_level,
                "academic_track": class_item.academic_track,
                "student_count": class_item.student_count,
            }
        )

    return formatted_classes


@router.get("/students/{class_id}", response_model=List[ClassStudentResponse])
async def get_class_students(
    class_id: int = Path(..., description="The ID of the class"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all students enrolled in a specific class
    """
    # Validate professor access
    access = await validate_professor_access(db, current_user.id, class_id)
    if not access:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this class"
        )

    # Get students enrolled in the class
    students_query = (
        select(
            SchoolStudent.id,
            User.full_name.label("name"),
            SchoolStudent.education_level,
            SchoolStudent.academic_track,
            func.count(DetailedTutoringSession.id).label("activity_score"),
            func.max(DetailedTutoringSession.start_time).label("last_active"),
        )
        .join(User, User.id == SchoolStudent.user_id)
        .join(ClassEnrollment, ClassEnrollment.student_id == SchoolStudent.id)
        .join(
            DetailedTutoringSession,
            DetailedTutoringSession.user_id == User.id,
            isouter=True,
        )
        .where(ClassEnrollment.class_id == class_id)
        .group_by(
            SchoolStudent.id,
            User.full_name,
            SchoolStudent.education_level,
            SchoolStudent.academic_track,
        )
    )

    students_result = await db.execute(students_query)
    students = students_result.fetchall()

    # Format as response model
    student_responses = []
    for student in students:
        student_responses.append(
            ClassStudentResponse(
                id=student.id,
                name=student.name,
                education_level=student.education_level,
                academic_track=student.academic_track or "",
                activity_score=student.activity_score or 0,
                last_active=student.last_active.isoformat()
                if student.last_active
                else None,
            )
        )

    return student_responses


@router.get("/activity/{class_id}", response_model=List[ActivityDataResponse])
async def get_activity_data(
    class_id: int = Path(..., description="The ID of the class"),
    student_id: Optional[int] = Query(
        None, description="Filter by specific student ID"
    ),
    time_range: str = Query(
        "30days", description="Time range for data: 7days, 30days, 90days, semester"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get AI tutoring activity data by day for a specific class or student
    """
    # Validate professor access
    access = await validate_professor_access(db, current_user.id, class_id)
    if not access:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this class"
        )

    # Get time range filter
    start_date = get_time_range_filter(time_range)

    # Build query for sessions
    query = select(
        func.date_trunc("day", DetailedTutoringSession.start_time).label("date"),
        func.count(DetailedTutoringSession.id).label("total"),
        func.count(DetailedTutoringSession.id)
        .filter(DetailedTutoringSession.session_type == "chat")
        .label("questions"),
        func.count(DetailedTutoringSession.id)
        .filter(DetailedTutoringSession.session_type == "whiteboard")
        .label("practice"),
    ).where(DetailedTutoringSession.start_time >= start_date)

    # Join with user and enrollment information
    query = (
        query.join(User, User.id == DetailedTutoringSession.user_id)
        .join(SchoolStudent, SchoolStudent.user_id == User.id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .where(SchoolCourse.id == class_id)
    )

    # Filter by student if specified
    if student_id:
        query = query.where(SchoolStudent.id == student_id)

    # Group by date and order by date
    query = query.group_by(
        func.date_trunc("day", DetailedTutoringSession.start_time)
    ).order_by(func.date_trunc("day", DetailedTutoringSession.start_time))

    result = await db.execute(query)
    rows = result.fetchall()

    # Format the result
    activity_data = []
    for row in rows:
        activity_data.append(
            ActivityDataResponse(
                date=row.date.strftime("%Y-%m-%d"),
                total=row.total,
                questions=row.questions,
                practice=row.practice,
            )
        )

    # If there's no data, return an empty array
    if not activity_data:
        # Generate empty dataset with dates for the time range
        days = (datetime.utcnow() - start_date).days
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
            activity_data.append(
                ActivityDataResponse(date=date, total=0, questions=0, practice=0)
            )
        # Sort by date
        activity_data.sort(key=lambda x: x.date)

    return activity_data


@router.get("/subjects/{class_id}", response_model=List[SubjectActivityResponse])
async def get_subject_activity(
    class_id: int = Path(..., description="The ID of the class"),
    student_id: Optional[int] = Query(
        None, description="Filter by specific student ID"
    ),
    time_range: str = Query(
        "30days", description="Time range for data: 7days, 30days, 90days, semester"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get subject-based activity metrics for AI tutoring sessions
    """
    # Validate professor access
    access = await validate_professor_access(db, current_user.id, class_id)
    if not access:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this class"
        )

    # Get time range filter
    start_date = get_time_range_filter(time_range)

    # Build query for sessions by subject
    query = (
        select(
            Topic.subject_id,
            func.count(DetailedTutoringSession.id).label("activity"),
            func.avg(
                func.case(
                    (DetailedTutoringSession.concepts_learned.is_(None), 0),
                    else_=func.array_length(
                        DetailedTutoringSession.concepts_learned, 1
                    ),
                )
            ).label("strength"),
            func.avg(
                func.case(
                    (
                        TutoringExchange.learning_signals["misunderstanding"].is_(None),
                        0,
                    ),
                    else_=TutoringExchange.learning_signals["misunderstanding"].cast(
                        float
                    ),
                )
            ).label("improvement"),
        )
        .join(Topic, Topic.id == DetailedTutoringSession.topic_id)
        .join(
            TutoringExchange, TutoringExchange.session_id == DetailedTutoringSession.id
        )
        .join(User, User.id == DetailedTutoringSession.user_id)
        .join(SchoolStudent, SchoolStudent.user_id == User.id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .where(
            SchoolCourse.id == class_id,
            DetailedTutoringSession.start_time >= start_date,
        )
    )

    # Filter by student if specified
    if student_id:
        query = query.where(SchoolStudent.id == student_id)

    # Group by subject
    query = query.group_by(Topic.subject_id)

    result = await db.execute(query)
    rows = result.fetchall()

    # Get subject names
    subject_ids = [row.subject_id for row in rows]
    subjects_query = select(Subject).where(Subject.id.in_(subject_ids))
    subjects_result = await db.execute(subjects_query)
    subjects = {s.id: s.name for s in subjects_result.scalars().all()}

    # Format the result
    subject_activity = []
    for row in rows:
        subject_name = subjects.get(row.subject_id, f"Subject {row.subject_id}")
        subject_activity.append(
            SubjectActivityResponse(
                subject=subject_name,
                activity=row.activity,
                strength=float(row.strength or 0),
                improvement=float(row.improvement or 0),
            )
        )

    return subject_activity


@router.get("/recommendations/{class_id}", response_model=List[AIInsightResponse])
async def get_ai_insights(
    class_id: int = Path(..., description="The ID of the class"),
    student_id: Optional[int] = Query(
        None, description="Filter by specific student ID"
    ),
    time_range: str = Query(
        "30days", description="Time range for data: 7days, 30days, 90days, semester"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get AI-generated insights and recommendations for classroom integration
    """
    # Validate professor access
    access = await validate_professor_access(db, current_user.id, class_id)
    if not access:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this class"
        )

    # Get time range filter
    start_date = get_time_range_filter(time_range)

    # Fetch relevant tutoring sessions
    sessions_query = (
        select(DetailedTutoringSession.id)
        .join(User, User.id == DetailedTutoringSession.user_id)
        .join(SchoolStudent, SchoolStudent.user_id == User.id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .where(
            SchoolCourse.id == class_id,
            DetailedTutoringSession.start_time >= start_date,
        )
    )

    # Filter by student if specified
    if student_id:
        sessions_query = sessions_query.where(SchoolStudent.id == student_id)

    # Execute query and get session IDs
    sessions_result = await db.execute(sessions_query)
    session_ids = [str(s.id) for s in sessions_result.scalars().all()]

    if not session_ids:
        # No sessions found, return empty insights
        return []

    # Use analytics engine to generate insights
    insights = await analytics_engine.generate_insights(
        session_ids=session_ids,
        class_id=class_id,
        student_id=student_id,
        time_range=time_range,
        db=db,
    )

    # Format insights into response model
    formatted_insights = []
    for insight in insights:
        # Get subject names
        subject_ids = insight.get("subject_ids", [])
        subject_names = []
        if subject_ids:
            subjects_query = select(Subject).where(Subject.id.in_(subject_ids))
            subjects_result = await db.execute(subjects_query)
            subject_names = [s.name for s in subjects_result.scalars().all()]

        formatted_insights.append(
            AIInsightResponse(
                id=insight.get("id", ""),
                title=insight.get("title", ""),
                description=insight.get("description", ""),
                recommendationType=insight.get("type", "classroom"),
                subjects=subject_names,
                relevance=insight.get("relevance", 0),
            )
        )

    return formatted_insights


@router.get("/topics/{class_id}", response_model=List[TopicClusterResponse])
async def get_topic_clusters(
    class_id: int = Path(..., description="The ID of the class"),
    student_id: Optional[int] = Query(
        None, description="Filter by specific student ID"
    ),
    time_range: str = Query(
        "30days", description="Time range for data: 7days, 30days, 90days, semester"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get topic clusters from AI tutoring sessions
    """
    # Validate professor access
    access = await validate_professor_access(db, current_user.id, class_id)
    if not access:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this class"
        )

    # Get time range filter
    start_date = get_time_range_filter(time_range)

    # Get session topics with counts
    query = (
        select(
            Topic.id,
            Topic.name,
            func.count(DetailedTutoringSession.id).label("count"),
            func.avg(Topic.difficulty).label("difficulty"),
        )
        .join(DetailedTutoringSession, DetailedTutoringSession.topic_id == Topic.id)
        .join(User, User.id == DetailedTutoringSession.user_id)
        .join(SchoolStudent, SchoolStudent.user_id == User.id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .where(
            SchoolCourse.id == class_id,
            DetailedTutoringSession.start_time >= start_date,
        )
    )

    # Filter by student if specified
    if student_id:
        query = query.where(SchoolStudent.id == student_id)

    # Group by topic and order by count
    query = query.group_by(Topic.id, Topic.name).order_by(
        func.count(DetailedTutoringSession.id).desc()
    )

    result = await db.execute(query)
    rows = result.fetchall()

    # Choose colors for topics
    graph_colors = [
        "#4f46e5",
        "#0891b2",
        "#7c3aed",
        "#db2777",
        "#14b8a6",
        "#f59e0b",
        "#6366f1",
        "#10b981",
    ]

    # Format the result
    topic_clusters = []
    for i, row in enumerate(rows):
        topic_clusters.append(
            TopicClusterResponse(
                id=str(row.id),
                name=row.name,
                count=row.count,
                difficulty=float(row.difficulty),
                color=graph_colors[i % len(graph_colors)],
            )
        )

    return topic_clusters


@router.get("/visualization/{class_id}", response_model=VisualizationDataResponse)
async def get_visualization_data(
    class_id: int = Path(..., description="The ID of the class"),
    student_id: Optional[int] = Query(
        None, description="Filter by specific student ID"
    ),
    time_range: str = Query(
        "30days", description="Time range for data: 7days, 30days, 90days, semester"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get 3D visualization data of AI tutoring session embeddings using Qdrant
    """
    # Validate professor access
    access = await validate_professor_access(db, current_user.id, class_id)
    if not access:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this class"
        )

    # Get time range filter
    start_date = get_time_range_filter(time_range)

    # Fetch relevant tutoring sessions
    sessions_query = (
        select(
            DetailedTutoringSession.id,
            DetailedTutoringSession.topic_id,
            Topic.name.label("topic_name"),
            DetailedTutoringSession.initial_query,
        )
        .join(User, User.id == DetailedTutoringSession.user_id)
        .join(SchoolStudent, SchoolStudent.user_id == User.id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .join(Topic, Topic.id == DetailedTutoringSession.topic_id)
        .where(
            SchoolCourse.id == class_id,
            DetailedTutoringSession.start_time >= start_date,
        )
    )

    # Filter by student if specified
    if student_id:
        sessions_query = sessions_query.where(SchoolStudent.id == student_id)

    # Execute query
    sessions_result = await db.execute(sessions_query)
    sessions = sessions_result.fetchall()

    # Check if sessions exist
    if not sessions:
        return VisualizationDataResponse(points=[], centers=[], clusters=[])

    # Get session IDs
    session_ids = [str(s.id) for s in sessions]

    # Get topic clusters
    topics_query = (
        select(
            Topic.id,
            Topic.name,
            func.count(DetailedTutoringSession.id).label("count"),
            func.avg(Topic.difficulty).label("difficulty"),
        )
        .join(DetailedTutoringSession, DetailedTutoringSession.topic_id == Topic.id)
        .where(DetailedTutoringSession.id.in_(session_ids))
        .group_by(Topic.id, Topic.name)
    )

    topics_result = await db.execute(topics_query)
    topics = topics_result.fetchall()

    # Prepare topic mapping
    topic_map = {
        str(t.id): {"name": t.name, "count": t.count, "difficulty": float(t.difficulty)}
        for t in topics
    }

    # Choose colors for topics
    graph_colors = [
        "#4f46e5",
        "#0891b2",
        "#7c3aed",
        "#db2777",
        "#14b8a6",
        "#f59e0b",
        "#6366f1",
        "#10b981",
    ]

    topic_colors = {}
    for i, topic_id in enumerate(topic_map.keys()):
        topic_colors[topic_id] = graph_colors[i % len(graph_colors)]

    # Initialize Qdrant client if not already initialized
    if not qdrant_client.client:
        await qdrant_client.init_client()

    # Get embeddings from Qdrant
    session_embeddings = []
    for session in sessions:
        # Query Qdrant for session embeddings
        # Build filter condition for session ID
        filter_condition = models.Filter(
            must=[
                models.FieldCondition(
                    key="session_id", match=models.MatchValue(value=str(session.id))
                )
            ]
        )

        # Search for the session in Qdrant
        embedding_results = await qdrant_client.search_similar(
            collection_name="tutoring_sessions",
            query_vector=None,  # Not using similarity search here
            limit=1,
            filter_condition=filter_condition,
        )

        if embedding_results:
            embedding = embedding_results[0]
            session_embeddings.append(
                {
                    "id": str(session.id),
                    "topic_id": str(session.topic_id),
                    "embedding": embedding.get("embedding", []),
                    "label": f"{session.topic_name}: {session.initial_query[:50]}...",
                }
            )

    # If we don't have embeddings, use PCA to create 3D visualization from session data
    if not session_embeddings:
        # Fetch exchanges for these sessions
        exchanges_query = (
            select(
                TutoringExchange.session_id,
                TutoringExchange.student_input,
                TutoringExchange.ai_response,
            )
            .where(TutoringExchange.session_id.in_(session_ids))
            .order_by(TutoringExchange.sequence)
        )

        exchanges_result = await db.execute(exchanges_query)
        exchanges = exchanges_result.fetchall()

        # Group exchanges by session
        session_texts = {}
        for exchange in exchanges:
            session_id = str(exchange.session_id)
            if session_id not in session_texts:
                session_texts[session_id] = []

            # Extract text from student input and AI response
            student_text = exchange.student_input.get("text", "")
            ai_text = exchange.ai_response.get("text", "")

            if student_text:
                session_texts[session_id].append(student_text)
            if ai_text:
                session_texts[session_id].append(ai_text)

        # Use analytics engine to create embeddings and PCA projection
        visualization_data = await analytics_engine.generate_visualization(
            session_texts=session_texts,
            topic_map=topic_map,
            topic_colors=topic_colors,
            sessions=sessions,
        )

        return visualization_data

    # Use analytics engine to create PCA from embeddings
    visualization_data = await analytics_engine.process_embeddings(
        embeddings=session_embeddings, topic_map=topic_map, topic_colors=topic_colors
    )

    return visualization_data


@router.get("/export/{class_id}")
async def export_insights_report(
    class_id: int = Path(..., description="The ID of the class"),
    student_id: Optional[int] = Query(
        None, description="Filter by specific student ID"
    ),
    time_range: str = Query("30days", description="Time range for data"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export insights report as PDF
    """
    # Validate professor access
    access = await validate_professor_access(db, current_user.id, class_id)
    if not access:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this class"
        )

    # Get class details
    class_query = select(SchoolClass).where(SchoolClass.id == class_id)
    class_result = await db.execute(class_query)
    class_details = class_result.scalar_one_or_none()

    if not class_details:
        raise HTTPException(status_code=404, detail="Class not found")

    # Get student details if specified
    student_details = None
    if student_id:
        student_query = select(SchoolStudent).where(SchoolStudent.id == student_id)
        student_result = await db.execute(student_query)
        student_details = student_result.scalar_one_or_none()

        if not student_details:
            raise HTTPException(status_code=404, detail="Student not found")

    # Get activity data
    activity_data = await get_activity_data(
        class_id=class_id,
        student_id=student_id,
        time_range=time_range,
        current_user=current_user,
        db=db,
    )

    # Get subject activity
    subject_activity = await get_subject_activity(
        class_id=class_id,
        student_id=student_id,
        time_range=time_range,
        current_user=current_user,
        db=db,
    )

    # Get AI insights
    insights = await get_ai_insights(
        class_id=class_id,
        student_id=student_id,
        time_range=time_range,
        current_user=current_user,
        db=db,
    )

    # Use analytics engine to generate PDF report
    pdf_data = await analytics_engine.generate_pdf_report(
        class_details=class_details,
        student_details=student_details,
        activity_data=activity_data,
        subject_activity=subject_activity,
        insights=insights,
        time_range=time_range,
    )

    # Return the PDF as a downloadable file
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=insights-report-{class_id}-{student_id or 'all'}.pdf"
        },
    )
