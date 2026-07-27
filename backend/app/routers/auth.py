from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.verification_token import VerificationToken
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user import (
    UserCreate, UserLogin, LoginResponse, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest
)
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt
import os
from uuid import uuid4
from app.services.email_service import send_welcome_email, send_reset_email, send_admin_new_user_alert
from app.dependencies import SECRET_KEY, ALGORITHM
import logging

logger = logging.getLogger(__name__)

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered. Please login or use a different one.")

    db_user = User(
        organization_name=user_data.organization_name,
        organization_type=user_data.organization_type,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        phone=user_data.phone,
        website=user_data.website,
        country=user_data.country,
        city=user_data.city,
        address=user_data.address,
        sector=user_data.sector,
        description=user_data.description,
        logo=user_data.logo,
        # SECURITY: public self-registration must never grant elevated roles.
        # Admin/moderator accounts are provisioned via scripts/create_admin.py
        # or an authenticated admin endpoint, never from client-supplied input.
        role="organization",
        is_email_verified=1
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    send_welcome_email(db_user.email, db_user.organization_name or "User")
    send_admin_new_user_alert(db_user.email, db_user.organization_name or "User", db_user.id)

    return db_user


@router.get("/verify")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    v_token = db.query(VerificationToken).filter(VerificationToken.token == token).first()
    
    # URL de redirection vers la page de login du frontend
    frontend_login_url = os.getenv("FRONTEND_URL", "http://localhost:5173") + "/login?verified=true"
    
    if not v_token:
        # Si le jeton n'existe pas, peut-être que le compte est déjà vérifié
        return RedirectResponse(url=frontend_login_url)
    
    if v_token.is_expired():
        db.delete(v_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification token has expired")

    user = db.query(User).filter(User.id == v_token.user_id).first()
    if user:
        user.is_email_verified = 1
        db.delete(v_token)
        db.commit()
        send_registration_pending_email(user.email, user.organization_name or "User")

    return RedirectResponse(url=frontend_login_url)


@router.post("/login", response_model=LoginResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if not user.is_email_verified:
        raise HTTPException(
            status_code=403, 
            detail="Veuillez confirmer votre email en cliquant sur le bouton dans le message que nous vous avons envoyé."
        )

    if not user.is_admin_approved:
        raise HTTPException(
            status_code=403, 
            detail="Votre compte est en attente d'approbation par un administrateur. Vous recevrez un email dès qu'il sera activé."
        )

    if user.is_active == 0:
        raise HTTPException(status_code=403, detail="Votre compte a été désactivé.")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if user exists for security, but we'll return success anyway
        return {"message": "If an account exists with this email, a reset link has been sent."}

    # Remove existing tokens
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
    
    # Generate new token
    token_str = str(uuid4())
    reset_token = PasswordResetToken(user_id=user.id, token=token_str)
    db.add(reset_token)
    db.commit()

    # Send reset email
    send_reset_email(user.email, user.organization_name or "User", token_str)

    return {"message": "If an account exists with this email, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(token: str = Query(...), data: ResetPasswordRequest = None, db: Session = Depends(get_db)):
    if not data:
        raise HTTPException(status_code=400, detail="New password is required")
        
    r_token = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
    if not r_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if r_token.is_expired():
        db.delete(r_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user = db.query(User).filter(User.id == r_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.password)
    db.delete(r_token)
    db.commit()

    return {"message": "Password reset successfully"}
