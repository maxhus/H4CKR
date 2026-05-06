import hashlib
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.attempt import Attempt
from app.models.hint import Hint
from app.models.level import Level
from app.models.progress import Progress
from app.models.user import User
from app.services.enigmes import (encodage, exif_enigme, http_enigme, json_enigme,
                                 regex_enigme)
from app.services.score import calculer_score
from app.schemas import (AnswerResponse, HintOut, HintRequest, LevelAnswerPayload,
                         LevelOut)

router = APIRouter(prefix="/api/levels", tags=["Levels"])


def get_level_or_404(level_id: int, db: Session) -> Level:
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level


def get_user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=list[LevelOut])
def list_levels(db: Session = Depends(get_db)) -> list[LevelOut]:
    levels = db.query(Level).order_by(Level.chapter, Level.position).all()
    return levels


@router.get("/{level_id}", response_model=LevelOut)
def get_level(level_id: int, db: Session = Depends(get_db)) -> LevelOut:
    return get_level_or_404(level_id, db)


@router.post("/{level_id}/answer", response_model=AnswerResponse)
async def answer_level(
    level_id: int,
    payload: LevelAnswerPayload,
    db: Session = Depends(get_db),
) -> AnswerResponse:
    level = get_level_or_404(level_id, db)
    get_user_or_404(payload.user_id, db)

    answer_hash = hashlib.sha256(payload.reponse.encode("utf-8")).hexdigest()
    validated = False

    if level.type == "base64":
        validated = encodage.verifier_base64(payload.reponse, level.solution_hash)
    elif level.type == "cesar":
        decalage = payload.extra.get("decalage", 3)
        validated = encodage.verifier_cesar(payload.reponse, level.solution_hash, decalage)
    elif level.type == "rot13":
        validated = encodage.verifier_rot13(payload.reponse, level.solution_hash)
    elif level.type == "hex":
        validated = encodage.verifier_hex(payload.reponse, level.solution_hash)
    elif level.type == "binaire":
        validated = encodage.verifier_binaire(payload.reponse, level.solution_hash)
    elif level.type == "regex":
        targets = payload.extra.get("targets", [])
        non_targets = payload.extra.get("non_targets", [])
        validated = regex_enigme.verifier_regex(payload.reponse, targets, non_targets)
    elif level.type == "json":
        json_casse = payload.extra.get("json_casse", "")
        cle_cible = payload.extra.get("cle_cible", "")
        validated = json_enigme.verifier_json(json_casse, cle_cible, payload.reponse)
    elif level.type == "exif":
        validated = exif_enigme.verifier_exif(
            level.artifact_url, payload.extra.get("champ", ""), payload.reponse
        )
    elif level.type == "http":
        validated = await http_enigme.verifier_http(
            level.artifact_url, payload.extra.get("header", ""), payload.reponse
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported level type")

    score = calculer_score(level.points, payload.indices_utilises) if validated else 0

    attempt = Attempt(
        user_id=payload.user_id,
        level_id=level_id,
        answer_hash=answer_hash,
        validated=validated,
    )
    db.add(attempt)

    if validated:
        progress = (
            db.query(Progress)
            .filter(Progress.user_id == payload.user_id, Progress.level_id == level_id)
            .first()
        )
        if progress:
            progress.score = max(progress.score, score)
            progress.completed_at = datetime.utcnow()
        else:
            progress = Progress(
                user_id=payload.user_id, level_id=level_id, score=score
            )
            db.add(progress)

    db.commit()

    return {
        "valide": validated,
        "score": score,
        "message": "Bonne réponse !" if validated else "Mauvaise réponse",
    }


@router.post("/{level_id}/hint", response_model=HintOut)
def request_hint(
    level_id: int,
    payload: HintRequest,
    db: Session = Depends(get_db),
) -> HintOut:
    get_user_or_404(payload.user_id, db)
    hint = (
        db.query(Hint)
        .filter(Hint.level_id == level_id, Hint.position == payload.position)
        .first()
    )
    if not hint:
        raise HTTPException(status_code=404, detail="Hint not found")
    return hint
