from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
import os
import uuid
import shutil
import csv
import io
import logging
from datetime import datetime, timezone
from app.database import get_db
from app.models.project import Project
from app.models.document import ProjectDocument
from app.models.stakeholder import Stakeholder
from app.models.project_stakeholder import ProjectStakeholder
from app.models.project_relationships import ProjectSDG
from app.models.project_audit_log import ProjectAuditLog
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse
from app.services.report_service import report_service
from app.models.country import Country
from app.models.user import User
from app.dependencies import get_current_user, get_current_user_optional, require_admin

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = "uploads/projects"
os.makedirs(UPLOAD_DIR, exist_ok=True)

EXCLUDED_STATUSES = ["pending", "rejected"]


# ── Helper: apply shared filters to a base query ─────────────────────────────
def _apply_filters(query, country, sector, sdg_num, technology, search):
    query = query.filter(Project.status.notin_(EXCLUDED_STATUSES))
    if country:
        query = query.join(Country, Country.id == Project.country_id).filter(Country.name == country)
    if sector:
        query = query.filter(Project.sector == sector)
    if sdg_num is not None:
        query = query.filter(
            or_(
                Project.sdg_alignment.op('~*')(f'SDG\\s*{sdg_num}(:|\\s|$)'),
            )
        )
    if technology:
        query = query.filter(Project.ai_technology == technology)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(Project.title.ilike(pattern), Project.description.ilike(pattern))
        )
    return query


@router.get("/user/{user_id}", response_model=List[ProjectResponse])
def get_user_projects(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own projects")
    return db.query(Project).filter(
        Project.user_id == user_id
    ).order_by(Project.submitted_at.desc()).all()


@router.get("/meta")
def get_project_meta(db: Session = Depends(get_db)):
    """Distinct sectors and technologies for filter dropdowns."""
    sectors = (
        db.query(Project.sector)
        .filter(Project.sector.isnot(None), Project.sector != '', Project.status.notin_(EXCLUDED_STATUSES))
        .distinct()
        .all()
    )
    technologies = (
        db.query(Project.ai_technology)
        .filter(Project.ai_technology.isnot(None), Project.ai_technology != '', Project.status.notin_(EXCLUDED_STATUSES))
        .distinct()
        .all()
    )
    return {
        "sectors": sorted([s[0] for s in sectors]),
        "technologies": sorted([t[0] for t in technologies]),
    }


@router.get("/", response_model=ProjectListResponse)
def get_projects(
    country: Optional[str] = None,
    sector: Optional[str] = None,
    sdg_num: Optional[int] = None,
    technology: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "newest",
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    try:
        # Count query (no joinedload — faster)
        count_q = db.query(func.count(Project.id.distinct()))
        count_q = count_q.filter(Project.status.notin_(EXCLUDED_STATUSES))
        if country:
            count_q = count_q.join(Country, Country.id == Project.country_id).filter(Country.name == country)
        if sector:
            count_q = count_q.filter(Project.sector == sector)
        if sdg_num is not None:
            count_q = count_q.filter(Project.sdg_alignment.op('~*')(f'SDG\\s*{sdg_num}(:|\\s|$)'))
        if technology:
            count_q = count_q.filter(Project.ai_technology == technology)
        if search:
            pattern = f"%{search}%"
            count_q = count_q.filter(or_(Project.title.ilike(pattern), Project.description.ilike(pattern)))
        total = count_q.scalar() or 0

        # Data query
        q = db.query(Project).options(
            joinedload(Project.owner),
            joinedload(Project.country),
            joinedload(Project.stakeholder_associations).joinedload(ProjectStakeholder.stakeholder),
            joinedload(Project.documents),
        ).filter(Project.status.notin_(EXCLUDED_STATUSES))

        if country:
            q = q.join(Country, Country.id == Project.country_id).filter(Country.name == country)
        if sector:
            q = q.filter(Project.sector == sector)
        if sdg_num is not None:
            q = q.filter(Project.sdg_alignment.op('~*')(f'SDG\\s*{sdg_num}(:|\\s|$)'))
        if technology:
            q = q.filter(Project.ai_technology == technology)
        if search:
            pattern = f"%{search}%"
            q = q.filter(or_(Project.title.ilike(pattern), Project.description.ilike(pattern)))

        if sort_by == "oldest":
            q = q.order_by(Project.submitted_at.asc())
        elif sort_by == "title":
            q = q.order_by(Project.title.asc())
        else:
            q = q.order_by(Project.submitted_at.desc())

        items = q.offset(skip).limit(limit).all()
        logger.info(f"GET /projects returned {len(items)}/{total} projects")
        return {"items": items, "total": total}

    except Exception as e:
        logger.error(f"Error fetching projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


CSV_EXPORT_MAX_ROWS = 5000


@router.get("/export")
def export_projects_csv(
    country: Optional[str] = None,
    sector: Optional[str] = None,
    sdg_num: Optional[int] = None,
    technology: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = _apply_filters(
        db.query(Project).options(joinedload(Project.country)),
        country, sector, sdg_num, technology, search,
    ).order_by(Project.submitted_at.desc()).limit(CSV_EXPORT_MAX_ROWS)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "Title", "Country", "Sector", "AI Technology", "SDG Alignment", "Status",
        "Start Date", "End Date", "Budget", "Planned Duration", "Submitted At",
    ])
    for p in query.all():
        writer.writerow([
            p.title,
            p.country.name if p.country else "",
            p.sector or "",
            p.ai_technology or "",
            p.sdg_alignment or "",
            p.status,
            p.start_date.date().isoformat() if p.start_date else "",
            p.end_date.date().isoformat() if p.end_date else "",
            p.budget or "",
            p.planned_duration or "",
            p.submitted_at.date().isoformat() if p.submitted_at else "",
        ])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="sarai_projects_export.csv"'},
    )


@router.get("/check-duplicate")
def check_duplicate_project(
    title: str,
    country_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    title = title.strip()
    if len(title) < 4:
        return []
    query = db.query(Project).filter(Project.title.ilike(f"%{title}%"))
    if country_id is not None:
        query = query.filter(Project.country_id == country_id)
    matches = query.options(joinedload(Project.country)).order_by(Project.submitted_at.desc()).limit(5).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "status": m.status,
            "country_name": m.country.name if m.country else None,
            "submitted_at": m.submitted_at,
        }
        for m in matches
    ]


@router.post("/submit", response_model=ProjectResponse)
def submit_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project_data = project.model_dump()
    project_data["user_id"] = current_user.id  # ignore client-supplied user_id, trust the token
    project_data["status"] = "pending"
    project_data["submitted_at"] = datetime.now(timezone.utc)
    db_project = Project(**project_data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.post("/{project_id}/documents")
async def upload_project_documents(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != "admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only upload documents to your own projects")

    saved_docs = []
    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        db_doc = ProjectDocument(
            project_id=project_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_url=f"/uploads/projects/{unique_filename}",
            file_size=os.path.getsize(file_path),
            mime_type=file.content_type,
            uploaded_by=project.user_id,
        )
        db.add(db_doc)
        saved_docs.append(db_doc)
    db.commit()
    return {"message": f"{len(saved_docs)} files uploaded successfully"}


@router.get("/{id}", response_model=ProjectResponse)
def get_project(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    project = db.query(Project).options(
        joinedload(Project.owner),
        joinedload(Project.country),
        joinedload(Project.stakeholder_associations).joinedload(ProjectStakeholder.stakeholder),
        joinedload(Project.documents),
    ).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status in ("pending", "rejected"):
        is_owner_or_admin = current_user and (
            current_user.role == "admin" or current_user.id == project.user_id
        )
        if not is_owner_or_admin:
            raise HTTPException(status_code=403, detail="This project is not yet publicly available")
    return project


@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project_data = project.model_dump()
    project_data["user_id"] = current_user.id  # ignore client-supplied user_id, trust the token
    db_project = Project(**project_data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.put("/{id}", response_model=ProjectResponse)
def update_project(
    id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_admin = current_user.role == "admin"
    if not is_admin and db_project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own projects")

    update_data = project.model_dump(exclude_unset=True)
    if not is_admin:
        # Owners can edit their project's content, but approval status is admin-only
        # (use /api/admin/projects/{id}/approve or /reject for that workflow).
        update_data.pop("status", None)

    changed_fields = [
        field for field, value in update_data.items()
        if getattr(db_project, field) != value
    ]

    for field, value in update_data.items():
        setattr(db_project, field, value)

    if changed_fields:
        db.add(ProjectAuditLog(
            project_id=db_project.id,
            project_title=db_project.title,
            action="edited",
            actor_id=current_user.id,
            actor_name=current_user.organization_name or current_user.email,
            details=", ".join(changed_fields),
        ))

    db.commit()
    db.refresh(db_project)
    return db_project


@router.delete("/{id}")
def delete_project(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.add(ProjectAuditLog(
        project_id=db_project.id,
        project_title=db_project.title,
        action="deleted",
        actor_id=admin.id,
        actor_name=admin.organization_name or admin.email,
    ))
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}


@router.get("/{id}/details")
def get_project_details(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status in ("pending", "rejected"):
        raise HTTPException(status_code=403, detail="This project is not yet publicly available")

    # Increment view counter atomically
    db.query(Project).filter(Project.id == id).update(
        {"views_count": Project.views_count + 1}
    )
    db.commit()

    project_data = project.to_dict()
    if project.country:
        project_data["country_name"] = project.country.name

    stakeholders = []
    for assoc in project.stakeholder_associations:
        s_dict = assoc.stakeholder.to_dict()
        s_dict["role"] = assoc.role
        stakeholders.append(s_dict)

    return {"project": project_data, "stakeholders": stakeholders}


# ── Relationship Management ───────────────────────────────────────────────────

@router.post("/{project_id}/stakeholders/{stakeholder_id}")
def link_stakeholder_to_project(
    project_id: int,
    stakeholder_id: int,
    role: str = "partner",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    stakeholder = db.query(Stakeholder).filter(Stakeholder.id == stakeholder_id).first()
    if not project or not stakeholder:
        raise HTTPException(status_code=404, detail="Project or Stakeholder not found")
    if current_user.role != "admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own projects")
    existing = db.query(ProjectStakeholder).filter(
        ProjectStakeholder.project_id == project_id,
        ProjectStakeholder.stakeholder_id == stakeholder_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Stakeholder already linked to this project")
    db.add(ProjectStakeholder(project_id=project_id, stakeholder_id=stakeholder_id, role=role))
    db.commit()
    return {"message": "Stakeholder linked successfully", "role": role}


@router.delete("/{project_id}/stakeholders/{stakeholder_id}")
def unlink_stakeholder_from_project(
    project_id: int,
    stakeholder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != "admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own projects")
    link = db.query(ProjectStakeholder).filter(
        ProjectStakeholder.project_id == project_id,
        ProjectStakeholder.stakeholder_id == stakeholder_id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Relationship not found")
    db.delete(link)
    db.commit()
    return {"message": "Stakeholder unlinked successfully"}


@router.get("/{id}/stakeholders")
def get_project_stakeholders(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    results = []
    for assoc in project.stakeholder_associations:
        s = assoc.stakeholder.to_dict()
        s["role"] = assoc.role
        results.append(s)
    return results


@router.get("/{project_id}/report")
def get_project_report(project_id: int, lang: str = "fr", db: Session = Depends(get_db)):
    try:
        project = db.query(Project).options(
            joinedload(Project.tasks),
            joinedload(Project.stakeholder_associations).joinedload(ProjectStakeholder.stakeholder),
            joinedload(Project.country),
            joinedload(Project.sdg_associations).joinedload(ProjectSDG.sdg),
        ).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        ai_summary = report_service.generate_ai_summary(project)
        pdf_buffer = report_service.generate_project_report(project, ai_summary=ai_summary, lang=lang)
        filename = f"Report_{project.title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"Failed to generate report for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


@router.get("/{project_id}/similar")
def get_similar_projects(project_id: int, limit: int = 4, db: Session = Depends(get_db)):
    """Return up to `limit` similar projects, pre-filtered in SQL then scored in Python."""
    source = db.query(Project).filter(
        Project.id == project_id,
        Project.status.notin_(EXCLUDED_STATUSES),
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="Project not found")

    # Pre-filter candidates sharing at least one attribute (SQL-side, capped at 50)
    conditions = []
    if source.sector:
        conditions.append(Project.sector == source.sector)
    if source.country_id:
        conditions.append(Project.country_id == source.country_id)
    if source.ai_technology:
        conditions.append(Project.ai_technology == source.ai_technology)

    candidates_q = db.query(Project).options(joinedload(Project.country)).filter(
        Project.id != project_id,
        Project.status.notin_(EXCLUDED_STATUSES),
    )
    if conditions:
        candidates_q = candidates_q.filter(or_(*conditions))

    candidates = candidates_q.limit(50).all()

    scored = []
    for p in candidates:
        score = 0
        if source.sector and p.sector and source.sector.lower() == p.sector.lower():
            score += 3
        if source.ai_technology and p.ai_technology and source.ai_technology.lower() == p.ai_technology.lower():
            score += 2
        if source.country_id and p.country_id and source.country_id == p.country_id:
            score += 1
        if source.sdg_alignment and p.sdg_alignment and source.sdg_alignment == p.sdg_alignment:
            score += 1
        if score > 0:
            scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {
            "id": p.id,
            "title": p.title,
            "sector": p.sector,
            "ai_technology": p.ai_technology,
            "country_name": p.country.name if p.country else None,
            "status": p.status,
        }
        for _, p in scored[:limit]
    ]
