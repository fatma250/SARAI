from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.project import Project
from app.models.notification import Notification
from app.models.user import User
from app.models.approval import Approval
from app.models.project_audit_log import ProjectAuditLog
from app.models.country import Country
from app.schemas.project import ProjectResponse
from app.schemas.user import UserResponse
from datetime import datetime, timezone, timedelta
from app.services.email_service import send_approval_email, send_rejection_email
from app.dependencies import require_admin


class BulkApproveRequest(BaseModel):
    project_ids: List[int]


class BulkRejectRequest(BaseModel):
    project_ids: List[int]
    reason: str

# Every endpoint in this router requires an authenticated administrator.
router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/projects/pending", response_model=List[ProjectResponse])
def get_pending_projects(db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.status == "pending").all()

@router.get("/projects", response_model=List[ProjectResponse])
def get_all_projects(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sector: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    List projects of any status for admin moderation, with search/filter support.
    """
    query = db.query(Project).options(
        joinedload(Project.owner),
        joinedload(Project.country),
    )
    if status:
        query = query.filter(Project.status == status)
    if sector:
        query = query.filter(Project.sector == sector)
    if country:
        query = query.join(Country, Country.id == Project.country_id).filter(Country.name == country)
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(Project.title.ilike(pattern), Project.description.ilike(pattern)))
    return query.order_by(Project.submitted_at.desc()).limit(500).all()

@router.get("/users/pending", response_model=List[UserResponse])
def get_pending_users(db: Session = Depends(get_db)):
    """
    Get users who have verified their email but are not yet approved by admin.
    """
    return db.query(User).filter(User.is_email_verified == 1, User.is_admin_approved == 0).all()

@router.post("/users/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db)):
    """
    Approve a user account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin_approved = 1
    db.commit()
    
    # Send notification email
    send_approval_email(user.email, user.organization_name or "Utilisateur")
    
    return {"message": "User approved successfully"}

@router.post("/users/{user_id}/reject")
def reject_user(user_id: int, reason: str = Body(None, embed=True), db: Session = Depends(get_db)):
    """
    Reject a user account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send notification email before deleting
    send_rejection_email(user.email, user.organization_name or "Utilisateur", reason)
    
    db.delete(user)
    db.commit()
    return {"message": "User rejected and deleted"}

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    thirty_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=30)
    return {
        "pending": db.query(Project).filter(Project.status == "pending").count(),
        "approved": db.query(Project).filter(Project.status == "approved").count(),
        "rejected": db.query(Project).filter(Project.status == "rejected").count(),
        "total": db.query(Project).count(),
        "total_users": db.query(User).count(),
        "connected_users": db.query(User).filter(User.last_login >= thirty_minutes_ago).count(),
        "pending_users": db.query(User).filter(User.is_email_verified == 1, User.is_admin_approved == 0).count()
    }

@router.put("/projects/{id}/approve", response_model=ProjectResponse)
def approve_project(id: int, current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    previous_status = project.status
    project.status = "approved"
    project.reviewed_at = datetime.now(timezone.utc)
    project.reviewed_by = current_admin.id

    notification = Notification(
        user_id=project.user_id,
        type="project_approved",
        title="Project Approved",
        message=f"Your project \"{project.title}\" has been approved and published!",
        project_id=project.id,
        action_url="/profile"
    )
    db.add(notification)
    db.add(Approval(
        project_id=project.id,
        reviewer_id=current_admin.id,
        status="approved",
        previous_status=previous_status,
        reviewed_at=project.reviewed_at,
    ))

    db.commit()
    db.refresh(project)
    return project

@router.put("/projects/{id}/reject", response_model=ProjectResponse)
def reject_project(
    id: int,
    reason: str = Body(..., embed=True),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    previous_status = project.status
    project.status = "rejected"
    project.rejection_reason = reason
    project.reviewed_at = datetime.now(timezone.utc)
    project.reviewed_by = current_admin.id

    notification = Notification(
        user_id=project.user_id,
        type="project_rejected",
        title="Project Rejected",
        message=f"Your project \"{project.title}\" has been rejected. Reason: {reason}",
        project_id=project.id,
        action_url="/profile"
    )
    db.add(notification)
    db.add(Approval(
        project_id=project.id,
        reviewer_id=current_admin.id,
        status="rejected",
        previous_status=previous_status,
        rejection_reason=reason,
        reviewed_at=project.reviewed_at,
    ))

    db.commit()
    db.refresh(project)
    return project

@router.put("/projects/bulk-approve")
def bulk_approve_projects(
    body: BulkApproveRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    approved, missing = [], []
    for project_id in body.project_ids:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            missing.append(project_id)
            continue
        previous_status = project.status
        project.status = "approved"
        project.reviewed_at = now
        project.reviewed_by = current_admin.id
        db.add(Notification(
            user_id=project.user_id,
            type="project_approved",
            title="Project Approved",
            message=f"Your project \"{project.title}\" has been approved and published!",
            project_id=project.id,
            action_url="/profile"
        ))
        db.add(Approval(
            project_id=project.id,
            reviewer_id=current_admin.id,
            status="approved",
            previous_status=previous_status,
            reviewed_at=now,
        ))
        approved.append(project_id)
    db.commit()
    return {"approved": approved, "missing": missing}

@router.put("/projects/bulk-reject")
def bulk_reject_projects(
    body: BulkRejectRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    rejected, missing = [], []
    for project_id in body.project_ids:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            missing.append(project_id)
            continue
        previous_status = project.status
        project.status = "rejected"
        project.rejection_reason = body.reason
        project.reviewed_at = now
        project.reviewed_by = current_admin.id
        db.add(Notification(
            user_id=project.user_id,
            type="project_rejected",
            title="Project Rejected",
            message=f"Your project \"{project.title}\" has been rejected. Reason: {body.reason}",
            project_id=project.id,
            action_url="/profile"
        ))
        db.add(Approval(
            project_id=project.id,
            reviewer_id=current_admin.id,
            status="rejected",
            previous_status=previous_status,
            rejection_reason=body.reason,
            reviewed_at=now,
        ))
        rejected.append(project_id)
    db.commit()
    return {"rejected": rejected, "missing": missing}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/activity")
def get_activity_log(limit: int = 50, db: Session = Depends(get_db)):
    capped = min(limit, 200)

    approval_rows = (
        db.query(Approval, Project.title, User.organization_name, User.email)
        .outerjoin(Project, Approval.project_id == Project.id)
        .outerjoin(User, Approval.reviewer_id == User.id)
        .order_by(Approval.created_at.desc())
        .limit(capped)
        .all()
    )
    entries = [
        {
            "id": f"approval-{approval.id}",
            "project_id": approval.project_id,
            "project_title": project_title,
            "action": approval.status,  # approved / rejected / pending / revision_requested
            "reason": approval.rejection_reason,
            "actor_name": (org_name or reviewer_email) if approval.reviewer_id else "Unknown",
            "created_at": approval.created_at,
        }
        for approval, project_title, org_name, reviewer_email in approval_rows
    ]

    audit_rows = (
        db.query(ProjectAuditLog)
        .order_by(ProjectAuditLog.created_at.desc())
        .limit(capped)
        .all()
    )
    entries += [
        {
            "id": f"audit-{log.id}",
            "project_id": log.project_id,
            "project_title": log.project_title,
            "action": log.action,  # edited / deleted
            "reason": log.details,
            "actor_name": log.actor_name or "Unknown",
            "created_at": log.created_at,
        }
        for log in audit_rows
    ]

    entries.sort(key=lambda e: e["created_at"], reverse=True)
    return entries[:capped]
