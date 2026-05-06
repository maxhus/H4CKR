from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.db.base import Base


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    level_id = Column(Integer, ForeignKey("levels.id"))
    completed_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Integer)
