from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine
import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="H4CKR API")

from app.routes.enigmes import router as enigmes_router
app.include_router(enigmes_router)

@app.get("/")
def root():
    return {"message": "API H4CKR fonctionne !"}