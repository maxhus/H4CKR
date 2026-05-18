from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.progress import Progress
from app.models.user import User
from app.schemas import LeaderboardEntry, ProgressOut

router = APIRouter(prefix="/api", tags=["Progress"])


@router.get("/progress", response_model=list[ProgressOut])
def get_progress(user_id: int = Query(...), db: Session = Depends(get_db)) -> list[ProgressOut]:
    progress = db.query(Progress).filter(Progress.user_id == user_id).all()
    return progress


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)) -> list[LeaderboardEntry]:
    rows = (
        db.query(Progress.user_id, User.username, func.sum(Progress.score).label("score"))
        .join(User, Progress.user_id == User.id)
        .group_by(Progress.user_id, User.username)
        .order_by(func.sum(Progress.score).desc())
        .all()
    )

    return [
        {"user_id": row.user_id, "username": row.username, "score": row.score}
        for row in rows
    ]
