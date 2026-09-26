import os
import re
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.services.embedding_service import EMBEDDING_ENABLED, embed_and_store

router = APIRouter()

_EMBEDDED_FIELDS = {"title", "description", "type", "category"}

@router.get("/", response_model=List[ResourceResponse])
def get_resources(
    skip: int = 0, 
    limit: int = 100,
    search: str = None,
    type_filter: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    
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
def get_resource(id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

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
def delete_resource(id: int, db: Session = Depends(get_db)):
    db_resource = db.query(Resource).filter(Resource.id == id).first()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    db.delete(db_resource)
    db.commit()
    return {"message": "Resource deleted successfully"}

@router.get("/stats/count")
def get_resource_count(db: Session = Depends(get_db)):
    return {"count": db.query(Resource).count()}