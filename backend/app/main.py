import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.db.base import Base
from app.db.session import engine
import app.models

from app.routes.auth import router as auth_router
from app.routes.levels import router as levels_router
from app.routes.progress import router as progress_router

app = FastAPI(title="H4CKR API")

# ── CORS manuel — compatible Vercel serverless ─────────────
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")

        # Autorise localhost et tous les domaines vercel.app
        allowed = (
            origin.startswith("http://localhost") or
            origin.endswith(".vercel.app") or
            origin == "https://vercel.app"
        )

        # Réponse preflight OPTIONS
        if request.method == "OPTIONS":
            response = Response(status_code=204)
            if allowed:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
            return response

        response = await call_next(request)
        response.headers["Content-Type"] = "application/json; charset=utf-8"

        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"

        return response

app.add_middleware(CORSMiddleware)

# ── Routes ─────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(levels_router)
app.include_router(progress_router)

# ── DB ─────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return JSONResponse(
        content={"message": "API H4CKR fonctionne !", "status": "ok"},
        media_type="application/json; charset=utf-8"
    )

@app.get("/health")
def health():
    return {"status": "ok"}