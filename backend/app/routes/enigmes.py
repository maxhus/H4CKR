from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.level import Level
from app.models.hint import Hint
from app.models.attempt import Attempt
from app.services.enigmes import encodage, regex_enigme, json_enigme, exif_enigme, http_enigme
from app.services.score import calculer_score
from pydantic import BaseModel

router = APIRouter(prefix="/enigmes", tags=["Enigmes"])

class ReponsePayload(BaseModel):
    user_id: int
    reponse: str
    indices_utilises: int = 0
    extra: dict = {}

@router.get("/")
def lister_enigmes(db: Session = Depends(get_db)):
    return db.query(Level).all()

@router.get("/{id}/indices")
def get_indices(id: int, db: Session = Depends(get_db)):
    indices = db.query(Hint).filter(Hint.level_id == id).all()
    if not indices:
        raise HTTPException(status_code=404, detail="Aucun indice trouvé")
    return indices

@router.post("/{id}/verifier")
async def verifier_enigme(id: int, payload: ReponsePayload, db: Session = Depends(get_db)):
    level = db.query(Level).filter(Level.id == id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Enigme introuvable")

    valide = False

    if level.type == "base64":
        valide = encodage.verifier_base64(payload.reponse, level.solution_hash)
    elif level.type == "cesar":
        decalage = payload.extra.get("decalage", 3)
        valide = encodage.verifier_cesar(payload.reponse, level.solution_hash, decalage)
    elif level.type == "rot13":
        valide = encodage.verifier_rot13(payload.reponse, level.solution_hash)
    elif level.type == "hex":
        valide = encodage.verifier_hex(payload.reponse, level.solution_hash)
    elif level.type == "binaire":
        valide = encodage.verifier_binaire(payload.reponse, level.solution_hash)
    elif level.type == "regex":
        targets = payload.extra.get("targets", [])
        non_targets = payload.extra.get("non_targets", [])
        valide = regex_enigme.verifier_regex(payload.reponse, targets, non_targets)
    elif level.type == "json":
        json_casse = payload.extra.get("json_casse", "")
        cle_cible = payload.extra.get("cle_cible", "")
        valide = json_enigme.verifier_json(json_casse, cle_cible, payload.reponse)
    elif level.type == "exif":
        valide = exif_enigme.verifier_exif(level.artifact_url, payload.extra.get("champ", ""), payload.reponse)
    elif level.type == "http":
        valide = await http_enigme.verifier_http(level.artifact_url, payload.extra.get("header", ""), payload.reponse)

    score = calculer_score(level.points, payload.indices_utilises) if valide else 0

    return {
        "valide": valide,
        "score": score,
        "message": "Bonne réponse !" if valide else "Mauvaise réponse"
    }