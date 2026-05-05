# from app.db.base import Base
# from app.db.session import engine
# import app.models

# Base.metadata.create_all(bind=engine)

from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine
import app.models

# Créer les tables
Base.metadata.create_all(bind=engine)

# Créer l'instance FastAPI
app = FastAPI(title="H4CKR API")

# Importer les routes
# from app.routes import ton_router
# app.include_router(ton_router)

@app.get("/")
def root():
    return {"message": "API H4CKR fonctionne !"}