from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    status,
    BackgroundTasks,
    Query,
    Path,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, update, or_
import boto3
from botocore.exceptions import ClientError
import os
from uuid import uuid4
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
from pydantic import BaseModel
import hashlib
import magic  # python-magic package for file type detection
import json

from src.db import get_session
from src.api.endpoints.auth import get_current_user
from src.db.models.user import User, UserFile
from src.core.settings import settings

from src.api.models.file import (
    FileDeleteResponse,
    ShareFileRequest,
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["files"])

# Configure S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY,
    aws_secret_access_key=settings.AWS_SECRET_KEY,
    region_name=settings.AWS_REGION,
    config=boto3.session.Config(
        signature_version="s3v4"
    ),  # Ensure proper signature version
)

BUCKET_NAME = settings.S3_BUCKET_NAME
AVATAR_FOLDER = "avatars/"
UPLOAD_FOLDER = "uploads/"
TEMP_FOLDER = "temp/"
ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_FILE_TYPES = [
    # Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "text/markdown",
    # Audio/Video
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/webm",
    # Archives
    "application/zip",
    "application/x-rar-compressed",
    # Code
    "text/javascript",
    "application/json",
    "text/html",
    "text/css",
    "application/xml",
]
MAX_AVATAR_SIZE_MB = 2  # 2MB max file size for avatars
MAX_FILE_SIZE_MB = 50  # 50MB max file size for general uploads


# Response models
class FileResponse(BaseModel):
    id: str
    fileName: str
    contentType: str
    url: str
    permanent_url: Optional[str] = None
    size: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class AvatarResponse(BaseModel):
    url: str
    permanent_url: str
    filename: str
    content_type: str
    size: int


# Helper function for secure filename generation with unique IDs
def generate_unique_filename(
    original_filename: str, folder_prefix: str = "", user_id: Optional[int] = None
) -> str:
    """
    Generate a secure, unique filename including user ID in the path structure.

    Args:
        original_filename: Original file name
        folder_prefix: Folder path prefix
        user_id: User ID to include in path

    Returns:
        Unique path and filename for S3
    """
    # Get file extension and make it lowercase
    _, file_extension = os.path.splitext(original_filename)
    file_extension = file_extension.lower()

    # Generate a unique ID and timestamp
    unique_id = str(uuid4())
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    # Create a secure base filename
    base_filename = f"{timestamp}-{unique_id}{file_extension}"

    # Include user_id in path if provided
    if user_id:
        user_folder = f"user_{user_id}/"
        return f"{folder_prefix}{user_folder}{base_filename}"

    return f"{folder_prefix}{base_filename}"


# Helper function to validate file type
async def validate_file_type(file: UploadFile, allowed_types: List[str]) -> str:
    """
    Validate file type using python-magic for more accurate type detection.
    Returns the detected content type if valid.
    """
    # Read the first 2KB of the file to determine its type
    file_head = await file.read(2048)

    # Reset file position for subsequent reads
    await file.seek(0)

    # Use python-magic to detect file type
    detected_type = magic.from_buffer(file_head, mime=True)

    if detected_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {detected_type}. Allowed types: {', '.join(allowed_types[:5])}...",
        )

    return detected_type


# Helper function to calculate file hash
async def calculate_file_hash(file_content: bytes) -> str:
    """Calculate SHA-256 hash of file content"""
    file_hash = hashlib.sha256(file_content).hexdigest()
    return file_hash


# Background task to store file metadata in the database
async def store_file_metadata(
    session: AsyncSession,
    user_id: int,
    file_key: str,
    file_name: str,
    file_type: str,
    file_size: int,
    file_url: str,
    file_category: str,
    session_id: Optional[str] = None,
    reference_id: Optional[str] = None,
    is_public: bool = False,
    expires_at: Optional[datetime] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """Store file metadata in the database"""
    try:
        new_file = UserFile(
            user_id=user_id,
            file_key=file_key,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size,
            file_url=file_url,
            file_category=file_category,
            session_id=session_id,
            reference_id=reference_id,
            is_public=is_public,
            expires_at=expires_at,
            file_metadata=metadata or {},
            created_at=datetime.utcnow(),
        )

        session.add(new_file)
        await session.commit()
        await session.refresh(new_file)
        logger.info(f"Stored file metadata for file: {file_key}")
        return new_file.id
    except Exception as e:
        logger.error(f"Failed to store file metadata: {e}")
        # Don't raise an exception - this is a background task
        return None


# Background task to delete S3 object
async def delete_s3_object(key: str):
    """Delete an object from S3 bucket. Used for background tasks."""
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
        logger.info(f"Successfully deleted S3 object: {key}")
        return True
    except ClientError as e:
        logger.error(f"Failed to delete S3 object {key}: {e}")
        return False


@router.post(
    "/upload/avatar", response_model=AvatarResponse, status_code=status.HTTP_200_OK
)
async def upload_avatar(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a user avatar to S3 and update the user profile.
    Returns a presigned URL for the uploaded file.
    """
    # Validate file type with enhanced detection
    content_type = await validate_file_type(file, ALLOWED_AVATAR_TYPES)

    # Read file content
    file_contents = await file.read()
    file_size = len(file_contents)
    max_size_bytes = MAX_AVATAR_SIZE_MB * 1024 * 1024

    # Check file size
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_AVATAR_SIZE_MB}MB",
        )

    # Reset file position
    await file.seek(0)

    # Calculate file hash for deduplication and integrity
    file_hash = await calculate_file_hash(file_contents)

    # Generate unique filename for S3
    user_folder = f"user_{current_user.id}/"
    unique_filename = generate_unique_filename(
        file.filename, AVATAR_FOLDER + user_folder
    )

    try:
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=unique_filename,
            Body=file_contents,
            ContentType=content_type,
            Metadata={
                "user_id": str(current_user.id),
                "original_filename": file.filename,
                "file_hash": file_hash,
            },
        )

        # Generate a presigned URL for immediate use
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": unique_filename},
            ExpiresIn=86400,  # URL valid for 24 hours
        )

        # Create a permanent URL for storage in the database
        permanent_url = f"https://{BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"

        # Prepare avatar metadata
        avatar_metadata = {
            "original_filename": file.filename,
            "content_type": content_type,
            "file_size": file_size,
            "file_hash": file_hash,
            "s3_key": unique_filename,
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Update user's avatar URL and metadata in the database
        stmt = (
            update(User)
            .where(User.id == current_user.id)
            .values(
                avatar=permanent_url,
                avatar_metadata=avatar_metadata,
                avatar_updated_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
        )
        await session.execute(stmt)
        await session.commit()

        # Store metadata in the UserFile table
        background_tasks.add_task(
            store_file_metadata,
            session,
            current_user.id,
            unique_filename,
            file.filename,
            content_type,
            file_size,
            permanent_url,
            "avatar",
            file_metadata={"file_hash": file_hash},
        )

        # Clean up old avatar in background
        if (
            current_user.avatar
            and current_user.avatar_metadata
            and "s3_key" in current_user.avatar_metadata
        ):
            old_key = current_user.avatar_metadata["s3_key"]
            if old_key != unique_filename:  # Don't delete if somehow the same
                background_tasks.add_task(delete_s3_object, old_key)

        return {
            "url": presigned_url,
            "permanent_url": permanent_url,
            "filename": os.path.basename(unique_filename),
            "content_type": content_type,
            "size": file_size,
        }

    except ClientError as e:
        logger.error(f"S3 upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage",
        )


@router.post("/upload", response_model=FileResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form("general"),
    session_id: Optional[str] = Form(None),
    reference_id: Optional[str] = Form(None),
    is_public: bool = Form(False),
    sharing_level: str = Form("private"),
    course_id: Optional[str] = Form(None),
    school_id: Optional[str] = Form(None),
    department_id: Optional[str] = Form(None),
    shared_with: Optional[str] = Form(None),
    expires_after_days: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Enhanced file upload with sharing and management options.
    """
    # Validate file type
    content_type = await validate_file_type(file, ALLOWED_FILE_TYPES)

    # Read file content
    file_contents = await file.read()
    file_size = len(file_contents)

    # Check file size
    max_size_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB",
        )

    # Generate unique filename
    folder_prefix = f"{UPLOAD_FOLDER}{category}/"
    user_folder = f"user_{current_user.id}/"
    unique_filename = generate_unique_filename(
        file.filename, folder_prefix + user_folder
    )

    # Calculate file hash for integrity and deduplication
    file_hash = await calculate_file_hash(file_contents)

    # Collect metadata from form fields
    metadata = {}
    for key, value in dict(request.form).items():  # noqa: F821
        if key.startswith("metadata_"):
            metadata_key = key[9:]  # Remove "metadata_" prefix
            try:
                # Try to parse JSON if it's a complex structure
                metadata[metadata_key] = json.loads(value)
            except (json.JSONDecodeError, TypeError):
                # Otherwise use as-is
                metadata[metadata_key] = value

    # Process shared_with if provided
    shared_with_list = []
    if shared_with:
        try:
            shared_with_list = json.loads(shared_with)
        except json.JSONDecodeError:
            # If not valid JSON, assume it's a comma-separated list of IDs
            shared_with_list = [
                id.strip() for id in shared_with.split(",") if id.strip()
            ]

    # Calculate expiration date if provided
    expires_at = None
    if expires_after_days and expires_after_days > 0:
        expires_at = datetime.utcnow() + timedelta(days=expires_after_days)

    try:
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=unique_filename,
            Body=file_contents,
            ContentType=content_type,
            Metadata={
                "user_id": str(current_user.id),
                "original_filename": file.filename,
                "file_hash": file_hash,
                "category": category,
                "reference_id": reference_id or "",
            },
        )

        # Generate URLs
        permanent_url = f"https://{BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"

        # Generate thumbnail for images if applicable
        thumbnail_url = None
        if content_type.startswith("image/"):
            # Implement thumbnail generation (optional)
            pass

        # Determine owner type based on user
        owner_type = "user"
        if hasattr(current_user, "user_type"):
            if current_user.user_type == "professor":
                owner_type = "professor"
            elif current_user.user_type in ["admin", "school_admin"]:
                owner_type = "admin"

        # Create file record in database
        new_file = UserFile(
            user_id=current_user.id,
            file_key=unique_filename,
            file_name=file.filename,
            file_type=content_type,
            file_size=file_size,
            file_url=permanent_url,
            thumbnail_url=thumbnail_url,
            file_category=category,
            session_id=session_id,
            reference_id=reference_id,
            owner_type=owner_type,
            is_public=is_public,
            sharing_level=sharing_level,
            shared_with=shared_with_list,
            course_id=int(course_id) if course_id and course_id.isdigit() else None,
            school_id=int(school_id) if school_id and school_id.isdigit() else None,
            department_id=int(department_id)
            if department_id and department_id.isdigit()
            else None,
            file_metadata={
                "original_filename": file.filename,
                "file_hash": file_hash,
                **metadata,
            },
            uploaded_by_name=getattr(current_user, "full_name", None)
            or f"User {current_user.id}",
            source_type="upload",
            created_at=datetime.utcnow(),
            expires_at=expires_at,
        )

        session.add(new_file)
        await session.commit()
        await session.refresh(new_file)

        # Generate presigned URL for immediate use
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": unique_filename},
            ExpiresIn=3600,  # URL valid for 1 hour
        )

        return {
            "id": new_file.id,
            "fileName": new_file.file_name,
            "contentType": new_file.file_type,
            "url": presigned_url,
            "permanentUrl": permanent_url if is_public else None,
            "size": file_size,
            "fileCategory": category,
            "isPublic": is_public,
            "sharingLevel": sharing_level,
            "metadata": {
                "referenceId": reference_id,
                "courseId": course_id,
                "uploadedBy": new_file.uploaded_by_name,
                "createdAt": new_file.created_at.isoformat(),
                "expiresAt": new_file.expires_at.isoformat()
                if new_file.expires_at
                else None,
            },
        }

    except ClientError as e:
        logger.error(f"S3 upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage",
        )


@router.get("/download/{file_id}", response_model=Dict[str, str])
async def download_file(
    file_id: str = Path(..., description="File ID or S3 key"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a presigned URL for downloading a file.
    Handles both database file IDs and direct S3 keys.
    """
    # Try to retrieve file from database
    try:
        # Check if file_id is a number (database ID)
        if file_id.isdigit():
            user_file_query = select(UserFile).where(UserFile.id == int(file_id))
            result = await session.execute(user_file_query)
            user_file = result.scalars().first()

            if user_file:
                # Check if user has permission
                if (
                    user_file.user_id != current_user.id
                    and not user_file.is_public
                    and current_user.user_type not in ["admin", "school_admin"]
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You don't have permission to access this file",
                    )

                # Check if file is marked as deleted
                if user_file.is_deleted:
                    raise HTTPException(
                        status_code=status.HTTP_410_GONE,
                        detail="This file has been deleted",
                    )

                # Use the S3 key from the database
                s3_key = user_file.file_key
            else:
                # Fall back to using the ID as a direct key
                s3_key = file_id
        else:
            # Direct S3 key provided
            s3_key = file_id

        # Generate a presigned URL for file download
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": s3_key},
            ExpiresIn=3600,  # URL valid for 1 hour
        )

        return {"url": presigned_url}

    except ClientError as e:
        logger.error(f"S3 presigned URL generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL",
        )


@router.delete("/{file_id}", response_model=FileDeleteResponse)
async def delete_file(
    file_id: str = Path(..., description="File ID or S3 key"),
    permanent: bool = Query(False, description="Permanently delete the file from S3"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a file as deleted in the database and optionally delete from S3.
    """
    # Try to retrieve file from database
    try:
        # Check if file_id is a number (database ID)
        if file_id.isdigit():
            user_file_query = select(UserFile).where(
                UserFile.id == int(file_id), not UserFile.is_deleted
            )
            result = await session.execute(user_file_query)
            user_file = result.scalars().first()

            if not user_file:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File not found or already deleted",
                )

            # Check if user has permission
            if user_file.user_id != current_user.id and current_user.user_type not in [
                "admin",
                "school_admin",
            ]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to delete this file",
                )

            # Mark the file as deleted in the database
            user_file.is_deleted = True
            user_file.updated_at = datetime.utcnow()
            await session.commit()

            # If permanent deletion is requested, delete from S3
            if permanent:
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=user_file.file_key)
                return {"success": True, "message": "File permanently deleted"}

            return {"success": True, "message": "File marked as deleted"}
        else:
            # Direct S3 key provided - require admin for this operation
            if current_user.user_type not in ["admin", "school_admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to delete files by key",
                )

            # Delete object from S3
            s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_id)

            return {"success": True, "message": "File deleted by key"}

    except ClientError as e:
        logger.error(f"S3 delete error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file from storage",
        )


@router.get("/list", response_model=List[FileResponse])
async def list_user_files(
    category: Optional[str] = Query(None, description="Filter by file category"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    reference_id: Optional[str] = Query(None, description="Filter by reference ID"),
    include_deleted: bool = Query(False, description="Include deleted files"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    List files uploaded by the current user with filtering options.
    """
    # Build query
    query = select(UserFile).where(UserFile.user_id == current_user.id)

    # Apply filters
    if category:
        query = query.where(UserFile.file_category == category)

    if session_id:
        query = query.where(UserFile.session_id == session_id)

    if reference_id:
        query = query.where(UserFile.reference_id == reference_id)

    if not include_deleted:
        query = query.where(not UserFile.is_deleted)

    # Add pagination
    query = query.order_by(UserFile.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    result = await session.execute(query)
    user_files = result.scalars().all()

    # Generate presigned URLs for each file
    files_list = []
    for file in user_files:
        try:
            # Generate presigned URL
            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET_NAME, "Key": file.file_key},
                ExpiresIn=3600,  # URL valid for 1 hour
            )

            files_list.append(
                {
                    "id": str(file.id),
                    "fileName": file.file_name,
                    "contentType": file.file_type,
                    "url": presigned_url,
                    "permanent_url": file.file_url if file.is_public else None,
                    "size": file.file_size,
                    "metadata": {
                        "category": file.file_category,
                        "is_public": file.is_public,
                        "is_deleted": file.is_deleted,
                        "created_at": file.created_at.isoformat(),
                        "expires_at": file.expires_at.isoformat()
                        if file.expires_at
                        else None,
                        **file.metadata,
                    },
                }
            )
        except ClientError as e:
            # Skip files that have issues with presigned URLs
            logger.warning(f"Error generating presigned URL for file {file.id}: {e}")
            continue

    return files_list


@router.get("/user/{user_id}/files", response_model=List[FileResponse])
async def get_user_files(
    user_id: int,
    category: Optional[str] = Query(None, description="Filter by file category"),
    is_public: bool = Query(True, description="Only show public files"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get files uploaded by a specific user.
    Only admins, school admins, or the user themselves can access all files.
    Others can only access public files.
    """
    # Check permissions
    can_access_all = current_user.id == user_id or current_user.user_type in [
        "admin",
        "school_admin",
    ]

    # Build query
    query = select(UserFile).where(UserFile.user_id == user_id, not UserFile.is_deleted)

    # Apply category filter if provided
    if category:
        query = query.where(UserFile.file_category == category)

    # Non-admins can only see public files of other users
    if not can_access_all:
        query = query.where(UserFile.is_public)
    elif is_public:
        # Optional filter for public files only
        query = query.where(UserFile.is_public)

    # Add pagination
    query = query.order_by(UserFile.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    result = await session.execute(query)
    user_files = result.scalars().all()

    # Generate presigned URLs for each file
    files_list = []
    for file in user_files:
        try:
            # Generate presigned URL
            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET_NAME, "Key": file.file_key},
                ExpiresIn=3600,  # URL valid for 1 hour
            )

            files_list.append(
                {
                    "id": str(file.id),
                    "fileName": file.file_name,
                    "contentType": file.file_type,
                    "url": presigned_url,
                    "permanent_url": file.file_url if file.is_public else None,
                    "size": file.file_size,
                    "metadata": {
                        "category": file.file_category,
                        "is_public": file.is_public,
                        "created_at": file.created_at.isoformat(),
                        **file.metadata,
                    },
                }
            )
        except ClientError as e:
            # Skip files that have issues with presigned URLs
            logger.warning(f"Error generating presigned URL for file {file.id}: {e}")
            continue

    return files_list


# Maintenance endpoints (admin only)
@router.post("/cleanup", response_model=Dict[str, Any])
async def cleanup_expired_files(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Clean up expired files from S3 and update database records.
    Only accessible to admins.
    """
    # Check permissions
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can run cleanup tasks",
        )

    # Find expired files
    now = datetime.utcnow()

    # Query for files with expiration date in the past and not deleted
    query = select(UserFile).where(UserFile.expires_at < now, not UserFile.is_deleted)

    result = await session.execute(query)
    expired_files = result.scalars().all()

    # Schedule deletion in background task
    for file in expired_files:
        # Mark as deleted in database
        file.is_deleted = True
        file.updated_at = now

        # Delete from S3 in background
        background_tasks.add_task(delete_s3_object, file.file_key)

    # Commit database changes
    await session.commit()

    return {
        "success": True,
        "files_cleaned": len(expired_files),
        "message": f"Cleaned up {len(expired_files)} expired files",
    }


# Health check endpoint
@router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """
    Health check endpoint to verify S3 connectivity.
    """
    try:
        # Try to list a small number of objects to verify S3 connectivity
        s3_client.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=1)

        return {
            "status": "healthy",
            "storage": "connected",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except ClientError as e:
        logger.error(f"S3 health check failed: {e}")
        return {
            "status": "unhealthy",
            "storage": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


@router.post("/files/{file_id}/share", response_model=FileResponse)
async def share_file(
    file_id: int,
    share_data: ShareFileRequest,
    current_user=Depends(get_current_user),
    session=Depends(get_session),
):
    """Share a file with specific users or groups"""
    # Get the file and verify ownership
    file = await session.execute(
        select(UserFile).where(
            UserFile.id == file_id,
            UserFile.user_id == current_user.id,
            not UserFile.is_deleted,
        )
    ).scalar_one_or_none()

    if not file:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # Update sharing settings
    if share_data.sharing_level:
        file.sharing_level = share_data.sharing_level

        # Update public flag if needed
        if share_data.sharing_level == "public":
            file.is_public = True
        elif file.is_public and share_data.sharing_level != "public":
            file.is_public = False

    # Update shared_with list
    if share_data.shared_with:
        # Append new shares to existing list, avoiding duplicates
        existing_ids = [
            item.get("id")
            for item in file.shared_with
            if isinstance(item, dict) and "id" in item
        ]

        for share in share_data.shared_with:
            if (
                isinstance(share, dict)
                and "id" in share
                and share["id"] not in existing_ids
            ):
                file.shared_with.append(share)
            elif isinstance(share, str) and share not in existing_ids:
                file.shared_with.append({"id": share, "type": "user"})

    file.updated_at = datetime.utcnow()
    session.add(file)
    await session.commit()
    await session.refresh(file)

    # Generate presigned URL
    presigned_url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": file.file_key},
        ExpiresIn=3600,  # URL valid for 1 hour
    )

    return {
        "id": file.id,
        "fileName": file.file_name,
        "contentType": file.file_type,
        "url": presigned_url,
        "permanentUrl": file.file_url if file.is_public else None,
        "size": file.file_size,
        "isPublic": file.is_public,
        "sharingLevel": file.sharing_level,
        "sharedWith": file.shared_with,
        "metadata": file.file_metadata,
    }


@router.get("/educational-support", response_model=List[FileResponse])
async def get_educational_support_files(
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    type: Optional[str] = Query(None, description="Filter by support type"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get educational support materials available to the user.
    This includes:
    - Files marked as educational resources
    - Course materials for courses the user is enrolled in
    - School resources
    - Public educational materials
    """
    # Start with base query for educational support files
    query = select(UserFile).where(
        UserFile.file_category.in_(
            ["education", "course_material", "textbook", "reference"]
        ),
        not UserFile.is_deleted,
    )

    # Apply type filter if provided
    if type:
        query = query.where(UserFile.file_metadata["type"].astext == type)

    # Apply course filter if provided
    if course_id:
        query = query.where(UserFile.course_id == course_id)

    # Apply subject filter if provided
    if subject_id:
        query = query.where(
            UserFile.file_metadata["subject_id"].astext == str(subject_id)
        )

    # Apply category filter if provided
    if category:
        query = query.where(UserFile.file_category == category)

    # Apply access control filters
    # 1. Files owned by the user
    # 2. Files shared with the user
    # 3. Public educational files
    # 4. Files from courses the user is enrolled in
    # 5. Files from the user's school (if applicable)

    access_conditions = [
        UserFile.user_id == current_user.id,  # User's own files
        UserFile.is_public,  # Public files
    ]

    # Check for files shared directly with this user
    shared_condition = UserFile.shared_with.contains(
        [{"id": str(current_user.id), "type": "user"}]
    )
    access_conditions.append(shared_condition)

    # If user has a school_id, include files from their school
    if hasattr(current_user, "school_id") and current_user.school_id:
        school_condition = UserFile.school_id == current_user.school_id
        access_conditions.append(school_condition)

    # Add combined access conditions to query
    query = query.where(or_(*access_conditions))  # Use SQLAlchemy's or_ function

    # Add limit and ordering
    query = query.order_by(UserFile.created_at.desc())
    query = query.limit(limit)

    # Execute query
    result = await session.execute(query)
    support_files = result.scalars().all()

    # Generate responses with presigned URLs
    files_list = []
    for file in support_files:
        try:
            # Generate presigned URL
            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET_NAME, "Key": file.file_key},
                ExpiresIn=3600,  # URL valid for 1 hour
            )

            files_list.append(
                {
                    "id": str(file.id),
                    "fileName": file.file_name,
                    "contentType": file.file_type,
                    "url": presigned_url,
                    "permanent_url": file.file_url if file.is_public else None,
                    "size": file.file_size,
                    "metadata": {
                        "category": file.file_category,
                        "courseId": file.course_id,
                        "schoolId": file.school_id,
                        "uploadedBy": file.uploaded_by_name,
                        "createdAt": file.created_at.isoformat(),
                        **file.file_metadata,
                    },
                }
            )
        except ClientError as e:
            # Skip files that have issues with presigned URLs
            logger.warning(f"Error generating presigned URL for file {file.id}: {e}")
            continue

    return files_list
