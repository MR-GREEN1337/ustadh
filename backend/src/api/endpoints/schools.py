from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from src.db import get_session
from src.db.models.school import School, SchoolStaff
from src.db.models.user import User
from src.api.models.school import SchoolCreate, SchoolResponse

router = APIRouter(prefix="/schools", tags=["schools"])


@router.post("/", response_model=SchoolResponse)
async def register_school(
    school_data: SchoolCreate, session: AsyncSession = Depends(get_session)
):
    """
    Register a new school in the system.

    This endpoint creates a new school record and also sets up the school admin.
    """
    try:
        logger.info(f"Registering new school: {school_data.name}")

        # Check if school code already exists
        result = await session.execute(
            select(School).where(School.code == school_data.code)
        )
        existing_school = result.scalars().first()

        if existing_school:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School code already registered",
            )

        # Create new school object
        new_school = School(
            name=school_data.name,
            code=school_data.code,
            address=school_data.address,
            city=school_data.city,
            region=school_data.region,
            school_type=school_data.school_type,
            education_levels=school_data.education_levels,
            contact_email=school_data.contact_email,
            contact_phone=school_data.contact_phone,
            website=school_data.website,
            is_active=True,  # Schools start as active by default
            subscription_type="basic",  # Default subscription
            created_at=datetime.utcnow().replace(
                tzinfo=None
            ),  # Use timezone-naive datetime
        )

        # Add to session and commit to get the ID
        session.add(new_school)
        await session.commit()
        await session.refresh(new_school)

        logger.info(
            f"School registered successfully: {new_school.name} (ID: {new_school.id})"
        )

        return new_school

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during school registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during school registration",
        )


@router.post("/{school_id}/admin", response_model=dict)
async def link_admin_to_school(
    school_id: int, admin_data: dict, session: AsyncSession = Depends(get_session)
):
    """
    Link an admin user to a school.

    This endpoint associates an existing user with admin privileges to a school
    and creates a SchoolStaff record for them.
    """
    try:
        # Check if the school exists
        result = await session.execute(select(School).where(School.id == school_id))
        school = result.scalars().first()

        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="School not found"
            )

        # Check if the admin exists
        admin_id = admin_data.get("admin_id")
        if not admin_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Admin ID is required"
            )

        result = await session.execute(select(User).where(User.id == admin_id))
        admin_user = result.scalars().first()

        if not admin_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found"
            )

        # Update the school with the admin user ID
        school.admin_user_id = admin_id
        # Use timezone-naive datetime
        school.updated_at = datetime.utcnow().replace(tzinfo=None)

        # Check if SchoolStaff record already exists for this user and school
        result = await session.execute(
            select(SchoolStaff).where(
                SchoolStaff.user_id == admin_id, SchoolStaff.school_id == school_id
            )
        )
        existing_staff = result.scalars().first()

        # If staff record doesn't exist, create a new one
        if not existing_staff:
            # Generate employee ID for the admin - VERY IMPORTANT:
            # From logs, we can see the auth system looks for staff with ID format "ADM-{user_id}"
            employee_id = f"ADM-{admin_id}"

            # Create a new SchoolStaff record for the admin
            admin_staff = SchoolStaff(
                user_id=admin_id,
                school_id=school_id,
                staff_type="admin",  # Set as admin type
                is_teacher=False,  # By default, admins are not teachers
                employee_id=employee_id,  # Use the format expected by auth system
                is_active=True,
                work_email=admin_user.email,
                created_at=datetime.utcnow().replace(
                    tzinfo=None
                ),  # Use timezone-naive datetime
            )

            session.add(admin_staff)
            logger.info(
                f"Created SchoolStaff record with employee_id: {employee_id} for admin (ID: {admin_id}) in school (ID: {school_id})"
            )
        else:
            # If staff record exists but not as admin, update it
            if existing_staff.staff_type != "admin":
                existing_staff.staff_type = "admin"
                existing_staff.updated_at = datetime.utcnow().replace(
                    tzinfo=None
                )  # Use timezone-naive datetime
                logger.info(
                    f"Updated existing staff record to admin type for user (ID: {admin_id})"
                )
            # Make sure the employee_id is correctly formatted for auth system
            if existing_staff.employee_id != f"ADM-{admin_id}":
                existing_staff.employee_id = f"ADM-{admin_id}"
                logger.info(f"Updated employee_id to ADM-{admin_id} for admin")

        await session.commit()

        logger.info(
            f"Admin (ID: {admin_id}) linked to school: {school.name} (ID: {school.id})"
        )

        return {
            "status": "success",
            "message": "Admin successfully linked to school and added to staff",
            "school_id": school.id,
            "admin_id": admin_id,
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error linking admin to school: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while linking admin to school",
        )
