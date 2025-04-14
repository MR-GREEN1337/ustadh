from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, desc, asc
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import asyncio
import json

from src.db.postgresql import get_session
from src.db.models.user import User
from src.db.models.notes import Note, NoteFolder, NoteCollaborator, AISuggestion
from src.api.endpoints.auth import get_current_active_user
from src.services.note_ai_service import NoteAIService

# Additional imports for WebSocket endpoint
from fastapi import WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/notes", tags=["notes"])


# Models
class NoteBase(BaseModel):
    title: str
    content: str
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    ai_enhanced: Optional[bool] = None


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    ai_enhanced: Optional[bool] = None


class NoteResponse(NoteBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    version: int
    is_shared: bool
    collaborators: Optional[List[Dict[str, Any]]] = None
    ai_suggestions: Optional[List[Dict[str, Any]]] = None

    class Config:
        orm_mode = True


class FolderBase(BaseModel):
    name: str
    parent_id: Optional[str] = None


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None


class FolderResponse(FolderBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class CollaboratorCreate(BaseModel):
    email: EmailStr
    permissions: str = Field(..., pattern="^(read|write|admin)$")


class CollaboratorResponse(BaseModel):
    id: str
    user_id: str
    note_id: str
    permissions: str
    joined_at: datetime
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

    class Config:
        orm_mode = True


class AISuggestionCreate(BaseModel):
    content: str
    type: str = Field(..., pattern="^(completion|clarification|connection|insight)$")


class AISuggestionResponse(BaseModel):
    id: str
    content: str
    type: str
    created_at: datetime
    applied: bool

    class Config:
        orm_mode = True


class AISuggestionsList(BaseModel):
    suggestions: List[AISuggestionResponse]


class NotesList(BaseModel):
    notes: List[NoteResponse]
    total: int
    page: int
    page_size: int


class FoldersList(BaseModel):
    folders: List[FolderResponse]


# Helper functions
async def get_note_by_id(note_id: str, db: AsyncSession) -> Optional[Note]:
    """Get note by ID."""
    result = await db.execute(select(Note).where(Note.id == note_id))
    return result.scalars().first()


async def check_note_access(
    note_id: str, user_id: int, required_permission: str, db: AsyncSession
) -> Note:
    """Check if user has access to the note with specified permission level."""
    note = await get_note_by_id(note_id, db)

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    # Owner has all permissions
    if str(note.owner_id) == str(user_id):
        return note

    # Check collaborator permissions
    result = await db.execute(
        select(NoteCollaborator).where(
            NoteCollaborator.note_id == note_id, NoteCollaborator.user_id == user_id
        )
    )
    collaborator = result.scalars().first()

    if not collaborator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this note",
        )

    # Check permission level
    if required_permission == "read":
        # Any permission level includes read
        return note
    elif required_permission == "write":
        # write or admin permission required
        if collaborator.permissions in ["write", "admin"]:
            return note
    elif required_permission == "admin":
        # Only admin permission
        if collaborator.permissions == "admin":
            return note

    # Permission not sufficient
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"You don't have {required_permission} permission for this note",
    )


async def get_folder_by_id(folder_id: str, db: AsyncSession) -> Optional[NoteFolder]:
    """Get folder by ID."""
    result = await db.execute(select(NoteFolder).where(NoteFolder.id == folder_id))
    return result.scalars().first()


async def check_folder_access(
    folder_id: str, user_id: int, db: AsyncSession
) -> NoteFolder:
    """Check if user has access to the folder."""
    folder = await get_folder_by_id(folder_id, db)

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )

    if str(folder.owner_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this folder",
        )

    return folder


async def get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    """Get user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def format_note_response(note: Note, db: AsyncSession) -> Dict[str, Any]:
    """Format note response with collaborators and other related data."""
    # Get collaborators
    result = await db.execute(
        select(NoteCollaborator).where(NoteCollaborator.note_id == note.id)
    )
    collaborators = result.scalars().all()

    collaborator_data = []
    for collab in collaborators:
        # Get user info
        user_result = await db.execute(select(User).where(User.id == collab.user_id))
        user = user_result.scalars().first()

        if user:
            collaborator_data.append(
                {
                    "id": str(collab.id),
                    "user_id": str(collab.user_id),
                    "note_id": str(collab.note_id),
                    "permissions": collab.permissions,
                    "joined_at": collab.joined_at,
                    "name": user.full_name,
                    "email": user.email,
                    # You can add avatar if you have it in your user model
                }
            )

    # Format note data
    note_data = {
        "id": str(note.id),
        "title": note.title,
        "content": note.content,
        "folder_id": str(note.folder_id) if note.folder_id else None,
        "tags": note.tags or [],
        "owner_id": str(note.owner_id),
        "created_at": note.created_at,
        "updated_at": note.updated_at,
        "version": note.version,
        "is_shared": len(collaborators) > 0,
        "ai_enhanced": note.ai_enhanced,
        "collaborators": collaborator_data,
    }

    # If the note is AI enhanced, include latest non-applied suggestions
    if note.ai_enhanced:
        result = await db.execute(
            select(AISuggestion)
            .where(and_(AISuggestion.note_id == note.id, not AISuggestion.applied))
            .order_by(desc(AISuggestion.created_at))
        )
        suggestions = result.scalars().all()

        note_data["ai_suggestions"] = [
            {
                "id": str(suggestion.id),
                "content": suggestion.content,
                "type": suggestion.type,
                "created_at": suggestion.created_at,
                "applied": suggestion.applied,
            }
            for suggestion in suggestions
        ]

    return note_data


# Note endpoints
@router.get("", response_model=NotesList)
async def get_notes(
    query: Optional[str] = None,
    folder_id: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    shared: Optional[bool] = None,
    ai_enhanced: Optional[bool] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Get user's notes with optional filtering and pagination."""
    # Validate sort parameters
    if sort_by not in ["updated_at", "created_at", "title"]:
        sort_by = "updated_at"

    if sort_order not in ["asc", "desc"]:
        sort_order = "desc"

    # Build base query
    base_query = select(Note)

    # Filter by owner or collaborator
    collaboration_subquery = (
        select(NoteCollaborator.note_id)
        .where(NoteCollaborator.user_id == current_user.id)
        .scalar_subquery()
    )

    base_query = base_query.where(
        or_(Note.owner_id == current_user.id, Note.id.in_(collaboration_subquery))
    )

    # Apply filters
    if query:
        search_term = f"%{query}%"
        base_query = base_query.where(
            or_(
                Note.title.ilike(search_term),
                Note.content.ilike(search_term),
                Note.tags.contains([query]) if query else False,
            )
        )

    if folder_id:
        base_query = base_query.where(Note.folder_id == folder_id)
    elif folder_id == "":  # Explicitly looking for root notes
        base_query = base_query.where(Note.folder_id.is_(None))

    if tags:
        for tag in tags:
            base_query = base_query.where(Note.tags.contains([tag]))

    if shared is not None:
        if shared:
            # Notes that have collaborators
            collaboration_exists_subquery = (
                select(NoteCollaborator.note_id)
                .where(NoteCollaborator.note_id == Note.id)
                .exists()
                .label("has_collaborators")
            )
            base_query = base_query.where(collaboration_exists_subquery)
        else:
            # Notes that have no collaborators
            collaboration_exists_subquery = (
                select(NoteCollaborator.note_id)
                .where(NoteCollaborator.note_id == Note.id)
                .exists()
                .label("has_collaborators")
            )
            base_query = base_query.where(~collaboration_exists_subquery)

    if ai_enhanced is not None:
        base_query = base_query.where(Note.ai_enhanced == ai_enhanced)

    # Count total matching notes (for pagination)
    count_query = base_query.with_only_columns([Note.id]).distinct()
    count_result = await db.execute(count_query)
    total_notes = len(count_result.scalars().all())

    # Apply sorting
    if sort_by == "title":
        base_query = base_query.order_by(
            asc(Note.title) if sort_order == "asc" else desc(Note.title)
        )
    elif sort_by == "created_at":
        base_query = base_query.order_by(
            asc(Note.created_at) if sort_order == "asc" else desc(Note.created_at)
        )
    else:  # default to updated_at
        base_query = base_query.order_by(
            asc(Note.updated_at) if sort_order == "asc" else desc(Note.updated_at)
        )

    # Apply pagination
    base_query = base_query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db.execute(base_query)
    notes = result.scalars().all()

    # Format notes with collaborators and other data
    formatted_notes = []
    for note in notes:
        formatted_note = await format_note_response(note, db)
        formatted_notes.append(formatted_note)

    return {
        "notes": formatted_notes,
        "total": total_notes,
        "page": page,
        "page_size": page_size,
    }


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new note."""
    # Check if folder exists and user has access
    if note_data.folder_id:
        await check_folder_access(note_data.folder_id, current_user.id, db)

    # Create new note
    new_note = Note(
        id=str(uuid.uuid4()),
        title=note_data.title,
        content=note_data.content,
        folder_id=note_data.folder_id,
        tags=note_data.tags or [],
        owner_id=current_user.id,
        ai_enhanced=note_data.ai_enhanced or False,
        version=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)

    # Format response
    formatted_note = await format_note_response(new_note, db)
    return formatted_note


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Get a specific note by ID."""
    # Check access (read permission)
    note = await check_note_access(note_id, current_user.id, "read", db)

    # Format response
    formatted_note = await format_note_response(note, db)
    return formatted_note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Update a note."""
    # Check access (write permission)
    note = await check_note_access(note_id, current_user.id, "write", db)

    # Check if folder exists and user has access if changing folder
    if note_data.folder_id is not None and note_data.folder_id != note.folder_id:
        if note_data.folder_id:  # If not setting to None
            await check_folder_access(note_data.folder_id, current_user.id, db)

    # Update note fields
    update_data = note_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)

    # Update metadata
    note.updated_at = datetime.utcnow()
    note.version += 1

    # Save changes
    db.add(note)
    await db.commit()
    await db.refresh(note)

    # Format response
    formatted_note = await format_note_response(note, db)
    return formatted_note


@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Delete a note."""
    # Check access (must be owner or admin collaborator)
    note = await check_note_access(note_id, current_user.id, "admin", db)

    # Delete all collaborators first
    await db.execute(
        select(NoteCollaborator).where(NoteCollaborator.note_id == note_id).delete()
    )

    # Delete all AI suggestions
    await db.execute(
        select(AISuggestion).where(AISuggestion.note_id == note_id).delete()
    )

    # Delete note
    await db.delete(note)
    await db.commit()

    return {"message": "Note deleted successfully"}


# Folder endpoints
@router.get("/folders", response_model=FoldersList)
async def get_folders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Get user's note folders."""
    result = await db.execute(
        select(NoteFolder)
        .where(NoteFolder.owner_id == current_user.id)
        .order_by(asc(NoteFolder.name))
    )
    folders = result.scalars().all()

    return {"folders": folders}


@router.post(
    "/folders", response_model=FolderResponse, status_code=status.HTTP_201_CREATED
)
async def create_folder(
    folder_data: FolderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new folder."""
    # Check if parent folder exists and user has access
    if folder_data.parent_id:
        await check_folder_access(folder_data.parent_id, current_user.id, db)

    # Create new folder
    new_folder = NoteFolder(
        id=str(uuid.uuid4()),
        name=folder_data.name,
        parent_id=folder_data.parent_id,
        owner_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(new_folder)
    await db.commit()
    await db.refresh(new_folder)

    return new_folder


@router.put("/folders/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Update a folder."""
    # Check access
    folder = await check_folder_access(folder_id, current_user.id, db)

    # Check if parent folder exists and user has access if changing parent
    if folder_data.parent_id is not None and folder_data.parent_id != folder.parent_id:
        if folder_data.parent_id:  # If not setting to None
            await check_folder_access(folder_data.parent_id, current_user.id, db)

            # Check not setting parent to self or any descendant
            if folder_data.parent_id == folder_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot set folder as its own parent",
                )

            # Check for circular reference
            parent_id = folder_data.parent_id
            while parent_id:
                parent = await get_folder_by_id(parent_id, db)
                if not parent:
                    break
                if parent.id == folder_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot create circular folder structure",
                    )
                parent_id = parent.parent_id

    # Update folder fields
    update_data = folder_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)

    # Update timestamp
    folder.updated_at = datetime.utcnow()

    # Save changes
    db.add(folder)
    await db.commit()
    await db.refresh(folder)

    return folder


@router.delete("/folders/{folder_id}", status_code=status.HTTP_200_OK)
async def delete_folder(
    folder_id: str,
    recursive: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Delete a folder."""
    # Check access
    folder = await check_folder_access(folder_id, current_user.id, db)

    # Check if folder has child folders
    result = await db.execute(
        select(NoteFolder).where(NoteFolder.parent_id == folder_id)
    )
    child_folders = result.scalars().all()

    if child_folders and not recursive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder contains subfolders. Set recursive=true to delete all contents.",
        )

    # Check if folder has notes
    result = await db.execute(select(Note).where(Note.folder_id == folder_id))
    notes = result.scalars().all()

    if notes and not recursive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder contains notes. Set recursive=true to delete all contents.",
        )

    if recursive:
        # Delete all child folders recursively
        async def delete_folder_recursive(folder_id):
            # Get child folders
            result = await db.execute(
                select(NoteFolder).where(NoteFolder.parent_id == folder_id)
            )
            children = result.scalars().all()

            for child in children:
                await delete_folder_recursive(child.id)

            # Delete all notes in folder
            result = await db.execute(select(Note).where(Note.folder_id == folder_id))
            notes = result.scalars().all()

            for note in notes:
                # Delete collaborators and suggestions
                await db.execute(
                    select(NoteCollaborator)
                    .where(NoteCollaborator.note_id == note.id)
                    .delete()
                )
                await db.execute(
                    select(AISuggestion).where(AISuggestion.note_id == note.id).delete()
                )

                # Delete note
                await db.delete(note)

            # Delete folder
            result = await db.execute(
                select(NoteFolder).where(NoteFolder.id == folder_id)
            )
            folder = result.scalars().first()
            if folder:
                await db.delete(folder)

        await delete_folder_recursive(folder_id)
    else:
        # Just delete the empty folder
        await db.delete(folder)

    await db.commit()

    return {"message": "Folder deleted successfully"}


# Collaboration endpoints
@router.post(
    "/{note_id}/share",
    response_model=CollaboratorResponse,
    status_code=status.HTTP_201_CREATED,
)
async def share_note(
    note_id: str,
    collaborator_data: CollaboratorCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Share a note with another user."""
    # Check access (admin permission)
    await check_note_access(note_id, current_user.id, "admin", db)

    # Find user by email
    user = await get_user_by_email(collaborator_data.email, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found",
        )

    # Check if already a collaborator
    result = await db.execute(
        select(NoteCollaborator).where(
            NoteCollaborator.note_id == note_id, NoteCollaborator.user_id == user.id
        )
    )
    existing = result.scalars().first()

    if existing:
        # Update permissions if already a collaborator
        existing.permissions = collaborator_data.permissions
        db.add(existing)
        await db.commit()
        await db.refresh(existing)
        collaborator = existing
    else:
        # Create new collaborator
        collaborator = NoteCollaborator(
            id=str(uuid.uuid4()),
            note_id=note_id,
            user_id=user.id,
            permissions=collaborator_data.permissions,
            joined_at=datetime.utcnow(),
        )
        db.add(collaborator)
        await db.commit()
        await db.refresh(collaborator)

    return {
        "id": str(collaborator.id),
        "note_id": str(collaborator.note_id),
        "user_id": str(collaborator.user_id),
        "permissions": collaborator.permissions,
        "joined_at": collaborator.joined_at,
        "name": user.full_name,
        "email": user.email,
        # Avatar if available
    }


@router.delete("/{note_id}/collaborators/{user_id}", status_code=status.HTTP_200_OK)
async def remove_collaborator(
    note_id: str,
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Remove a collaborator from a note."""
    # Check access (admin permission)
    await check_note_access(note_id, current_user.id, "admin", db)

    # Find the collaborator
    result = await db.execute(
        select(NoteCollaborator).where(
            NoteCollaborator.note_id == note_id, NoteCollaborator.user_id == user_id
        )
    )
    collaborator = result.scalars().first()

    if not collaborator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collaborator not found"
        )

    # Remove collaborator
    await db.delete(collaborator)
    await db.commit()

    return {"message": "Collaborator removed successfully"}


# AI suggestions endpoints
@router.get("/{note_id}/ai-suggestions", response_model=AISuggestionsList)
async def get_ai_suggestions(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Get AI suggestions for a note."""
    # Check access (read permission)
    note = await check_note_access(note_id, current_user.id, "read", db)

    if not note.ai_enhanced:
        return {"suggestions": []}

    # Get suggestions, ordered by creation time (newest first)
    result = await db.execute(
        select(AISuggestion)
        .where(AISuggestion.note_id == note_id)
        .order_by(desc(AISuggestion.created_at))
    )
    suggestions = result.scalars().all()

    return {"suggestions": suggestions}


@router.post(
    "/{note_id}/ai-suggestions",
    response_model=AISuggestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ai_suggestion(
    note_id: str,
    suggestion_data: AISuggestionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Create an AI suggestion for a note (typically called by AI service)."""
    # Check access (write permission)
    note = await check_note_access(note_id, current_user.id, "write", db)

    # Ensure AI enhancement is enabled
    if not note.ai_enhanced:
        note.ai_enhanced = True
        db.add(note)

    # Create suggestion
    suggestion = AISuggestion(
        id=str(uuid.uuid4()),
        note_id=note_id,
        content=suggestion_data.content,
        type=suggestion_data.type,
        created_at=datetime.utcnow(),
        applied=False,
    )

    db.add(suggestion)
    await db.commit()
    await db.refresh(suggestion)

    return suggestion


# Update to the notes.py router file for WebSocket integration with the LLM class


@router.websocket("/ws/suggestions")
async def note_suggestions_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    note_id: Optional[str] = Query(None),
):
    """WebSocket endpoint for real-time AI suggestions while typing."""
    await websocket.accept()

    try:
        # Verify the token and get the user
        # This depends on your auth implementation, you may need to adjust
        from src.core.security import decode_access_token

        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            await websocket.close(code=1008, reason="Invalid authentication")
            return

        # Set up the database session
        async_session = get_session()

        # If a note_id is provided, verify access
        if note_id:
            db = await anext(async_session())
            try:
                await check_note_access(note_id, user_id, "write", db)
            except HTTPException:
                await websocket.close(code=1008, reason="Access denied")
                return
            finally:
                await db.close()

        # Callback function to send suggestions as they're generated
        async def send_suggestion_chunk(chunk: str):
            await websocket.send_text(
                json.dumps({"type": "suggestion_chunk", "content": chunk})
            )

        # Listen for messages from the client
        while True:
            # Wait for content from client
            data = await websocket.receive_text()
            content = json.loads(data)

            if content.get("type") == "note_content":
                note_text = content.get("content", "")

                # Send acknowledgment
                await websocket.send_text(
                    json.dumps(
                        {"type": "processing", "message": "Generating suggestions..."}
                    )
                )

                # Generate suggestion (in a non-blocking way)
                asyncio.create_task(
                    NoteAIService.generate_live_suggestions(
                        note_content=note_text, callback=send_suggestion_chunk
                    )
                )

            elif content.get("type") == "ping":
                # Respond to keep-alive pings
                await websocket.send_text(
                    json.dumps(
                        {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                    )
                )

    except WebSocketDisconnect:
        # Handle normal disconnection
        pass
    except Exception as e:
        # Log any errors
        import logging

        logging.error(f"WebSocket error: {str(e)}")

        # Try to send an error message if still connected
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": "An error occurred"})
            )
        except Exception as e:
            pass

        # Close with error
        try:
            await websocket.close(code=1011)
        except Exception:
            pass


@router.post("/{note_id}/generate-suggestions", response_model=AISuggestionsList)
async def generate_ai_suggestions(
    note_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Generate AI suggestions for a note using the AI service."""
    # Check access (write permission)
    note = await check_note_access(note_id, current_user.id, "write", db)

    # Ensure AI enhancement is enabled
    if not note.ai_enhanced:
        note.ai_enhanced = True
        db.add(note)
        await db.commit()
        await db.refresh(note)

    # Queue suggestion generation in the background
    await NoteAIService.generate_suggestions(note_id, db, background_tasks)

    # Return the current suggestions (which will be updated asynchronously)
    result = await db.execute(
        select(AISuggestion)
        .where(AISuggestion.note_id == note_id)
        .order_by(desc(AISuggestion.created_at))
    )
    suggestions = result.scalars().all()

    return {"suggestions": suggestions}


@router.post(
    "/{note_id}/ai-suggestions/{suggestion_id}/apply", response_model=NoteResponse
)
async def apply_ai_suggestion(
    note_id: str,
    suggestion_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    """Apply an AI suggestion to a note."""
    # Check access (write permission)
    note = await check_note_access(note_id, current_user.id, "write", db)

    # Get the suggestion
    result = await db.execute(
        select(AISuggestion).where(
            AISuggestion.id == suggestion_id, AISuggestion.note_id == note_id
        )
    )
    suggestion: Optional[AISuggestion] = result.scalars().first()

    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found"
        )

    if suggestion.applied:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Suggestion has already been applied",
        )

    # Apply suggestion based on type
    if suggestion.type == "completion":
        # For completion, append to the content
        note.content = note.content + "\n\n" + suggestion.content
    elif suggestion.type == "clarification":
        # For clarification, append to the content with a heading
        note.content = note.content + "\n\n## Clarification\n" + suggestion.content
    elif suggestion.type == "connection":
        # For connection, append to the content with a heading
        note.content = note.content + "\n\n## Related Concepts\n" + suggestion.content
    elif suggestion.type == "insight":
        # For insight, append to the content with a heading
        note.content = note.content + "\n\n## Insight\n" + suggestion.content
    else:
        # Default case
        note.content = note.content + "\n\n" + suggestion.content

    # Mark suggestion as applied
    suggestion.applied = True

    # Update note metadata
    note.updated_at = datetime.utcnow()
    note.version += 1

    # Save changes
    db.add(note)
    db.add(suggestion)
    await db.commit()
    await db.refresh(note)

    # Format response
    formatted_note = await format_note_response(note, db)
    return formatted_note
