import os
import re
import uuid
import shutil
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.resource import Resource
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.services.embedding_service import EMBEDDING_ENABLED, embed_and_store
from app.services.email_service import send_admin_new_resource_alert
from app.dependencies import get_current_user, get_current_user_optional, require_admin

router = APIRouter()

_EMBEDDED_FIELDS = {"title", "description", "type", "category"}
EXCLUDED_STATUSES = ["pending", "rejected"]

RESOURCE_UPLOAD_DIR = "uploads/resources"
os.makedirs(RESOURCE_UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[ResourceResponse])
def get_resources(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    type_filter: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Resource).filter(Resource.status.notin_(EXCLUDED_STATUSES))

    if search:
        query = query.filter(
            (Resource.title.contains(search)) | 
            (Resource.description.contains(search))
        )
    if type_filter and type_filter != "All":
        query = query.filter(Resource.type == type_filter)
    if category and category != "All":
        query = query.filter(Resource.category == category)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=ResourceResponse)
def get_resource(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.status in ("pending", "rejected"):
        is_owner_or_admin = current_user and (
            current_user.role == "admin" or current_user.id == resource.submitted_by
        )
        if not is_owner_or_admin:
            raise HTTPException(status_code=403, detail="This resource is not yet publicly available")

    # Increment view counter atomically (same pattern as Project.views_count)
    db.query(Resource).filter(Resource.id == id).update(
        {"views_count": func.coalesce(Resource.views_count, 0) + 1}
    )
    db.commit()
    db.refresh(resource)
    return resource

@router.get("/{id}/download")
def download_resource(id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not resource.file_url:
        raise HTTPException(status_code=404, detail="This resource has no file to download")

    # Increment download counter atomically
    db.query(Resource).filter(Resource.id == id).update(
        {"downloads": func.coalesce(Resource.downloads, 0) + 1}
    )
    db.commit()

    # Locally-uploaded file (admin panel): stream it back with Content-Disposition:
    # attachment so the browser actually saves it, instead of just navigating to it.
    if resource.file_path and os.path.exists(resource.file_path):
        ext = os.path.splitext(resource.file_path)[1]
        safe_name = re.sub(r"[^\w\-]+", "_", resource.title).strip("_") or "resource"
        return FileResponse(
            resource.file_path,
            filename=f"{safe_name}{ext}",
            media_type=resource.mime_type or "application/octet-stream",
        )

    # Admin-entered external link: we can't force a cross-origin download, redirect to it.
    return RedirectResponse(url=resource.file_url, status_code=307)

@router.post("/submit", response_model=ResourceResponse)
def submit_resource(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Public submission: title + type + category + file. A logged-in user proposes a resource,
    which stays hidden from the library until an admin approves it (mirrors POST /projects/submit) —
    unless the submitter IS an admin, in which case it's published immediately, no review needed."""
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(RESOURCE_UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    is_admin = current_user.role == "admin"
    now = datetime.now(timezone.utc)

    db_resource = Resource(
        title=title,
        type=type,
        category=category,
        file_path=file_path,
        file_url=f"/uploads/resources/{unique_filename}",
        file_size=os.path.getsize(file_path),
        mime_type=file.content_type,
        status="approved" if is_admin else "pending",
        submitted_by=current_user.id,
        submitted_at=now,
        reviewed_at=now if is_admin else None,
        reviewed_by=current_user.id if is_admin else None,
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)

    if not is_admin:
        background_tasks.add_task(
            send_admin_new_resource_alert,
            db_resource.title,
            current_user.organization_name or current_user.email,
            db_resource.id,
        )
    return db_resource

@router.post("/", response_model=ResourceResponse)
def create_resource(resource: ResourceCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_resource = Resource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    if EMBEDDING_ENABLED:
        background_tasks.add_task(embed_and_store, "resource", db_resource.id)
    return db_resource

@router.put("/{id}", response_model=ResourceResponse)
def update_resource(id: int, resource: ResourceUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_resource = db.query(Resource).filter(Resource.id == id).first()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = resource.model_dump(exclude_unset=True)
    changed_fields = [
        field for field, value in update_data.items()
        if getattr(db_resource, field) != value
    ]
    for field, value in update_data.items():
        setattr(db_resource, field, value)

    db.commit()
    db.refresh(db_resource)

    if EMBEDDING_ENABLED and _EMBEDDED_FIELDS.intersection(changed_fields):
        background_tasks.add_task(embed_and_store, "resource", db_resource.id)

    return db_resource

@router.delete("/{id}")
def delete_resource(id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    db_resource = db.query(Resource).filter(Resource.id == id).first()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if db_resource.file_path and os.path.exists(db_resource.file_path):
        os.remove(db_resource.file_path)

    db.delete(db_resource)
    db.commit()
    return {"message": "Resource deleted successfully"}

@router.get("/stats/count")
def get_resource_count(db: Session = Depends(get_db)):
    return {"count": db.query(Resource).count()}