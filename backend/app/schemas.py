from datetime import datetime
from typing import Any
 
from pydantic import BaseModel
 
 
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
 
 
class LevelOut(BaseModel):
    id: int
    chapter: int
    position: int
    type: str
    title: str | None = None
    description: str | None = None
    artifact_url: str | None = None
    points: int

    class Config:
        from_attributes = True
 
 
class LevelAnswerPayload(BaseModel):
    user_id: int
    reponse: str
    indices_utilises: int = 0
    extra: dict[str, Any] = {}
 
 
class AnswerResponse(BaseModel):
    valide: bool
    score: int
    message: str
 
 
class HintRequest(BaseModel):
    user_id: int
    position: int
 
 
class HintOut(BaseModel):
    level_id: int
    position: int
    content: str
    malus: int
 
    class Config:
        from_attributes = True
 
 
class ProgressOut(BaseModel):
    user_id: int
    level_id: int
    completed_at: datetime
    score: int
 
    class Config:
        from_attributes = True
 
 
class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    score: int