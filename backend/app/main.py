import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.db.base import Base
from app.db.session import engine
import app.models

from app.routes.auth import router as auth_router
from app.routes.levels import router as levels_router
from app.routes.progress import router as progress_router

app = FastAPI(title="H4CKR API")

# ── UTF-8 ──────────────────────────────────────────────────
class UTF8Middleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response

app.add_middleware(UTF8Middleware)

# ── CORS ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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