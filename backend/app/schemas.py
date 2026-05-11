from datetime import datetime
from typing import Any

from pydantic import BaseModel


# ─── AUTH ────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int


# ─── LEVELS ─────────────────────────────────────────────────

class LevelOut(BaseModel):
    id: int
    chapter: int
    position: int
    type: str
    title: str | None = None
    description: str | None = None
    artifact_url: str | None = None
    points: int
    # solution_hash volontairement absent

    class Config:
        from_attributes = True


class LevelAdminOut(BaseModel):
    id: int
    chapter: int
    position: int
    type: str
    title: str | None = None
    description: str | None = None
    artifact_url: str | None = None
    points: int
    solution_hash: str  # visible uniquement pour l'admin

    class Config:
        from_attributes = True


class LevelCreate(BaseModel):
    chapter: int
    position: int
    type: str
    title: str | None = None
    description: str | None = None
    artifact_url: str | None = None
    solution: str  # en clair, hashé côté backend
    points: int


class LevelUpdate(BaseModel):
    chapter: int | None = None
    position: int | None = None
    type: str | None = None
    title: str | None = None
    description: str | None = None
    artifact_url: str | None = None
    solution: str | None = None
    points: int | None = None


# ─── ANSWERS ─────────────────────────────────────────────────

class LevelAnswerPayload(BaseModel):
    user_id: int
    reponse: str
    indices_utilises: int = 0
    extra: dict[str, Any] = {}


class AnswerResponse(BaseModel):
    valide: bool
    score: int
    message: str


# ─── HINTS ──────────────────────────────────────────────────

class HintRequest(BaseModel):
    user_id: int
    position: int


class HintOut(BaseModel):
    id: int | None = None
    level_id: int
    position: int
    content: str
    malus: int

    class Config:
        from_attributes = True


class HintCreate(BaseModel):
    position: int
    content: str
    malus: int


class HintUpdate(BaseModel):
    content: str | None = None
    malus: int | None = None


# ─── PROGRESS ───────────────────────────────────────────────

class ProgressOut(BaseModel):
    user_id: int
    level_id: int
    completed_at: datetime
    score: int

    class Config:
        from_attributes = True


# ─── LEADERBOARD ────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    score: int


# ─── ADMIN ──────────────────────────────────────────────────

class UserAdminOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class LevelStatsOut(BaseModel):
    level_id: int
    title: str
    type: str
    total_attempts: int
    success_attempts: int
    completions: int
    success_rate: float