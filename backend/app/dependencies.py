"""
Reusable authentication & authorization dependencies.

Centralises JWT decoding and role checks so routers stay thin and the
security policy lives in one place (Single Responsibility / DRY).

Usage:
    from app.dependencies import get_current_user, require_admin

    @router.get("/me")
    def me(current_user: User = Depends(get_current_user)):
        ...

    # Protect an entire router:
    router = APIRouter(dependencies=[Depends(require_admin)])

    # Route that behaves differently for logged-in users but stays public:
    @router.get("/{id}")
    def get_thing(id: int, current_user: User | None = Depends(get_current_user_optional)):
        ...
"""
import os
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is not set. "
        "Set it in backend/.env (see .env.example) before starting the app — "
        "refusing to start with an insecure default signing key."
    )
ALGORITHM = "HS256"

# tokenUrl is informational (used by the OpenAPI "Authorize" button).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=True)
# Same scheme, but doesn't raise 401 when no Authorization header is present —
# for routes that must stay reachable by anonymous clients.
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _decode_user(token: str, db: Session) -> User | None:
    """Decode a bearer JWT and return the matching user (active or not), or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if not email:
            return None
    except JWTError:
        return None

    return db.query(User).filter(User.email == email).first()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the bearer JWT and return the matching, active user, or raise 401/403."""
    user = _decode_user(token, db)
    if user is None:
        raise _CREDENTIALS_EXC
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return user


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> User | None:
    """Best-effort identify the caller without ever raising — None if absent/invalid."""
    if not token:
        return None
    return _decode_user(token, db)


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Allow only authenticated administrators."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required",
        )
    return current_user
