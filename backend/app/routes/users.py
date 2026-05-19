from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import BaseModel

from app.core.config import SECRET_KEY, ALGORITHM
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.attempt import Attempt
from app.models.progress import Progress
from app.models.user import User

# ── Ce fichier va dans app/routes/users.py ──

router = APIRouter(prefix="/api/users", tags=["Users"])
bearer = HTTPBearer()


# ─── Récupérer l'utilisateur depuis le token ────────────────
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


# ─── Schémas ────────────────────────────────────────────────
class UpdateMePayload(BaseModel):
    username: str | None = None
    current_password: str | None = None
    new_password: str | None = None


class DeleteMePayload(BaseModel):
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


# ─── GET /api/users/me ──────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── PUT /api/users/me ──────────────────────────────────────
@router.put("/me", response_model=UserOut)
def update_me(
    payload: UpdateMePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Changer le username
    if payload.username and payload.username != current_user.username:
        taken = db.query(User).filter(User.username == payload.username).first()
        if taken:
            raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris")
        current_user.username = payload.username

    # Changer le mot de passe
    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Mot de passe actuel requis")
        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
        if len(payload.new_password) < 6:
            raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit faire au moins 6 caractères")
        current_user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


# ─── DELETE /api/users/me ───────────────────────────────────
@router.delete("/me", status_code=204)
def delete_me(
    payload: DeleteMePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    db.query(Attempt).filter(Attempt.user_id == current_user.id).delete()
    db.query(Progress).filter(Progress.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()