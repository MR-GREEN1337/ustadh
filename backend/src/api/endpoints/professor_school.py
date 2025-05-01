from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.school import (
    SchoolInfoResponse,
    DepartmentResponse,
    AdminContactResponse,
    SchoolAnnouncementResponse,
    SchoolStaffResponse,
    SchoolStatsResponse,
    MessageRequest,
    DepartmentAccessRequest,
    SchoolResourceResponse,
)
from ...db.models.school import (
    School,
    Department,
    SchoolStaff,
    SchoolAnnouncement,
    DepartmentStaffAssignment,
)
from ...db.models.user import User, UserFile
from ...db.models.professor import SchoolProfessor
from ...db.models.communication import Message
from ...db.postgresql import get_session
from .auth import get_current_user

# Define the router with prefix and tags
router = APIRouter(prefix="/professors/school", tags=["professor-school"])


@router.get("/info", response_model=SchoolInfoResponse)
async def get_school_info(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get the school information for the current professor's school."""

    # Get the professor profile to find their school
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get detailed school information
    school = (
        await session.execute(select(School).where(School.id == professor.school_id))
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Return formatted school info
    return {
        "id": school.id,
        "name": school.name,
        "code": school.code,
        "address": school.address,
        "city": school.city,
        "region": school.region,
        "school_type": school.school_type,
        "education_levels": school.education_levels,
        "contact_email": school.contact_email,
        "contact_phone": school.contact_phone,
        "website": school.website,
        "logo_url": school.logo_url,
        "color_scheme": school.color_scheme,
        "is_active": school.is_active,
        "subscription_type": school.subscription_type,
        "subscription_expires": school.subscription_expires,
    }


@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get all departments in the professor's school."""

    # Get the professor profile to find their school
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get departments for the school
    query = select(Department).where(Department.school_id == professor.school_id)

    departments_result = await session.execute(query)
    departments = departments_result.scalars().all()

    # Format departments with head staff member names
    formatted_departments = []
    for dept in departments:
        # Find head of department if any
        head_staff_name = None
        if dept.head_staff_id:
            head_staff_query = select(SchoolStaff).where(
                SchoolStaff.id == dept.head_staff_id
            )
            head_staff = await session.execute(head_staff_query)
            head_staff_obj = head_staff.scalar_one_or_none()

            if head_staff_obj:
                # Get the user to get their name
                user_query = select(User).where(User.id == head_staff_obj.user_id)
                user = await session.execute(user_query)
                user_obj = user.scalar_one_or_none()
                if user_obj:
                    head_staff_name = user_obj.full_name

        formatted_departments.append(
            {
                "id": dept.id,
                "name": dept.name,
                "code": dept.code,
                "description": dept.description,
                "education_level": dept.education_level,
                "head_staff_name": head_staff_name,
            }
        )

    return formatted_departments


@router.get(
    "/departments/{department_id}/staff", response_model=List[SchoolStaffResponse]
)
async def get_department_staff(
    department_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get staff members for a specific department."""

    # Get the professor profile to find their school
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Verify the department exists and belongs to the professor's school
    department = await session.execute(
        select(Department).where(
            Department.id == department_id, Department.school_id == professor.school_id
        )
    ).scalar_one_or_none()

    if not department:
        raise HTTPException(
            status_code=404, detail="Department not found or access denied"
        )

    # Get staff assigned to this department
    staff_query = (
        select(SchoolStaff)
        .join(
            DepartmentStaffAssignment,
            DepartmentStaffAssignment.staff_id == SchoolStaff.id,
        )
        .where(DepartmentStaffAssignment.department_id == department_id)
    )

    staff_result = await session.execute(staff_query)
    staff_members = staff_result.scalars().all()

    # Format staff data
    formatted_staff = []
    for staff in staff_members:
        # Get user data to get name
        user_query = select(User).where(User.id == staff.user_id)
        user = await session.execute(user_query)
        user_obj = user.scalar_one_or_none()

        name = "Unknown"
        if user_obj:
            name = user_obj.full_name

        formatted_staff.append(
            {
                "id": staff.id,
                "name": name,
                "staff_type": staff.staff_type,
                "is_teacher": staff.is_teacher,
                "expertise_subjects": staff.expertise_subjects,
                "work_email": staff.work_email,
                "work_phone": staff.work_phone,
            }
        )

    return formatted_staff


@router.get("/admins", response_model=List[AdminContactResponse])
async def get_admin_contacts(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get administrative contacts for the professor's school."""

    # Get the professor profile to find their school
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get admin staff members (principals, administrative staff, etc.)
    admins_query = select(SchoolStaff).where(
        SchoolStaff.school_id == professor.school_id,
        SchoolStaff.staff_type.in_(["admin", "principal", "director", "coordinator"]),
    )

    admins_result = await session.execute(admins_query)
    admin_staff = admins_result.scalars().all()

    # Format admin contact data
    formatted_admins = []
    for admin in admin_staff:
        # Get user data to get name and other details
        user_query = select(User).where(User.id == admin.user_id)
        user = await session.execute(user_query)
        user_obj = user.scalar_one_or_none()

        if user_obj:
            formatted_admins.append(
                {
                    "id": admin.id,
                    "name": user_obj.full_name,
                    "email": admin.work_email or user_obj.email,
                    "phone": admin.work_phone,
                    "role": admin.staff_type.capitalize(),
                    "avatar_url": user_obj.avatar,
                }
            )

    return formatted_admins


@router.get("/announcements", response_model=List[SchoolAnnouncementResponse])
async def get_announcements(
    limit: int = Query(5, description="Number of announcements to return"),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get recent school announcements."""

    # Get the professor profile to find their school
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get department IDs this professor is associated with
    department_query = select(DepartmentStaffAssignment.department_id).where(
        DepartmentStaffAssignment.staff_id == professor.id
    )
    department_result = await session.execute(department_query)
    department_ids = department_result.scalars().all()

    # Query announcements for the school and professor's departments
    now = datetime.utcnow()
    announcements_query = (
        select(SchoolAnnouncement)
        .where(
            SchoolAnnouncement.school_id == professor.school_id,
            (
                SchoolAnnouncement.expires_at.is_(None)
                | (SchoolAnnouncement.expires_at > now)
            ),
            (
                (SchoolAnnouncement.audience_type == "all")
                | (SchoolAnnouncement.audience_type == "staff")
                | (
                    (SchoolAnnouncement.audience_type == "department")
                    & (SchoolAnnouncement.department_id.in_(department_ids))
                )
            ),
        )
        .order_by(SchoolAnnouncement.published_at.desc())
        .limit(limit)
    )

    announcements_result = await session.execute(announcements_query)
    announcements = announcements_result.scalars().all()

    # Format announcements
    formatted_announcements = []
    for announcement in announcements:
        # Get publisher name
        publisher_name = "School Admin"
        staff_query = select(SchoolStaff).where(
            SchoolStaff.id == announcement.published_by
        )
        staff = await session.execute(staff_query)
        staff_obj = staff.scalar_one_or_none()

        if staff_obj:
            user_query = select(User).where(User.id == staff_obj.user_id)
            user = await session.execute(user_query)
            user_obj = user.scalar_one_or_none()

            if user_obj:
                publisher_name = user_obj.full_name

        formatted_announcements.append(
            {
                "id": announcement.id,
                "title": announcement.title,
                "content": announcement.content,
                "published_by": publisher_name,
                "published_at": announcement.published_at.isoformat(),
                "priority": announcement.priority,
                "expires_at": announcement.expires_at.isoformat()
                if announcement.expires_at
                else None,
            }
        )

    return formatted_announcements


@router.get("/stats", response_model=SchoolStatsResponse)
async def get_school_stats(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get statistics about the professor's school."""

    # Get the professor profile to find their school
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get total students count - using SchoolStudent model
    from ...db.models.school import SchoolStudent

    students_count_query = select(func.count()).select_from(
        select(SchoolStudent)
        .where(
            SchoolStudent.school_id == professor.school_id,
            SchoolStudent.is_active,
        )
        .subquery()
    )
    students_result = await session.execute(students_count_query)
    total_students = students_result.scalar() or 0

    # Get total teachers count - using SchoolStaff model with is_teacher flag
    from ...db.models.school import SchoolStaff

    teachers_count_query = select(func.count()).select_from(
        select(SchoolStaff)
        .where(
            SchoolStaff.school_id == professor.school_id,
            SchoolStaff.is_teacher,
            SchoolStaff.is_active,
        )
        .subquery()
    )
    teachers_result = await session.execute(teachers_count_query)
    total_teachers = teachers_result.scalar() or 0

    # Get total professors count
    professors_count_query = select(func.count()).select_from(
        select(SchoolProfessor)
        .where(
            SchoolProfessor.school_id == professor.school_id,
            SchoolProfessor.is_active,
        )
        .subquery()
    )
    professors_result = await session.execute(professors_count_query)
    total_professors = professors_result.scalar() or 0

    # Add professors to total teachers count since they're also teaching staff
    total_teachers += total_professors

    # Get departments count
    from ...db.models.school import Department

    departments_count_query = select(func.count()).select_from(
        select(Department).where(Department.school_id == professor.school_id).subquery()
    )
    departments_result = await session.execute(departments_count_query)
    total_departments = departments_result.scalar() or 0

    # Get courses count
    from ...db.models.school import SchoolCourse

    courses_count_query = select(func.count()).select_from(
        select(SchoolCourse)
        .where(SchoolCourse.school_id == professor.school_id)
        .subquery()
    )
    courses_result = await session.execute(courses_count_query)
    total_courses = courses_result.scalar() or 0

    # Get active courses count
    active_courses_count_query = select(func.count()).select_from(
        select(SchoolCourse)
        .where(
            SchoolCourse.school_id == professor.school_id,
            SchoolCourse.status == "active",
        )
        .subquery()
    )
    active_courses_result = await session.execute(active_courses_count_query)
    active_courses = active_courses_result.scalar() or 0

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_departments": total_departments,
        "total_courses": total_courses,
        "active_courses": active_courses,
    }


@router.post("/contact", response_model=dict)
async def contact_admin(
    message_data: MessageRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Send a message to a school administrator."""

    # Get the professor profile
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Verify the recipient is a valid admin at the professor's school
    recipient_query = select(SchoolStaff).where(
        SchoolStaff.id == message_data.recipient_id,
        SchoolStaff.school_id == professor.school_id,
        SchoolStaff.staff_type.in_(["admin", "principal", "director", "coordinator"]),
    )
    recipient = await session.execute(recipient_query)
    recipient_obj = recipient.scalar_one_or_none()

    if not recipient_obj:
        raise HTTPException(
            status_code=404, detail="Recipient not found or not an administrator"
        )

    # Create and save the message
    message = Message(
        user_id=current_user.id,  # Sender
        recipient_id=recipient_obj.user_id,  # Admin user ID
        subject=message_data.subject,
        content=message_data.content,
        has_attachments=message_data.has_attachments or False,
        created_at=datetime.utcnow(),
    )

    session.add(message)
    await session.commit()

    return {"success": True, "message": "Message sent successfully"}


@router.post("/departments/{department_id}/request-access", response_model=dict)
async def request_department_access(
    department_id: int,
    request_data: DepartmentAccessRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Request access to a department."""

    # Get the professor profile
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Verify the department exists and belongs to the professor's school
    department = (
        await session.execute(
            select(Department).where(
                Department.id == department_id,
                Department.school_id == professor.school_id,
            )
        )
    ).scalar_one_or_none()

    if not department:
        raise HTTPException(
            status_code=404, detail="Department not found or access denied"
        )

    # Check if professor already has access to this department
    existing_access = (
        await session.execute(
            select(DepartmentStaffAssignment).where(
                DepartmentStaffAssignment.staff_id == professor.id,
                DepartmentStaffAssignment.department_id == department_id,
            )
        )
    ).scalar_one_or_none()

    if existing_access:
        return {
            "success": False,
            "message": "You already have access to this department",
        }

    # Find department head or school admin to send request to
    recipient_id = None
    if department.head_staff_id:
        # Send to department head
        head_staff = (
            await session.execute(
                select(SchoolStaff).where(SchoolStaff.id == department.head_staff_id)
            )
        ).scalar_one_or_none()

        if head_staff:
            recipient_id = head_staff.user_id

    if not recipient_id:
        # Find a school admin as fallback
        admin = (
            await session.execute(
                select(SchoolStaff)
                .where(
                    SchoolStaff.school_id == professor.school_id,
                    SchoolStaff.staff_type.in_(["admin", "principal"]),
                )
                .limit(1)
            )
        ).scalar_one_or_none()

        if admin:
            recipient_id = admin.user_id

    if not recipient_id:
        raise HTTPException(
            status_code=404, detail="Could not find suitable recipient for request"
        )

    # Create and save the access request message
    message = Message(
        user_id=current_user.id,  # Sender
        recipient_id=recipient_id,  # Admin/department head user ID
        subject=f"Department Access Request: {department.name}",
        content=f"Request reason: {request_data.reason}\n\nProfessor {current_user.full_name} is requesting access to the {department.name} department.",
        created_at=datetime.utcnow(),
    )

    session.add(message)
    await session.commit()

    return {"success": True, "message": "Access request submitted successfully"}


@router.get("/resources", response_model=List[SchoolResourceResponse])
async def get_school_resources(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get resources available from the school."""

    # Get the professor profile to find their school
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get files that are marked as school resources and shared at school level
    resources_query = (
        select(UserFile)
        .where(
            UserFile.school_id == professor.school_id,
            not UserFile.is_deleted,
            UserFile.file_category == "school_resource",
            (
                (UserFile.sharing_level == "school")
                | (UserFile.sharing_level == "public")
                | (UserFile.is_public)
            ),
        )
        .order_by(UserFile.created_at.desc())
    )

    resources_result = await session.execute(resources_query)
    resources = resources_result.scalars().all()

    # Format resources
    formatted_resources = []
    for resource in resources:
        # Get uploader name
        uploader_name = resource.uploaded_by_name or "School Administration"
        if not resource.uploaded_by_name and resource.user_id:
            user_query = select(User).where(User.id == resource.user_id)
            user = await session.execute(user_query)
            user_obj = user.scalar_one_or_none()

            if user_obj:
                uploader_name = user_obj.full_name

        # Determine resource type
        resource_type = "document"
        if resource.file_metadata and "resource_type" in resource.file_metadata:
            resource_type = resource.file_metadata["resource_type"]
        elif resource.content_type:
            if "pdf" in resource.content_type:
                resource_type = "pdf"
            elif "image" in resource.content_type:
                resource_type = "image"
            elif "video" in resource.content_type:
                resource_type = "video"
            elif (
                "presentation" in resource.content_type
                or "powerpoint" in resource.content_type
            ):
                resource_type = "presentation"
            elif (
                "spreadsheet" in resource.content_type
                or "excel" in resource.content_type
            ):
                resource_type = "spreadsheet"

        formatted_resources.append(
            {
                "id": resource.id,
                "title": resource.file_name,
                "description": resource.file_metadata.get("description", ""),
                "resource_type": resource_type,
                "file_url": resource.file_url,
                "file_name": resource.file_name,
                "file_size": resource.file_size,
                "content_type": resource.file_type,
                "created_at": resource.created_at.isoformat(),
                "created_by": uploader_name,
            }
        )

    return formatted_resources


@router.get("/resources/{resource_id}/download")
async def download_resource(
    resource_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Download a specific school resource file."""

    # Get the professor profile to find their school
    professor = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get the resource and verify access
    resource = (
        await session.execute(
            select(UserFile).where(
                UserFile.id == resource_id,
                UserFile.school_id == professor.school_id,
                not UserFile.is_deleted,
                (
                    (UserFile.sharing_level == "school")
                    | (UserFile.sharing_level == "public")
                    | (UserFile.is_public)
                ),
            )
        )
    ).scalar_one_or_none()

    if not resource:
        raise HTTPException(
            status_code=404, detail="Resource not found or access denied"
        )

    # In a real implementation, you would now:
    # 1. Generate a download URL or redirect to the file
    # 2. Or stream the file directly from storage

    # For this example, we'll return the file URL (assumes frontend can access it)
    from fastapi.responses import RedirectResponse

    # Redirect to the actual file URL
    return RedirectResponse(url=resource.file_url)
