from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Hint(Base):
    __tablename__ = "hints"

    id = Column(Integer, primary_key=True)
    level_id = Column(Integer)
    position = Column(Integer)
    content = Column(String)
    malus = Column(Integer)