from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from datetime import datetime, timedelta

from ..models.professor_analytics import (
    CoursePerformanceResponse,
    TopicPerformanceResponse,
    StudentActivityResponse,
    ProblemAreasResponse,
    LearningOutcomesResponse,
    StrengthsWeaknessesResponse,
    AIInsightsRequest,
    AIInsightsResponse,
    AnalyticsExportResponse,
)

from ...db.models.professor import ProfessorCourse
from ...db.models.school import (
    SchoolCourse,
    Assignment,
    AssignmentSubmission,
    CourseEnrollment,
)
from ...db.models.tutoring import DetailedTutoringSession
from ...db.postgresql import get_session

# from ...core.embeddings.course_embeddings import CourseEmbeddingsService
from ...utils.date_utils import parse_time_range
from src.api.endpoints.auth import get_professor_from_user

router = APIRouter(prefix="/professors/analytics", tags=["professor analytics"])


# Helper function to verify course access
async def verify_course_access(
    professor_id: int, course_id: int, session: AsyncSession
) -> bool:
    query = select(ProfessorCourse).where(
        ProfessorCourse.professor_id == professor_id,
        ProfessorCourse.course_id == course_id,
    )
    result = await session.execute(query)
    return result.scalar_one_or_none() is not None


@router.get("/course-performance", response_model=CoursePerformanceResponse)
async def get_course_performance(
    courseId: int = Query(..., description="Course ID"),
    timeRange: str = Query(..., description="Time range (week, month, semester, year)"),
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
):
    """Get overall performance metrics for a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Parse time range
    start_date, end_date = parse_time_range(timeRange)

    # Get the course
    course_query = select(SchoolCourse).where(SchoolCourse.id == courseId)
    course_result = await session.execute(course_query)
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get total enrolled students
    enrollment_query = (
        select(func.count())
        .select_from(CourseEnrollment)
        .where(
            CourseEnrollment.course_id == courseId,
            CourseEnrollment.status.in_(["enrolled", "completed"]),
        )
    )
    enrollment_result = await session.execute(enrollment_query)
    total_students = enrollment_result.scalar() or 0

    # Get average grade
    grade_query = select(func.avg(CourseEnrollment.grade)).where(
        CourseEnrollment.course_id == courseId, CourseEnrollment.grade.is_not(None)
    )
    grade_result = await session.execute(grade_query)
    avg_grade = grade_result.scalar() or 0

    # Get completion rate
    completion_query = (
        select(func.count())
        .select_from(CourseEnrollment)
        .where(
            CourseEnrollment.course_id == courseId,
            CourseEnrollment.status == "completed",
        )
    )
    completion_result = await session.execute(completion_query)
    completed_count = completion_result.scalar() or 0

    completion_rate = 0
    if total_students > 0:
        completion_rate = round((completed_count / total_students) * 100)

    # Calculate engagement score based on participation metrics
    submissions_query = (
        select(func.count())
        .select_from(AssignmentSubmission)
        .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id)
        .where(
            Assignment.course_id == courseId,
            AssignmentSubmission.submission_date.between(start_date, end_date),
        )
    )
    submissions_result = await session.execute(submissions_query)
    submission_count = submissions_result.scalar() or 0

    tutoring_query = (
        select(func.count())
        .select_from(DetailedTutoringSession)
        .where(
            DetailedTutoringSession.related_course_id == courseId,
            DetailedTutoringSession.start_time.between(start_date, end_date),
        )
    )
    tutoring_result = await session.execute(tutoring_query)
    tutoring_count = tutoring_result.scalar() or 0

    # Calculate an engagement score from 0-10
    engagement_score = 0
    if total_students > 0:
        # This is a simplified calculation - in production this would be more sophisticated
        avg_submissions_per_student = submission_count / total_students
        avg_tutoring_per_student = tutoring_count / total_students

        # Normalize to a 0-10 scale
        engagement_score = round(
            min(10, (avg_submissions_per_student * 2 + avg_tutoring_per_student * 3))
        )

    # Calculate difficulty rating from student feedback, submissions, etc.
    # For simplicity, we'll use a fixed rating here, but in production this would be calculated
    difficulty_rating = 7

    # Get AI-generated improvement suggestion
    # This would typically come from your AI analytics engine
    # For now, we'll use placeholder text
    ai_improvement = """Based on analysis of student performance data, this course could benefit from more interactive content, especially for topics covering abstract concepts. Consider adding 3-4 practical examples for each theoretical concept to improve engagement by approximately 27%. Additionally, the pacing of weeks 3-5 may be too rapid based on lower assessment scores during that period."""

    return [
        {
            "id": courseId,
            "title": course.title,
            "totalStudents": total_students,
            "averageGrade": round(avg_grade),
            "completionRate": completion_rate,
            "engagementScore": engagement_score,
            "difficultyRating": difficulty_rating,
            "aiGeneratedImprovement": ai_improvement,
        }
    ]


@router.get("/topic-performance", response_model=TopicPerformanceResponse)
async def get_topic_performance(
    courseId: int = Query(..., description="Course ID"),
    timeRange: str = Query(..., description="Time range (week, month, semester, year)"),
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
):
    """Get performance metrics broken down by topic for a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Get course topics
    # For a real implementation, you would join with a course_topics table
    # Here we'll use the syllabus field that contains topics
    course_query = select(SchoolCourse).where(SchoolCourse.id == courseId)
    course_result = await session.execute(course_query)
    course = course_result.scalar_one_or_none()

    if not course or not course.syllabus or "topics" not in course.syllabus:
        # Fallback to some default topics if not found in syllabus
        topics = [
            "Introduction",
            "Fundamentals",
            "Advanced Concepts",
            "Applications",
            "Case Studies",
        ]
    else:
        topics = course.syllabus.get("topics", [])

    # In a real implementation, you would query actual performance data per topic
    # Here we'll generate some sample data
    topic_data = []

    for i, topic in enumerate(topics):
        # These would be real metrics in production
        score = 65 + (i * 5) % 30  # Scores between 65-95
        difficulty = 4 + (i * 1.5) % 6  # Difficulty between 4-10
        engagement = 5 + (i * 2) % 5  # Engagement between 5-10
        time_spent = 20 + (i * 15) % 60  # Time between 20-80 minutes

        topic_data.append(
            {
                "topic": topic,
                "score": score,
                "difficulty": difficulty,
                "engagementLevel": engagement,
                "timeSpent": time_spent,
            }
        )

    return topic_data


@router.get("/student-activity", response_model=StudentActivityResponse)
async def get_student_activity(
    courseId: int = Query(..., description="Course ID"),
    timeRange: str = Query(..., description="Time range (week, month, semester, year)"),
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
):
    """Get student activity metrics over time for a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Parse time range
    start_date, end_date = parse_time_range(timeRange)

    # Calculate date intervals based on time range
    if timeRange == "week":
        interval = timedelta(days=1)
        format_string = "%Y-%m-%d"
    elif timeRange == "month":
        interval = timedelta(days=3)
        format_string = "%Y-%m-%d"
    elif timeRange == "semester":
        interval = timedelta(days=7)
        format_string = "%Y-%m-%d"
    else:  # year
        interval = timedelta(days=30)
        format_string = "%Y-%m"

    # Generate date points
    current_date = start_date
    date_points = []

    while current_date <= end_date:
        date_points.append(current_date)
        current_date += interval

    # In a real implementation, you would query the database for each date point
    # Here we'll generate sample data
    activity_data = []

    for i, date_point in enumerate(date_points):
        formatted_date = date_point.strftime(format_string)

        # These would be real metrics in production
        active_students = max(10, 30 + (i * 2) % 20)
        submissions = max(5, 20 + (i * 3) % 25)
        tutoring = max(2, 8 + (i * 1) % 12)

        activity_data.append(
            {
                "date": formatted_date,
                "activeStudents": active_students,
                "submissions": submissions,
                "tutoringSessions": tutoring,
            }
        )

    return activity_data


@router.get("/problem-areas", response_model=ProblemAreasResponse)
async def get_problem_areas(
    courseId: int = Query(..., description="Course ID"),
    timeRange: str = Query(..., description="Time range (week, month, semester, year)"),
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
    # analytics_engine: AnalyticsEngine = Depends(AnalyticsEngine),
):
    """Get identified problem areas in a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Parse time range
    start_date, end_date = parse_time_range(timeRange)

    # Get the course
    course_query = select(SchoolCourse).where(SchoolCourse.id == courseId)
    course_result = await session.execute(course_query)
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get total enrolled students for reference
    enrollment_query = (
        select(func.count())
        .select_from(CourseEnrollment)
        .where(
            CourseEnrollment.course_id == courseId,
            CourseEnrollment.status.in_(["enrolled", "completed"]),
        )
    )
    enrollment_result = await session.execute(enrollment_query)
    total_students = enrollment_result.scalar() or 0

    # In a production environment, use the analytics engine to identify problems
    # analytics_engine.identify_problems(courseId, start_date, end_date)

    # For now, we'll return sample data
    problem_areas = [
        {
            "id": 1,
            "title": "Low completion rate for assignments in Module 3",
            "category": "Content",
            "affectedStudents": round(total_students * 0.65),
            "severity": "high",
            "suggestedAction": "Simplify instructions for assignments 3.2 and 3.4, and provide more examples related to the core concepts.",
        },
        {
            "id": 2,
            "title": "Weak understanding of concept: Matrix Transformations",
            "category": "Understanding",
            "affectedStudents": round(total_students * 0.42),
            "severity": "medium",
            "suggestedAction": "Develop additional visual aids and interactive exercises to illustrate matrix transformations in 3D space.",
        },
        {
            "id": 3,
            "title": "Low engagement with supplementary materials",
            "category": "Engagement",
            "affectedStudents": round(total_students * 0.78),
            "severity": "medium",
            "suggestedAction": "Integrate supplementary materials more closely with graded tasks. Create short follow-up quizzes based on supplementary content.",
        },
        {
            "id": 4,
            "title": "Confusion between similar concepts: Recursion vs. Iteration",
            "category": "Understanding",
            "affectedStudents": round(total_students * 0.31),
            "severity": "low",
            "suggestedAction": "Create a side-by-side comparison chart and code demonstrations highlighting the key differences between recursion and iteration.",
        },
    ]

    return problem_areas


@router.get("/learning-outcomes", response_model=LearningOutcomesResponse)
async def get_learning_outcomes(
    courseId: int = Query(..., description="Course ID"),
    timeRange: str = Query(..., description="Time range (week, month, semester, year)"),
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
):
    """Get learning outcomes and achievement metrics for a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Get the course
    course_query = select(SchoolCourse).where(SchoolCourse.id == courseId)
    course_result = await session.execute(course_query)
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get learning objectives from course
    if course.learning_objectives and len(course.learning_objectives) > 0:
        objectives = course.learning_objectives
    else:
        # Fallback to sample learning objectives
        objectives = [
            "Understand core theoretical principles",
            "Apply concepts to solve real-world problems",
            "Analyze and interpret results effectively",
            "Evaluate and critique different approaches",
            "Create original solutions to complex problems",
            "Communicate findings clearly and effectively",
            "Collaborate in team settings productively",
        ]

    # In a real implementation, query actual achievement data
    # Here we'll generate sample data
    outcomes = []

    for i, objective in enumerate(objectives):
        # Generate sample achievement rates
        achievement = max(50, min(95, 75 + (i * 7) % 30))
        target = min(95, max(achievement + 10, 80))

        outcomes.append(
            {
                "id": f"outcome-{i+1}",
                "name": objective,
                "achievementRate": achievement,
                "targetRate": target,
            }
        )

    return outcomes


@router.get("/strengths-weaknesses", response_model=StrengthsWeaknessesResponse)
async def get_strengths_weaknesses(
    courseId: int = Query(..., description="Course ID"),
    timeRange: str = Query(..., description="Time range (week, month, semester, year)"),
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
):
    """Get identified strengths and weaknesses for a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Get total enrolled students for reference
    enrollment_query = (
        select(func.count())
        .select_from(CourseEnrollment)
        .where(
            CourseEnrollment.course_id == courseId,
            CourseEnrollment.status.in_(["enrolled", "completed"]),
        )
    )
    enrollment_result = await session.execute(enrollment_query)
    total_students = enrollment_result.scalar() or 0

    # In a real implementation, use analytics to identify strengths/weaknesses
    # Here we'll use sample data
    strengths_weaknesses = [
        {
            "strength": True,
            "topic": "Practical Exercises",
            "details": "Hands-on exercises show excellent engagement and high completion rates.",
            "students": round(total_students * 0.85),
            "impact": 28,
        },
        {
            "strength": True,
            "topic": "Video Content",
            "details": "Video tutorials have high view rates and positive feedback in surveys.",
            "students": round(total_students * 0.72),
            "impact": 19,
        },
        {
            "strength": True,
            "topic": "Discussion Activities",
            "details": "Group discussions show high participation and assist understanding of complex topics.",
            "students": round(total_students * 0.68),
            "impact": 15,
        },
        {
            "strength": False,
            "topic": "Abstract Concepts",
            "details": "Theoretical content without practical application shows lower retention.",
            "students": round(total_students * 0.56),
            "impact": 23,
        },
        {
            "strength": False,
            "topic": "Assignment Length",
            "details": "Longer assignments (>45 min) show significantly lower completion rates.",
            "students": round(total_students * 0.65),
            "impact": 18,
        },
        {
            "strength": False,
            "topic": "Technical Terminology",
            "details": "Assessments with heavy use of technical jargon show lower performance.",
            "students": round(total_students * 0.42),
            "impact": 14,
        },
    ]

    return strengths_weaknesses


@router.post("/generate-insights", response_model=AIInsightsResponse)
async def generate_ai_insights(
    request: AIInsightsRequest,
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
):
    """Generate AI-powered insights for a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, request.courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Get the course
    course_query = select(SchoolCourse).where(SchoolCourse.id == request.courseId)
    course_result = await session.execute(course_query)
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # In a production environment, use the AI engine to generate insights
    # This would involve:
    # 1. Fetching relevant data (submissions, grades, engagement metrics)
    # 2. Using embeddings to analyze content and student interactions
    # 3. Running analytics models to identify patterns and opportunities

    # course_data = await analytics_engine.gather_course_data(request.courseId)
    # embeddings = await embeddings_service.get_course_embeddings(request.courseId)
    # insights = await analytics_engine.generate_ai_insights(course_data, embeddings)

    # For now, return sample insights
    return {
        "problemAreas": [
            {
                "id": 101,
                "title": "Conceptual gap in prerequisite knowledge",
                "category": "Foundation",
                "affectedStudents": 18,
                "severity": "high",
                "suggestedAction": "Develop a 30-minute preparatory module covering the essential concepts students should understand before tackling the main content. Include a diagnostic quiz to help students self-assess their readiness.",
            },
            {
                "id": 102,
                "title": "Misalignment between lectures and assessments",
                "category": "Content Structure",
                "affectedStudents": 23,
                "severity": "medium",
                "suggestedAction": "Review assessment questions for weeks 4-6 and ensure they directly map to learning objectives covered in lectures. Add more formative assessments that scaffold toward summative assessments.",
            },
        ],
        "topicSuggestions": [
            {
                "topic": "Fundamentals",
                "improvement": "Add more visual diagrams demonstrating the relationships between core concepts. Students who utilized the existing diagram showed 34% better performance on related questions.",
            },
            {
                "topic": "Advanced Concepts",
                "improvement": "Consider breaking this section into smaller modules with checkpoint assessments. Data shows students are spending 2.7x longer on this section than others, suggesting cognitive overload.",
            },
            {
                "topic": "Applications",
                "improvement": "Provide more real-world examples from different industries. Students reported higher engagement with content that connected theoretical concepts to practical scenarios.",
            },
        ],
        "engagementRecommendations": [
            "Introduce peer review activities for major assignments. Courses with similar content that implemented peer review saw a 28% increase in content engagement.",
            "Add short (3-5 minute) reflection prompts after each major learning segment. This active learning technique has shown to improve retention by 22% in similar courses.",
        ],
    }


@router.get("/export", response_model=AnalyticsExportResponse)
async def export_analytics(
    courseId: int = Query(..., description="Course ID"),
    timeRange: str = Query(..., description="Time range (week, month, semester, year)"),
    professor=Depends(get_professor_from_user),
    session: AsyncSession = Depends(get_session),
):
    """Export analytics data for a course"""
    # Verify professor has access to this course
    has_access = await verify_course_access(professor.id, courseId, session)
    if not has_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # In a real implementation, you would:
    # 1. Gather all necessary data for the course
    # 2. Format it appropriately for export (CSV, Excel, etc.)
    # 3. Generate a download URL or file

    # For now, return a sample response
    return {
        "downloadUrl": f"/api/v1/downloads/analytics-export-{courseId}-{timeRange}.csv",
        "format": "csv",
        "generatedAt": datetime.utcnow().isoformat(),
    }
