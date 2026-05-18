from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import SECRET_KEY, ALGORITHM
from app.db.session import get_db
from app.models.attempt import Attempt
from app.models.hint import Hint
from app.models.level import Level
from app.models.progress import Progress
from app.models.user import User
from app.schemas import (
    LevelCreate, LevelUpdate, LevelAdminOut,
    HintCreate, HintUpdate, HintOut,
    UserAdminOut, LevelStatsOut
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])
bearer = HTTPBearer()


def get_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux admins")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


# ─── NIVEAUX ────────────────────────────────────────────────

@router.get("/levels", response_model=list[LevelAdminOut])
def admin_list_levels(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    return db.query(Level).order_by(Level.chapter, Level.position).all()


@router.post("/levels", response_model=LevelAdminOut, status_code=201)
def admin_create_level(payload: LevelCreate, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    import hashlib
    solution_hash = hashlib.sha256(payload.solution.strip().lower().encode()).hexdigest()
    level = Level(
        chapter=payload.chapter,
        position=payload.position,
        type=payload.type,
        title=payload.title,
        description=payload.description,
        artifact_url=payload.artifact_url,
        solution_hash=solution_hash,
        points=payload.points,
    )
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@router.put("/levels/{level_id}", response_model=LevelAdminOut)
def admin_update_level(level_id: int, payload: LevelUpdate, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    import hashlib
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    if payload.chapter is not None: level.chapter = payload.chapter
    if payload.position is not None: level.position = payload.position
    if payload.type is not None: level.type = payload.type
    if payload.title is not None: level.title = payload.title
    if payload.description is not None: level.description = payload.description
    if payload.artifact_url is not None: level.artifact_url = payload.artifact_url
    if payload.points is not None: level.points = payload.points
    if payload.solution is not None:
        level.solution_hash = hashlib.sha256(payload.solution.strip().lower().encode()).hexdigest()
    db.commit()
    db.refresh(level)
    return level


@router.delete("/levels/{level_id}", status_code=204)
def admin_delete_level(level_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    db.query(Hint).filter(Hint.level_id == level_id).delete()
    db.query(Attempt).filter(Attempt.level_id == level_id).delete()
    db.query(Progress).filter(Progress.level_id == level_id).delete()
    db.delete(level)
    db.commit()


# ─── INDICES ────────────────────────────────────────────────

@router.get("/levels/{level_id}/hints", response_model=list[HintOut])
def admin_list_hints(level_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    return db.query(Hint).filter(Hint.level_id == level_id).order_by(Hint.position).all()


@router.post("/levels/{level_id}/hints", response_model=HintOut, status_code=201)
def admin_create_hint(level_id: int, payload: HintCreate, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    hint = Hint(level_id=level_id, position=payload.position, content=payload.content, malus=payload.malus)
    db.add(hint)
    db.commit()
    db.refresh(hint)
    return hint


@router.put("/hints/{hint_id}", response_model=HintOut)
def admin_update_hint(hint_id: int, payload: HintUpdate, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    hint = db.query(Hint).filter(Hint.id == hint_id).first()
    if not hint:
        raise HTTPException(status_code=404, detail="Hint not found")
    if payload.content is not None: hint.content = payload.content
    if payload.malus is not None: hint.malus = payload.malus
    db.commit()
    db.refresh(hint)
    return hint


@router.delete("/hints/{hint_id}", status_code=204)
def admin_delete_hint(hint_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    hint = db.query(Hint).filter(Hint.id == hint_id).first()
    if not hint:
        raise HTTPException(status_code=404, detail="Hint not found")
    db.delete(hint)
    db.commit()


# ─── UTILISATEURS ───────────────────────────────────────────

@router.get("/users", response_model=list[UserAdminOut])
def admin_list_users(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    return db.query(User).order_by(User.id).all()


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(Attempt).filter(Attempt.user_id == user_id).delete()
    db.query(Progress).filter(Progress.user_id == user_id).delete()
    db.delete(user)
    db.commit()


@router.put("/users/{user_id}/role", response_model=UserAdminOut)
def admin_set_role(user_id: int, role: str, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    if role not in ("admin", "player"):
        raise HTTPException(status_code=400, detail="Rôle invalide")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user


# ─── STATS ──────────────────────────────────────────────────

@router.get("/stats", response_model=list[LevelStatsOut])
def admin_stats(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    levels = db.query(Level).order_by(Level.chapter, Level.position).all()
    result = []
    for level in levels:
        total = db.query(func.count(Attempt.id)).filter(Attempt.level_id == level.id).scalar()
        success = db.query(func.count(Attempt.id)).filter(Attempt.level_id == level.id, Attempt.validated == True).scalar()
        completions = db.query(func.count(Progress.id)).filter(Progress.level_id == level.id).scalar()
        result.append({
            "level_id": level.id,
            "title": level.title or f"{level.chapter}-{level.position}",
            "type": level.type,
            "total_attempts": total,
            "success_attempts": success,
            "completions": completions,
            "success_rate": round(success / total * 100, 1) if total > 0 else 0,
        })
    return result