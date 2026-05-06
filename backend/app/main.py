from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from app.db.base import Base
from app.db.session import engine
import app.models  # importe tous les modèles pour que create_all les voie
 
from app.routes.auth import router as auth_router
from app.routes.levels import router as levels_router
from app.routes.progress import router as progress_router
 
app = FastAPI(title="H4CKR API")
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(auth_router)
app.include_router(levels_router)
app.include_router(progress_router)
 
Base.metadata.create_all(bind=engine)
 
 
@app.get("/")
def root():
    return {"message": "API H4CKR fonctionne !"}
 