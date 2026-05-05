from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Level(Base):
    __tablename__ = "levels"

    id = Column(Integer, primary_key=True)
    chapter = Column(Integer)
    position = Column(Integer)
    type = Column(String)
    artifact_url = Column(String)
    solution_hash = Column(String)
    points = Column(Integer)