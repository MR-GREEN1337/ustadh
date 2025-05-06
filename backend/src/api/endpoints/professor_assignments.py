from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, or_, func
from datetime import datetime, timedelta, timezone
import uuid

from src.db.postgresql import get_session
from src.core.llm import LLM, Message, LLMConfig
from src.api.endpoints.professor_ai import get_current_professor

from src.db.models.user import User
from src.db.models.school import (
    Assignment,
    AssignmentSubmission,
    SchoolCourse,
    SchoolClass,
    SchoolStaff,
    SchoolStudent,
    CourseEnrollment,
    ClassEnrollment,
)
from src.db.models.professor import SchoolProfessor, ProfessorCourse
from src.db.models.user import UserFile
from src.db.models import (
    ProfessorClassCourses,
    ClassSchedule,
)

from src.api.models.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentsResponse,
    QuizCreate,
    SubmissionsResponse,
    GradeSubmissionRequest,
    BulkGradeRequest,
    AIGenerateRequest,
    AIGenerateResponse,
    AssignmentDetailResponse,
    AssignmentSubmissionResponse,
    AssignmentStatsResponse,
    GradingCriteriaItem,
    AIImprovementRequest,
    AIAnalysisResponse,
    AICustomPromptRequest,
    AICustomPromptResponse,
)

router = APIRouter(prefix="/professor/assignments", tags=["professor_assignments"])


@router.get("", response_model=AssignmentsResponse)
async def get_professor_assignments(
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    assignment_type: Optional[str] = Query(
        None, description="Filter by assignment type"
    ),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by title or description"),
    page: int = Query(1, description="Page number"),
    limit: int = Query(20, description="Items per page"),
    sort_by: str = Query("due_date", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order (asc or desc)"),
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Get assignments created by the professor with optional filtering"""
    # Get professor record
    professor: SchoolProfessor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user[0].id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Base query
    query = (
        select(Assignment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .where(Assignment.professor_id == professor.id)
    )

    # Apply filters
    if course_id:
        query = query.where(Assignment.course_id == course_id)

    if assignment_type:
        query = query.where(Assignment.assignment_type == assignment_type)

    if status:
        if status == "published":
            query = query.where(Assignment.is_published)
        elif status == "draft":
            query = query.where(not Assignment.is_published)
        elif status == "closed":
            query = query.where(
                Assignment.is_published, Assignment.due_date < datetime.utcnow()
            )
        elif status == "grading":
            # Assignments with submissions that need grading
            grading_subquery = (
                select(AssignmentSubmission.assignment_id)
                .where(AssignmentSubmission.status == "submitted")
                .group_by(AssignmentSubmission.assignment_id)
            )
            query = query.where(Assignment.id.in_(grading_subquery))

    if search:
        search_filter = or_(
            Assignment.title.contains(search), Assignment.description.contains(search)
        )
        query = query.where(search_filter)

    # Count total for pagination
    count_query = select(func.count(Assignment.id)).select_from(
        query.with_only_columns(Assignment.id).subquery()
    )
    total = (await session.execute(count_query)).scalar_one()

    # Apply sorting
    if sort_by == "title":
        query = query.order_by(
            Assignment.title.asc() if sort_order == "asc" else Assignment.title.desc()
        )
    elif sort_by == "due_date":
        query = query.order_by(
            Assignment.due_date.asc()
            if sort_order == "asc"
            else Assignment.due_date.desc()
        )
    elif sort_by == "created_at":
        query = query.order_by(
            Assignment.created_at.asc()
            if sort_order == "asc"
            else Assignment.created_at.desc()
        )
    else:
        # Default sorting
        query = query.order_by(Assignment.due_date.desc())

    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    result = await session.execute(query)
    assignments_with_courses: List[tuple[Assignment, SchoolCourse]] = result.all()

    # Transform to response model
    result_assignments = []
    for assignment, course in assignments_with_courses:
        # Get submission stats
        submissions_count = (
            await session.execute(
                select(func.count()).where(
                    AssignmentSubmission.assignment_id == assignment.id
                )
            )
        ).scalar_one()

        graded_count = (
            await session.execute(
                select(func.count()).where(
                    AssignmentSubmission.assignment_id == assignment.id,
                    AssignmentSubmission.status == "graded",
                )
            )
        ).scalar_one()

        # Calculate average grade if there are graded submissions
        average_grade = None
        if graded_count > 0:
            avg_query = select(func.avg(AssignmentSubmission.grade)).where(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.status == "graded",
            )
            average_grade = (await session.execute(avg_query)).scalar_one()

        # Determine status
        status = "published" if assignment.is_published else "draft"
        if assignment.is_published and assignment.due_date < datetime.utcnow():
            status = "closed"
        elif assignment.is_published and submissions_count > graded_count:
            status = "grading"

        result_assignments.append(
            {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "course_id": assignment.course_id,
                "course_name": course.title,
                "assignment_type": assignment.assignment_type,
                "due_date": assignment.due_date.isoformat(),
                "points_possible": assignment.points_possible,
                "status": status,
                "created_at": assignment.created_at.isoformat(),
                "updated_at": assignment.updated_at.isoformat()
                if assignment.updated_at
                else None,
                "instructions": assignment.instructions,
                "materials": assignment.materials or [],
                "submission_count": submissions_count,
                "graded_count": graded_count,
                "average_grade": float(average_grade)
                if average_grade is not None
                else None,
            }
        )

    return {
        "assignments": result_assignments,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Create a new assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Verify course exists and professor has access
    course = (
        await session.execute(
            select(SchoolCourse).where(SchoolCourse.id == assignment_data.course_id)
        )
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if professor teaches this course
    teaches_course = (
        await session.execute(
            select(ProfessorCourse).where(
                ProfessorCourse.professor_id == professor.id,
                ProfessorCourse.course_id == course.id,
            )
        )
    ).first() is not None

    if not teaches_course:
        raise HTTPException(
            status_code=403, detail="Professor does not teach this course"
        )

    # Create new assignment
    new_assignment = Assignment(
        professor_id=professor.id,
        course_id=assignment_data.course_id,
        title=assignment_data.title,
        description=assignment_data.description,
        assignment_type=assignment_data.assignment_type,
        assigned_date=datetime.utcnow(),
        due_date=datetime.fromisoformat(assignment_data.due_date),
        points_possible=assignment_data.points_possible,
        instructions=assignment_data.instructions,
        is_published=assignment_data.status == "published"
        if assignment_data.status
        else False,
        grading_criteria=assignment_data.grading_criteria,
        materials=[]
        if not assignment_data.material_ids
        else [{"id": material_id} for material_id in assignment_data.material_ids],
    )

    await session.add(new_assignment)
    await session.commit()
    await session.refresh(new_assignment)

    # Handle class assignments
    if assignment_data.class_ids:
        # Get all student IDs enrolled in these classes and this course
        for class_id in assignment_data.class_ids:
            # Verify class exists
            school_class = (
                await session.execute(
                    select(SchoolClass).where(SchoolClass.id == class_id)
                )
            ).first()
            if not school_class:
                continue

            # Get students enrolled in this class and course
            enrolled_students = (
                await session.execute(
                    select(SchoolStudent)
                    .join(
                        ClassEnrollment, ClassEnrollment.student_id == SchoolStudent.id
                    )
                    .join(
                        CourseEnrollment,
                        CourseEnrollment.student_id == SchoolStudent.id,
                    )
                    .where(
                        ClassEnrollment.class_id == class_id,
                        CourseEnrollment.course_id == course.id,
                        ClassEnrollment.status == "active",
                        CourseEnrollment.status == "enrolled",
                    )
                )
            ).all()

            # Create notification for each student - would be implemented with a notification system
            for student in enrolled_students:
                pass

    # Return the created assignment
    return {
        "assignment": {
            "id": new_assignment.id,
            "title": new_assignment.title,
            "description": new_assignment.description,
            "course_id": new_assignment.course_id,
            "course_name": course.title,
            "assignment_type": new_assignment.assignment_type,
            "due_date": new_assignment.due_date.isoformat(),
            "points_possible": new_assignment.points_possible,
            "status": "published" if new_assignment.is_published else "draft",
            "created_at": new_assignment.created_at.isoformat(),
            "updated_at": new_assignment.updated_at.isoformat()
            if new_assignment.updated_at
            else None,
            "instructions": new_assignment.instructions,
            "materials": new_assignment.materials or [],
            "submission_count": 0,
            "graded_count": 0,
            "average_grade": None,
        }
    }


@router.post("/quiz", response_model=AssignmentResponse)
async def create_quiz(
    quiz_data: QuizCreate,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Create a new quiz assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Verify course exists and professor has access
    course = (
        await session.execute(
            select(SchoolCourse).where(SchoolCourse.id == quiz_data.course_id)
        )
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if professor teaches this course
    teaches_course = (
        await session.execute(
            select(ProfessorCourse).where(
                ProfessorCourse.professor_id == professor.id,
                ProfessorCourse.course_id == course.id,
            )
        )
    ).first() is not None

    if not teaches_course:
        raise HTTPException(
            status_code=403, detail="Professor does not teach this course"
        )

    # Create new quiz assignment
    new_assignment = Assignment(
        professor_id=professor.id,
        course_id=quiz_data.course_id,
        title=quiz_data.title,
        description=quiz_data.description,
        assignment_type="quiz",
        assigned_date=datetime.utcnow(),
        due_date=datetime.fromisoformat(quiz_data.due_date),
        points_possible=quiz_data.points_possible,
        instructions=quiz_data.instructions,
        is_published=quiz_data.status == "published" if quiz_data.status else False,
        # Store quiz-specific configuration
        content={
            "questions": [q.dict() for q in quiz_data.questions],
            "time_limit": quiz_data.time_limit,
            "allow_multiple_attempts": quiz_data.allow_multiple_attempts,
            "max_attempts": quiz_data.max_attempts,
            "shuffle_questions": quiz_data.shuffle_questions,
            "show_correct_answers": quiz_data.show_correct_answers,
            "passing_score": quiz_data.passing_score,
        },
    )

    await session.add(new_assignment)
    await session.commit()
    await session.refresh(new_assignment)

    # Handle class assignments similar to regular assignments
    if quiz_data.class_ids:
        # Implementation would be similar to the create_assignment endpoint
        pass

    # Return the created quiz assignment
    return {
        "assignment": {
            "id": new_assignment.id,
            "title": new_assignment.title,
            "description": new_assignment.description,
            "course_id": new_assignment.course_id,
            "course_name": course.title,
            "assignment_type": "quiz",
            "due_date": new_assignment.due_date.isoformat(),
            "points_possible": new_assignment.points_possible,
            "status": "published" if new_assignment.is_published else "draft",
            "created_at": new_assignment.created_at.isoformat(),
            "updated_at": new_assignment.updated_at.isoformat()
            if new_assignment.updated_at
            else None,
            "instructions": new_assignment.instructions,
            "materials": new_assignment.materials or [],
            "submission_count": 0,
            "graded_count": 0,
            "average_grade": None,
            "content": new_assignment.content,
        }
    }


@router.get("/{assignment_id}", response_model=AssignmentDetailResponse)
async def get_assignment(
    assignment_id: int,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific assignment by ID"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment with course
    query = (
        select(Assignment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .where(Assignment.id == assignment_id)
    )
    result = (await session.execute(query)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment: Assignment = result[0]
    course: SchoolCourse = result[1]

    # Check if professor created this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        course_access: ProfessorCourse = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == course.id,
                )
            )
        ).first()

        if not course_access:
            raise HTTPException(
                status_code=403, detail="Not authorized to access this assignment"
            )

    # Get class IDs assigned to this assignment (implementation would depend on how this is stored)
    class_ids = []

    # Get submission stats
    submissions_count = (
        await session.execute(
            select(func.count()).where(
                AssignmentSubmission.assignment_id == assignment.id
            )
        )
    ).one()

    graded_count = (
        await session.execute(
            select(func.count()).where(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.status == "graded",
            )
        )
    ).one()

    # Calculate average grade if there are graded submissions
    average_grade = None
    if graded_count > 0:
        avg_query = select(func.avg(AssignmentSubmission.grade)).where(
            AssignmentSubmission.assignment_id == assignment.id,
            AssignmentSubmission.status == "graded",
        )
        average_grade = (await session.execute(avg_query)).one()

    # Get materials info if there are any
    materials = []
    if assignment.materials:
        for material_info in assignment.materials:
            if "id" in material_info:
                material_id = material_info["id"]
                file: UserFile = (
                    await session.execute(
                        select(UserFile).where(UserFile.id == material_id)
                    )
                ).first()

                if file:
                    materials.append(
                        {
                            "id": file.id,
                            "file_name": file.file_name,
                            "file_type": file.file_type,
                            "file_url": file.file_url,
                            "size": file.file_size,
                            "uploaded_at": file.created_at.isoformat(),
                        }
                    )

    # Determine status
    status = "published" if assignment.is_published else "draft"
    if assignment.is_published and assignment.due_date < datetime.utcnow():
        status = "closed"
    elif assignment.is_published and submissions_count > graded_count:
        status = "grading"

    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "course_id": assignment.course_id,
        "course_name": course.title,
        "assignment_type": assignment.assignment_type,
        "due_date": assignment.due_date.isoformat(),
        "points_possible": assignment.points_possible,
        "status": status,
        "created_at": assignment.created_at.isoformat(),
        "updated_at": assignment.updated_at.isoformat()
        if assignment.updated_at
        else None,
        "instructions": assignment.instructions,
        "materials": materials,
        "grading_criteria": assignment.grading_criteria,
        "class_ids": class_ids,
        "submission_count": submissions_count,
        "graded_count": graded_count,
        "average_grade": float(average_grade) if average_grade is not None else None,
        "content": assignment.content if assignment.content else None,
    }


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    update_data: AssignmentUpdate,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Update an existing assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment
    query = (
        select(Assignment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .where(Assignment.id == assignment_id)
    )
    result = (await session.execute(query)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment, course = result

    # Check if professor created this assignment
    if assignment.professor_id != professor.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this assignment"
        )

    # Don't allow changing the course or type after creation
    update_dict = update_data.dict(exclude_unset=True)
    if "course_id" in update_dict:
        del update_dict["course_id"]
    if "assignment_type" in update_dict:
        del update_dict["assignment_type"]

    # Handle due date conversion
    if "due_date" in update_dict:
        update_dict["due_date"] = datetime.fromisoformat(update_dict["due_date"])

    # Handle status change
    if "status" in update_dict:
        update_dict["is_published"] = update_dict["status"] == "published"
        del update_dict["status"]

    # Handle material IDs
    if "material_ids" in update_dict:
        update_dict["materials"] = [
            {"id": material_id} for material_id in update_dict["material_ids"]
        ]
        del update_dict["material_ids"]

    # Update assignment
    for key, value in update_dict.items():
        setattr(assignment, key, value)

    # Set updated timestamp
    assignment.updated_at = datetime.now(timezone.utc)

    await session.add(assignment)
    await session.commit()
    await session.refresh(assignment)

    # Get submission stats
    submissions_count = (
        await session.execute(
            select(func.count()).where(
                AssignmentSubmission.assignment_id == assignment.id
            )
        )
    ).one()

    graded_count = (
        await session.execute(
            select(func.count()).where(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.status == "graded",
            )
        )
    ).one()

    # Calculate average grade if there are graded submissions
    average_grade = None
    if graded_count > 0:
        avg_query = select(func.avg(AssignmentSubmission.grade)).where(
            AssignmentSubmission.assignment_id == assignment.id,
            AssignmentSubmission.status == "graded",
        )
        average_grade = (await session.execute(avg_query)).one()

    # Determine status for response
    status = "published" if assignment.is_published else "draft"
    if assignment.is_published and assignment.due_date < datetime.utcnow():
        status = "closed"
    elif assignment.is_published and submissions_count > graded_count:
        status = "grading"

    return {
        "assignment": {
            "id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "course_id": assignment.course_id,
            "course_name": course.title,
            "assignment_type": assignment.assignment_type,
            "due_date": assignment.due_date.isoformat(),
            "points_possible": assignment.points_possible,
            "status": status,
            "created_at": assignment.created_at.isoformat(),
            "updated_at": assignment.updated_at.isoformat()
            if assignment.updated_at
            else None,
            "instructions": assignment.instructions,
            "materials": assignment.materials or [],
            "submission_count": submissions_count,
            "graded_count": graded_count,
            "average_grade": float(average_grade)
            if average_grade is not None
            else None,
            "content": assignment.content if assignment.content else None,
        }
    }


@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Delete an assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment
    assignment = (
        await session.execute(select(Assignment).where(Assignment.id == assignment_id))
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if professor created this assignment
    if assignment.professor_id != professor.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this assignment"
        )

    # Check if there are submissions
    submissions_count = (
        await session.execute(
            select(func.count()).where(
                AssignmentSubmission.assignment_id == assignment.id
            )
        )
    ).one()

    if submissions_count > 0:
        # Set as archived instead of deleting
        assignment.is_archived = True
        assignment.updated_at = datetime.utcnow()
        session.add(assignment)
        session.commit()

        return {
            "success": True,
            "message": "Assignment archived because it has submissions",
        }
    else:
        # No submissions, can safely delete
        session.delete(assignment)
        session.commit()

        return {"success": True, "message": "Assignment deleted successfully"}


@router.post("/{assignment_id}/publish")
async def publish_assignment(
    assignment_id: int,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Publish an assignment (change from draft to published)"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment
    assignment: Assignment = (
        await session.execute(select(Assignment).where(Assignment.id == assignment_id))
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if professor created this assignment
    if assignment.professor_id != professor.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to publish this assignment"
        )

    # Check if already published
    if assignment.is_published:
        return {"success": True, "message": "Assignment is already published"}

    # Publish assignment
    assignment.is_published = True
    assignment.updated_at = datetime.utcnow()
    session.add(assignment)
    session.commit()

    # Send notifications to students
    # Get course
    course: SchoolCourse = (
        await session.execute(
            select(SchoolCourse).where(SchoolCourse.id == assignment.course_id)
        )
    ).first()
    if course:
        # Get enrollments
        enrolled_students = (
            await session.execute(
                select(SchoolStudent)
                .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
                .where(
                    CourseEnrollment.course_id == course.id,
                    CourseEnrollment.status == "enrolled",
                )
            )
        ).all()

        # Create notification for each student
        for student in enrolled_students:
            # Add notification logic here
            pass

    return {
        "success": True,
        "message": "Assignment published successfully",
        "assignment_id": assignment.id,
        "title": assignment.title,
        "due_date": assignment.due_date.isoformat(),
    }


@router.post("/{assignment_id}/clone", response_model=AssignmentResponse)
async def clone_assignment(
    assignment_id: int,
    data: Dict[str, Any] = Body(...),
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Clone an existing assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get original assignment
    query = (
        select(Assignment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .where(Assignment.id == assignment_id)
    )
    result = (await session.execute(query)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")

    original: Assignment = result[0]
    course: SchoolCourse = result[1]

    # Check if professor created this assignment
    if original.professor_id != professor.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to clone this assignment"
        )

    # Create new due date if provided, otherwise use the original plus one week
    if "new_due_date" in data and data["new_due_date"]:
        due_date = datetime.fromisoformat(data["new_due_date"])
    else:
        due_date = original.due_date + timedelta(days=7)

    # Create new assignment as a clone
    new_assignment = Assignment(
        professor_id=professor.id,
        course_id=original.course_id,
        title=f"{original.title} (Copy)",
        description=original.description,
        assignment_type=original.assignment_type,
        assigned_date=datetime.utcnow(),
        due_date=due_date,
        points_possible=original.points_possible,
        instructions=original.instructions,
        is_published=False,  # Always start as draft
        grading_criteria=original.grading_criteria,
        materials=original.materials,
        content=original.content,
    )

    await session.add(new_assignment)
    await session.commit()
    await session.refresh(new_assignment)

    return {
        "assignment": {
            "id": new_assignment.id,
            "title": new_assignment.title,
            "description": new_assignment.description,
            "course_id": new_assignment.course_id,
            "course_name": course.title,
            "assignment_type": new_assignment.assignment_type,
            "due_date": new_assignment.due_date.isoformat(),
            "points_possible": new_assignment.points_possible,
            "status": "draft",
            "created_at": new_assignment.created_at.isoformat(),
            "updated_at": new_assignment.updated_at.isoformat()
            if new_assignment.updated_at
            else None,
            "instructions": new_assignment.instructions,
            "materials": new_assignment.materials or [],
            "submission_count": 0,
            "graded_count": 0,
            "average_grade": None,
            "content": new_assignment.content if new_assignment.content else None,
        }
    }


@router.get("/{assignment_id}/submissions", response_model=SubmissionsResponse)
async def get_submissions(
    assignment_id: int,
    status: Optional[str] = Query(None, description="Filter by submission status"),
    page: int = Query(1, description="Page number"),
    limit: int = Query(20, description="Items per page"),
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Get submissions for an assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment
    assignment = (
        await session.execute(select(Assignment).where(Assignment.id == assignment_id))
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if professor created this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course (co-teacher)
        teaches_course = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == assignment.course_id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view submissions for this assignment",
            )

    # Base query joining student information
    query = (
        select(AssignmentSubmission, SchoolStudent, User)
        .join(SchoolStudent, SchoolStudent.id == AssignmentSubmission.student_id)
        .join(User, User.id == SchoolStudent.user_id)
        .where(AssignmentSubmission.assignment_id == assignment_id)
    )

    # Apply status filter if provided
    if status:
        query = query.where(AssignmentSubmission.status == status)

    # Count total for pagination
    count_query = select(func.count()).select_from(
        query.with_only_columns(AssignmentSubmission.id).subquery()
    )
    total = (await session.execute(count_query)).one()

    # Apply sorting (newest first) and pagination
    query = query.order_by(AssignmentSubmission.submission_date.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    result = (await session.execute(query)).all()
    submission_results = result.all()

    # Format submissions for response
    submissions = []
    for submission, student, user in submission_results:
        # Get attachments info if any
        attachments = []
        if submission.content and "attachments" in submission.content:
            for attachment_info in submission.content["attachments"]:
                if "id" in attachment_info:
                    file_id = attachment_info["id"]
                    file = (
                        await session.execute(
                            select(UserFile).where(UserFile.id == file_id)
                        )
                    ).first()

                    if file:
                        attachments.append(
                            {
                                "id": file.id,
                                "fileName": file.file_name,
                                "fileType": file.file_type,
                                "fileUrl": file.file_url,
                                "size": file.file_size,
                                "uploadedAt": file.created_at.isoformat(),
                            }
                        )

        # Add submission to response
        submissions.append(
            {
                "id": submission.id,
                "assignment_id": submission.assignment_id,
                "student_id": submission.student_id,
                "student_name": user.full_name,
                "student_id_code": student.student_id,
                "submission_date": submission.submission_date.isoformat(),
                "status": submission.status,
                "grade": submission.grade,
                "feedback": submission.feedback,
                "attachments": attachments,
                "graded_at": submission.graded_at.isoformat()
                if submission.graded_at
                else None,
                "graded_by": submission.graded_by,
            }
        )

    return {"submissions": submissions, "total": total, "page": page, "limit": limit}


@router.get(
    "/{assignment_id}/submissions/{submission_id}",
    response_model=AssignmentSubmissionResponse,
)
async def get_submission_detail(
    assignment_id: int,
    submission_id: int,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Get details of a specific submission"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment
    assignment: Assignment = (
        await session.execute(select(Assignment).where(Assignment.id == assignment_id))
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if professor has access to this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        teaches_course = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == assignment.course_id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403, detail="Not authorized to view this submission"
            )

    # Get submission with student and user info
    query = (
        select(AssignmentSubmission, SchoolStudent, User)
        .join(SchoolStudent, SchoolStudent.id == AssignmentSubmission.student_id)
        .join(User, User.id == SchoolStudent.user_id)
        .where(
            AssignmentSubmission.id == submission_id,
            AssignmentSubmission.assignment_id == assignment_id,
        )
    )
    result = (await session.execute(query)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission: AssignmentSubmission = result[0]
    student: SchoolStudent = result[1]
    user: User = result[2]

    # Get attachments info if any
    attachments = []
    if submission.content and "attachments" in submission.content:
        for attachment_info in submission.content["attachments"]:
            if "id" in attachment_info:
                file_id = attachment_info["id"]
                file: UserFile = (
                    await session.execute(
                        select(UserFile).where(UserFile.id == file_id)
                    )
                ).first()

                if file:
                    attachments.append(
                        {
                            "id": file.id,
                            "fileName": file.file_name,
                            "fileType": file.file_type,
                            "fileUrl": file.file_url,
                            "size": file.file_size,
                            "uploadedAt": file.created_at.isoformat(),
                            "thumbnailUrl": file.thumbnail_url,
                        }
                    )

    # Get grader info if available
    grader_name = None
    if submission.graded_by:
        grader_staff: SchoolStaff = (
            await session.execute(
                select(SchoolStaff).where(SchoolStaff.id == submission.graded_by)
            )
        ).first()
        if grader_staff:
            grader_user: User = (
                await session.execute(
                    select(User).where(User.id == grader_staff.user_id)
                )
            ).first()
            if grader_user:
                grader_name = grader_user.full_name

    # Get criteria grades if available
    criteria_grades = []
    if submission.content and "criteria_grades" in submission.content:
        criteria_grades = submission.content["criteria_grades"]

    # Format submission content for response
    content = {}
    if submission.content:
        # Remove attachments and criteria_grades which are handled separately
        content = {
            k: v
            for k, v in submission.content.items()
            if k not in ["attachments", "criteria_grades"]
        }

    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "student": {
            "id": student.id,
            "user_id": student.user_id,
            "full_name": user.full_name,
            "student_id": student.student_id,
            "education_level": student.education_level,
            "academic_track": student.academic_track,
        },
        "submission_date": submission.submission_date.isoformat(),
        "status": submission.status,
        "grade": submission.grade,
        "feedback": submission.feedback,
        "attachments": attachments,
        "content": content,
        "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
        "graded_by": submission.graded_by,
        "grader_name": grader_name,
        "criteria_grades": criteria_grades,
    }


@router.post("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: int,
    grade_data: GradeSubmissionRequest,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Grade a student submission"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get submission
    submission: AssignmentSubmission = (
        await session.execute(
            select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id)
        )
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Get assignment
    assignment: Assignment = (
        await session.execute(
            select(Assignment).where(Assignment.id == submission.assignment_id)
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if professor has access to grade this submission
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        teaches_course: ProfessorCourse = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == assignment.course_id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403, detail="Not authorized to grade this submission"
            )

    # Ensure grade doesn't exceed possible points
    if grade_data.grade > assignment.points_possible:
        raise HTTPException(
            status_code=400,
            detail=f"Grade cannot exceed maximum points ({assignment.points_possible})",
        )

    # Update submission with grade and feedback
    submission.grade = grade_data.grade
    submission.feedback = grade_data.feedback
    submission.status = "graded"
    submission.graded_by = professor.id
    submission.graded_at = datetime.utcnow()

    # Store criteria grades if provided
    if grade_data.criteria_grades:
        if not submission.content:
            submission.content = {}

        submission.content["criteria_grades"] = grade_data.criteria_grades

    session.add(submission)
    session.commit()

    # Get student info for notification and response
    student: SchoolStudent = (
        await session.execute(
            select(SchoolStudent).where(SchoolStudent.id == submission.student_id)
        )
    ).first()
    user: User = (
        await session.execute(select(User).where(User.id == student.user_id))
    ).first()

    # Send notification to student
    # Implementation would depend on notification system

    return {
        "success": True,
        "message": "Submission graded successfully",
        "submission_id": submission.id,
        "grade": submission.grade,
        "student_name": user.full_name if user else f"Student {submission.student_id}",
        "graded_at": submission.graded_at.isoformat(),
    }


@router.post("/submissions/bulk-grade")
async def bulk_grade_submissions(
    bulk_grade_data: BulkGradeRequest,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Bulk grade multiple submissions with the same grade and feedback"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    if not bulk_grade_data.submission_ids:
        raise HTTPException(status_code=400, detail="No submission IDs provided")

    processed = 0
    failed = 0
    failures = {}

    # Track unique assignments for later recalculation of stats
    affected_assignments = set()

    for submission_id in bulk_grade_data.submission_ids:
        try:
            # Get submission
            submission: AssignmentSubmission = (
                await session.execute(
                    select(AssignmentSubmission).where(
                        AssignmentSubmission.id == submission_id
                    )
                )
            ).first()
            if not submission:
                failed += 1
                failures[str(submission_id)] = "Submission not found"
                continue

            # Get assignment
            assignment: Assignment = (
                await session.execute(
                    select(Assignment).where(Assignment.id == submission.assignment_id)
                )
            ).first()
            if not assignment:
                failed += 1
                failures[str(submission_id)] = "Assignment not found"
                continue

            # Check if professor has access to this assignment
            if assignment.professor_id != professor.id:
                # Check if professor teaches this course
                teaches_course: ProfessorCourse = (
                    await session.execute(
                        select(ProfessorCourse).where(
                            ProfessorCourse.professor_id == professor.id,
                            ProfessorCourse.course_id == assignment.course_id,
                        )
                    )
                ).first()

                if not teaches_course:
                    failed += 1
                    failures[str(submission_id)] = (
                        "Not authorized to grade this submission"
                    )
                    continue

            # Ensure grade doesn't exceed possible points
            if bulk_grade_data.grade > assignment.points_possible:
                failed += 1
                failures[str(submission_id)] = (
                    f"Grade exceeds maximum points ({assignment.points_possible})"
                )
                continue

            # Update submission with grade and feedback
            submission.grade = bulk_grade_data.grade
            submission.feedback = bulk_grade_data.feedback
            submission.status = "graded"
            submission.graded_by = professor.id
            submission.graded_at = datetime.utcnow()

            session.add(submission)
            processed += 1

            # Add to affected assignments for stats recalculation
            affected_assignments.add(assignment.id)

        except Exception as e:
            failed += 1
            failures[str(submission_id)] = str(e)

    # Commit changes
    if processed > 0:
        session.commit()

    return {
        "success": processed > 0,
        "processed": processed,
        "failed": failed,
        "failures": failures,
        "message": f"Successfully graded {processed} submissions, failed to grade {failed} submissions",
        "affected_assignments": list(affected_assignments),
    }


@router.get("/{assignment_id}/stats", response_model=AssignmentStatsResponse)
async def get_assignment_stats(
    assignment_id: int,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Get statistics for an assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment
    assignment: Assignment = (
        await session.execute(select(Assignment).where(Assignment.id == assignment_id))
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if professor has access to this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        teaches_course: ProfessorCourse = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == assignment.course_id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view stats for this assignment",
            )

    # Get submission counts by status
    status_counts_query = (
        select(AssignmentSubmission.status, func.count().label("count"))
        .where(AssignmentSubmission.assignment_id == assignment_id)
        .group_by(AssignmentSubmission.status)
    )
    status_counts_result = (await session.execute(status_counts_query)).all()

    status_counts = {status: count for status, count in status_counts_result}

    # Get total students in the course
    total_students_query = (
        select(func.count())
        .select_from(CourseEnrollment)
        .where(
            CourseEnrollment.course_id == assignment.course_id,
            CourseEnrollment.status == "enrolled",
        )
    )
    total_students = (await session.execute(total_students_query)).one()

    # Calculate submission rate
    total_submissions = sum(status_counts.values())
    submission_rate = (
        (total_submissions / total_students) * 100 if total_students > 0 else 0
    )

    # Calculate grade statistics for graded submissions
    graded_submissions_query = select(AssignmentSubmission.grade).where(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.status == "graded",
    )
    graded_submissions = (await session.execute(graded_submissions_query)).all()

    grade_stats = {
        "count": len(graded_submissions),
        "average": None,
        "median": None,
        "min": None,
        "max": None,
        "distribution": {},
    }

    if graded_submissions:
        grades = [g for g in graded_submissions if g is not None]
        if grades:
            grade_stats["average"] = sum(grades) / len(grades)
            grade_stats["min"] = min(grades)
            grade_stats["max"] = max(grades)

            # Calculate median
            sorted_grades = sorted(grades)
            mid = len(sorted_grades) // 2
            if len(sorted_grades) % 2 == 0:
                grade_stats["median"] = (
                    sorted_grades[mid - 1] + sorted_grades[mid]
                ) / 2
            else:
                grade_stats["median"] = sorted_grades[mid]

            # Calculate grade distribution
            ranges = [(0, 60), (60, 70), (70, 80), (80, 90), (90, 100)]
            for start, end in ranges:
                if assignment.points_possible != 100:
                    # Normalize to percentage
                    range_start = (start / 100) * assignment.points_possible
                    range_end = (end / 100) * assignment.points_possible
                else:
                    range_start = start
                    range_end = end

                count = len([g for g in grades if range_start <= g < range_end])
                grade_stats["distribution"][f"{start}-{end}"] = count

    # Return stats
    return {
        "assignment_id": assignment.id,
        "total_students": total_students,
        "submission_counts": {
            "total": total_submissions,
            "submitted": status_counts.get("submitted", 0),
            "graded": status_counts.get("graded", 0),
            "late": status_counts.get("late", 0),
            "missing": total_students - total_submissions,
        },
        "submission_rate": submission_rate,
        "grade_stats": grade_stats,
        "time_stats": {
            "avg_time_to_grade": None,  # Would require tracking submission and grading times
            "avg_time_to_submit": None,  # Would require tracking assignment publish and submission times
        },
    }


@router.get("/{assignment_id}/export")
async def export_assignment(
    assignment_id: int,
    format: str = Query("pdf", description="Export format: pdf, csv, xlsx"),
    include_submissions: bool = Query(False, description="Include submissions data"),
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Export an assignment and optionally its submissions"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment
    assignment: Assignment = (
        await session.execute(select(Assignment).where(Assignment.id == assignment_id))
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if professor has access to this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        teaches_course: ProfessorCourse = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == assignment.course_id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403, detail="Not authorized to export this assignment"
            )

    # Generate export token
    export_token = str(uuid.uuid4())

    # In a real implementation, you would:
    # 1. Generate the file in the requested format (PDF, CSV, XLSX)
    # 2. Store it somewhere (e.g., S3)
    # 3. Return a download URL or file ID

    # For this example, we'll return a placeholder URL
    download_url = (
        f"/api/v1/downloads/assignments/{assignment_id}.{format}?token={export_token}"
    )

    return {"download_url": download_url}


@router.post("/generate", response_model=AIGenerateResponse)
async def generate_assignment_with_ai(
    generate_data: AIGenerateRequest,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Generate assignment content using AI"""
    # Get professor record
    professor: SchoolProfessor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).first()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Verify course exists
    course: SchoolCourse = (
        await session.execute(
            select(SchoolCourse).where(SchoolCourse.id == generate_data.course_id)
        )
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if professor has access to this course
    teaches_course: ProfessorCourse = (
        await session.execute(
            select(ProfessorCourse).where(
                ProfessorCourse.professor_id == professor.id,
                ProfessorCourse.course_id == course.id,
            )
        )
    ).first()

    if not teaches_course:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this course"
        )

    try:
        # Create a prompt for the LLM based on the assignment type and course
        prompt = f"""
        Create a {generate_data.assignment_type} for the course: {course.title}.

        Course description: {course.description or ""}
        Education level: {course.education_level or ""}
        Academic track: {course.academic_track or ""}

        User prompt: {generate_data.prompt}

        Generate the following:
        1. A clear, engaging title for the assignment
        2. A brief description of the assignment (1-2 sentences)
        3. Detailed instructions for students to complete the assignment
        4. Grading criteria with point allocations (total should be 100 points)
        """

        # If it's a quiz, add quiz-specific instructions
        if generate_data.assignment_type == "quiz":
            prompt += """
            5. Generate 5 quiz questions of different types (multiple choice, true/false, short answer)
            - For multiple choice questions, include 4 options with the correct answer indicated
            - For each question, assign a point value
            - Questions should test different levels of understanding (recall, application, analysis)
            """

        # Initialize LLM client
        llm = LLM(provider="openai")  # Use configured provider from settings

        # Create message for LLM
        messages = [
            Message(
                role="system",
                content="You are an expert education assistant that helps professors create high-quality educational content.",
            ),
            Message(role="user", content=prompt),
        ]

        # Generate content
        config = LLMConfig(
            model="gpt-4",  # Use appropriate model from settings
            temperature=0.7,
            max_tokens=2000,
        )

        # Get response
        response = await llm.generate(messages, config)  # noqa: F841

        # Parse the response to extract the generated content
        # In a real implementation, you'd use a more robust parsing approach
        # Here we'll simulate the parsed response

        # For a real implementation, parse the response text into structured data

        # Sample grading criteria
        sample_grading_criteria = [
            GradingCriteriaItem(
                name="Understanding of Concepts",
                description="Demonstrates clear understanding of key concepts",
                points=30,
            ),
            GradingCriteriaItem(
                name="Analysis", description="Depth and quality of analysis", points=30
            ),
            GradingCriteriaItem(
                name="Evidence",
                description="Use of evidence to support arguments",
                points=20,
            ),
            GradingCriteriaItem(
                name="Presentation",
                description="Organization and clarity of presentation",
                points=20,
            ),
        ]

        # Sample quiz questions if needed
        sample_questions = []
        if generate_data.assignment_type == "quiz":
            sample_questions = [
                {
                    "question": "Which of the following best describes the concept of photosynthesis?",
                    "questionType": "multiple_choice",
                    "options": [
                        "The process by which plants release oxygen during the day",
                        "The process by which plants convert light energy into chemical energy",
                        "The process by which plants absorb carbon dioxide",
                        "The process by which plants grow toward light sources",
                    ],
                    "correctAnswer": "The process by which plants convert light energy into chemical energy",
                    "points": 20,
                },
                {
                    "question": "Photosynthesis occurs in the chloroplasts of plant cells.",
                    "questionType": "true_false",
                    "correctAnswer": "true",
                    "points": 10,
                },
                {
                    "question": "Explain the relationship between photosynthesis and cellular respiration.",
                    "questionType": "short_answer",
                    "correctAnswer": "Photosynthesis produces glucose and oxygen, which are then used in cellular respiration to produce energy (ATP). The processes are complementary, with outputs of one serving as inputs for the other.",
                    "points": 30,
                },
            ]

        # Build the response based on the LLM output
        # In a real implementation, you would parse the LLM's response
        result = {
            "title": "Understanding Photosynthesis: Energy Transformation in Plants",
            "description": "This assignment explores how plants convert light energy into chemical energy through photosynthesis and the importance of this process in ecosystems.",
            "instructions": "In this assignment, you will create a detailed diagram of the photosynthesis process, identify key components and reactions, and explain how environmental factors affect photosynthesis rates. You will then write a 2-page analysis connecting photosynthesis to broader ecological concepts.",
            "gradingCriteria": sample_grading_criteria,
        }

        # Add questions for quiz assignments
        if generate_data.assignment_type == "quiz":
            result["questions"] = sample_questions

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating assignment: {str(e)}"
        )


@router.get("/classes/teaching")
async def get_professor_teaching_classes(
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Get all classes that the professor teaches with their associated course IDs"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # First check for classes in ProfessorClassCourses
    multi_course_classes = (
        await session.execute(
            select(SchoolClass, ProfessorClassCourses)
            .join(
                ProfessorClassCourses, ProfessorClassCourses.class_id == SchoolClass.id
            )
            .where(ProfessorClassCourses.professor_id == professor.id)
        )
    ).all()

    # Also check for classes in ClassSchedule
    schedule_classes = (
        await session.execute(
            select(SchoolClass)
            .join(ClassSchedule, ClassSchedule.class_id == SchoolClass.id)
            .where(ClassSchedule.teacher_id == professor.id)
            .distinct()
        )
    ).all()

    # Combine results
    result = []
    processed_class_ids = set()

    # Add classes from ProfessorClassCourses
    for class_obj, prof_class in multi_course_classes:
        if class_obj.id not in processed_class_ids:
            processed_class_ids.add(class_obj.id)
            result.append(
                {
                    "id": class_obj.id,
                    "name": class_obj.name,
                    "education_level": class_obj.education_level,
                    "academic_track": class_obj.academic_track,
                    "academic_year": class_obj.academic_year,
                    "room_number": class_obj.room_number,
                    "course_ids": prof_class.course_ids,
                }
            )

    # Add classes from ClassSchedule
    for (class_obj,) in schedule_classes:
        if class_obj.id not in processed_class_ids:
            processed_class_ids.add(class_obj.id)
            # Find all course IDs for this class
            course_ids_result = (
                await session.execute(
                    select(ClassSchedule.course_id)
                    .where(
                        ClassSchedule.class_id == class_obj.id,
                        ClassSchedule.teacher_id == professor.id,
                    )
                    .distinct()
                )
            ).all()
            course_ids = [row[0] for row in course_ids_result]

            result.append(
                {
                    "id": class_obj.id,
                    "name": class_obj.name,
                    "education_level": class_obj.education_level,
                    "academic_track": class_obj.academic_track,
                    "academic_year": class_obj.academic_year,
                    "room_number": class_obj.room_number,
                    "course_ids": course_ids,
                }
            )

    return result


##############################################@#################
############################ AI Service #########################


@router.get("/{assignment_id}/analyze", response_model=AIAnalysisResponse)
async def analyze_assignment_with_ai(
    assignment_id: int,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Analyze an assignment with AI to get insights and improvement suggestions"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment with course
    query = (
        select(Assignment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .where(Assignment.id == assignment_id)
    )
    result = (await session.execute(query)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment: Assignment = result[0]
    course: SchoolCourse = result[1]

    # Check if professor has access to this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        teaches_course = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == course.id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403, detail="Not authorized to access this assignment"
            )

    # Create a prompt for the LLM to analyze the assignment
    prompt = f"""
    I need you to analyze an educational assignment and provide useful insights. Here are the details:

    Assignment Title: {assignment.title}
    Course: {course.title}
    Type: {assignment.assignment_type}
    Description: {assignment.description}
    Instructions: {assignment.instructions}
    Due Date: {assignment.due_date.isoformat()}
    Points Possible: {assignment.points_possible}

    For this assignment, please provide:
    1. An analysis of the overall quality, clarity, difficulty level, and alignment with learning objectives
    2. A summary of the assignment's strengths and areas for improvement
    3. Specific improvements that could be made to enhance the assignment
    4. Quality, clarity, difficulty, and alignment scores on a scale of 0-100

    Structure your response as JSON with the following fields:
    - summary: A brief overview of the assignment quality
    - strengths: An array of 3-5 specific strengths
    - improvements: An array of 3-5 specific improvement suggestions
    - qualityScore: Overall quality score (0-100)
    - clarityScore: Clarity score (0-100)
    - difficultyScore: Appropriate difficulty score (0-100)
    - alignmentScore: Alignment with learning objectives score (0-100)
    """

    # Initialize LLM client
    llm = LLM(provider="openai")  # Use configured provider from settings

    # Create message for LLM
    messages = [
        Message(
            role="system",
            content="You are an expert educational assistant that helps professors create and improve high-quality educational content.",
        ),
        Message(role="user", content=prompt),
    ]

    # Generate content
    config = LLMConfig(
        model="gpt-4",  # Use appropriate model from settings
        temperature=0.3,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    try:
        # Get response from LLM
        response = await llm.generate(messages, config)

        # Parse the response - in a real implementation, add error handling
        analysis_data = response.parsed_json

        # Return the parsed response
        return {
            "summary": analysis_data.get("summary", ""),
            "strengths": analysis_data.get("strengths", []),
            "improvements": analysis_data.get("improvements", []),
            "qualityScore": analysis_data.get("qualityScore", 0),
            "clarityScore": analysis_data.get("clarityScore", 0),
            "difficultyScore": analysis_data.get("difficultyScore", 0),
            "alignmentScore": analysis_data.get("alignmentScore", 0),
        }
    except Exception as e:
        # In production, you'd want to log this error
        raise HTTPException(
            status_code=500, detail=f"Error analyzing assignment with AI: {str(e)}"
        )


@router.post("/{assignment_id}/custom-prompt", response_model=AICustomPromptResponse)
async def process_custom_ai_prompt(
    assignment_id: int,
    prompt_data: AICustomPromptRequest,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Process a custom AI prompt related to an assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment with course
    query = (
        select(Assignment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .where(Assignment.id == assignment_id)
    )
    result = (await session.execute(query)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment: Assignment = result[0]
    course: SchoolCourse = result[1]

    # Check if professor has access to this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        teaches_course = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == course.id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403, detail="Not authorized to access this assignment"
            )

    # Create a prompt for the LLM
    system_prompt = f"""
    You are an expert educational assistant that helps professors create and improve high-quality educational content.
    You are currently helping with an assignment with the following details:

    Assignment Title: {assignment.title}
    Course: {course.title}
    Type: {assignment.assignment_type}
    Description: {assignment.description}
    Instructions: {assignment.instructions}
    Due Date: {assignment.due_date.isoformat()}
    Points Possible: {assignment.points_possible}

    The professor will ask you a question about this assignment. Provide a helpful, concise response focused on improving the educational quality.
    """

    # Initialize LLM client
    llm = LLM(provider="openai")  # Use configured provider from settings

    # Create message for LLM
    messages = [
        Message(role="system", content=system_prompt),
        Message(role="user", content=prompt_data.prompt),
    ]

    # Generate content
    config = LLMConfig(
        model="gpt-4",  # Use appropriate model from settings
        temperature=0.7,
        max_tokens=1000,
    )

    try:
        # Get response from LLM
        response = await llm.generate(messages, config)

        # Return the response
        return {"response": response.text}
    except Exception as e:
        # In production, you'd want to log this error
        raise HTTPException(
            status_code=500, detail=f"Error processing custom prompt: {str(e)}"
        )


@router.post("/{assignment_id}/apply-improvement", response_model=AssignmentResponse)
async def apply_ai_improvement(
    assignment_id: int,
    improvement_data: AIImprovementRequest,
    current_user: tuple[User, SchoolProfessor] = Depends(get_current_professor),
    session: AsyncSession = Depends(get_session),
):
    """Apply an AI-suggested improvement to an assignment"""
    # Get professor record
    professor = current_user[1]

    if not professor:
        raise HTTPException(status_code=404, detail="Professor record not found")

    # Get assignment with course
    query = (
        select(Assignment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .where(Assignment.id == assignment_id)
    )
    result = (await session.execute(query)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment: Assignment = result[0]
    course: SchoolCourse = result[1]

    # Check if professor has access to this assignment
    if assignment.professor_id != professor.id:
        # Check if professor teaches this course
        teaches_course = (
            await session.execute(
                select(ProfessorCourse).where(
                    ProfessorCourse.professor_id == professor.id,
                    ProfessorCourse.course_id == course.id,
                )
            )
        ).first()

        if not teaches_course:
            raise HTTPException(
                status_code=403, detail="Not authorized to modify this assignment"
            )

    # Create a prompt for the LLM
    prompt = f"""
    You are going to help me improve an educational assignment based on a specific suggestion.

    Here's the current assignment:

    Assignment Title: {assignment.title}
    Course: {course.title}
    Type: {assignment.assignment_type}
    Description: {assignment.description}
    Instructions: {assignment.instructions}
    Due Date: {assignment.due_date.isoformat()}
    Points Possible: {assignment.points_possible}

    The improvement suggestion is:
    "{improvement_data.improvement}"

    Please apply this suggestion to modify the assignment. Return the updated assignment with the following fields:
    - title: The updated title (if changed)
    - description: The updated description (if changed)
    - instructions: The updated instructions (if changed)

    Structure your response as JSON with these fields, ONLY modifying what needs to be changed based on the suggestion.
    """

    # Initialize LLM client
    llm = LLM(provider="openai")  # Use configured provider from settings

    # Create message for LLM
    messages = [
        Message(
            role="system",
            content="You are an expert educational assistant that helps professors create and improve high-quality educational content.",
        ),
        Message(role="user", content=prompt),
    ]

    # Generate content
    config = LLMConfig(
        model="gpt-4",  # Use appropriate model from settings
        temperature=0.3,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    try:
        # Get response from LLM
        response = await llm.generate(messages, config)

        # Parse the response - in a real implementation, add more error handling
        update_data = response.parsed_json

        # Update assignment with the changes
        if "title" in update_data and update_data["title"] != assignment.title:
            assignment.title = update_data["title"]

        if (
            "description" in update_data
            and update_data["description"] != assignment.description
        ):
            assignment.description = update_data["description"]

        if (
            "instructions" in update_data
            and update_data["instructions"] != assignment.instructions
        ):
            assignment.instructions = update_data["instructions"]

        # Set updated timestamp
        assignment.updated_at = datetime.utcnow()

        await session.add(assignment)
        await session.commit()
        await session.refresh(assignment)

        # Get submission stats for response
        submissions_count = (
            await session.execute(
                select(func.count()).where(
                    AssignmentSubmission.assignment_id == assignment.id
                )
            )
        ).one()

        graded_count = (
            await session.execute(
                select(func.count()).where(
                    AssignmentSubmission.assignment_id == assignment.id,
                    AssignmentSubmission.status == "graded",
                )
            )
        ).one()

        # Calculate average grade if there are graded submissions
        average_grade = None
        if graded_count > 0:
            avg_query = select(func.avg(AssignmentSubmission.grade)).where(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.status == "graded",
            )
            average_grade = (await session.execute(avg_query)).one()

        # Determine status for response
        status = "published" if assignment.is_published else "draft"
        if assignment.is_published and assignment.due_date < datetime.utcnow():
            status = "closed"
        elif assignment.is_published and submissions_count > graded_count:
            status = "grading"

        # Return the updated assignment
        return {
            "id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "course_id": assignment.course_id,
            "course_name": course.title,
            "assignment_type": assignment.assignment_type,
            "due_date": assignment.due_date.isoformat(),
            "points_possible": assignment.points_possible,
            "status": status,
            "created_at": assignment.created_at.isoformat(),
            "updated_at": assignment.updated_at.isoformat(),
            "instructions": assignment.instructions,
            "materials": assignment.materials or [],
            "submission_count": submissions_count,
            "graded_count": graded_count,
            "average_grade": float(average_grade)
            if average_grade is not None
            else None,
            "class_ids": assignment.class_ids
            if hasattr(assignment, "class_ids")
            else [],
            "content": assignment.content if assignment.content else None,
        }

    except Exception as e:
        # In production, you'd want to log this error
        raise HTTPException(
            status_code=500, detail=f"Error applying improvement: {str(e)}"
        )
