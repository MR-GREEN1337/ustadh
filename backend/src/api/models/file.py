# backend/src/api/models/file.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class FileUploadResponse(BaseModel):
    """Response model for file uploads"""

    id: int
    fileName: str
    contentType: str
    url: str
    permanentUrl: Optional[str] = None
    size: int
    isPublic: bool
    sharingLevel: str
    fileCategory: str
    metadata: Optional[Dict[str, Any]] = None
    uploadedAt: datetime


class FileListItem(BaseModel):
    """Item in file list responses"""

    id: int
    fileName: str
    contentType: str
    url: str
    permanentUrl: Optional[str] = None
    size: int
    isPublic: bool
    sharingLevel: str
    fileCategory: str
    createdAt: datetime
    metadata: Optional[Dict[str, Any]] = None


class FileListResponse(BaseModel):
    """Response model for file listing"""

    files: List[FileListItem]
    total: int
    page: int
    limit: int


class FileDeleteResponse(BaseModel):
    """Response model for file deletion"""

    success: bool
    message: str


class FileDownloadResponse(BaseModel):
    """Response model for file download URLs"""

    url: str
    fileName: str
    contentType: str


class ShareFileRequest(BaseModel):
    """Request model for sharing files"""

    sharing_level: Optional[str] = Field(
        None,
        description="Level of sharing: private, shared, course, department, school, public",
    )
    shared_with: Optional[List[Dict[str, Any]]] = Field(
        None, description="List of users to share with, each with id and type"
    )
    course_id: Optional[int] = Field(
        None, description="Course ID to associate with this file"
    )
    department_id: Optional[int] = Field(
        None, description="Department ID to associate with this file"
    )
    school_id: Optional[int] = Field(
        None, description="School ID to associate with this file"
    )
    expires_after_days: Optional[int] = Field(
        None, description="Number of days until file expires"
    )


class AttachFileRequest(BaseModel):
    """Request model for attaching files to entities like course materials"""

    file_id: int
    replace_existing: bool = Field(
        False, description="Whether to replace any existing file"
    )
    update_sharing: bool = Field(
        True, description="Whether to update file sharing based on entity visibility"
    )


class FileAccessRequest(BaseModel):
    """Request model for checking file access"""

    file_id: int
    user_id: Optional[int] = None
    user_type: Optional[str] = None
    course_id: Optional[int] = None
    department_id: Optional[int] = None
    school_id: Optional[int] = None


class FileAccessResponse(BaseModel):
    """Response model for file access checks"""

    has_access: bool
    access_level: str  # owner, shared, course, department, school, public, none
    reason: Optional[str] = None


class FileBatchActionRequest(BaseModel):
    """Request model for batch actions on files"""

    file_ids: List[int]
    action: str  # delete, share, move, archive
    action_params: Optional[Dict[str, Any]] = None


class FileBatchActionResponse(BaseModel):
    """Response model for batch actions on files"""

    success: bool
    processed: int
    failed: int
    failures: Optional[Dict[str, str]] = None  # file_id -> error message


class FileUpdateRequest(BaseModel):
    """Request model for updating file metadata"""

    fileName: Optional[str] = None
    fileCategory: Optional[str] = None
    isPublic: Optional[bool] = None
    sharingLevel: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    expiresAt: Optional[datetime] = None
