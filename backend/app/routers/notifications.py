from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.dependencies import get_current_user
from datetime import datetime, timezone

router = APIRouter()


def _require_self_or_admin(user_id: int, current_user: User):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own notifications")


@router.get("/{user_id}")
def get_user_notifications(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_self_or_admin(user_id, current_user)
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return [n.to_dict() for n in notifications]


@router.get("/{user_id}/unread/count")
def count_unread_notifications(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_self_or_admin(user_id, current_user)
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == 0
    ).count()
    return {"unread_count": count}


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if current_user.role != "admin" and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own notifications")
    notification.is_read = 1
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Notification marked as read"}
