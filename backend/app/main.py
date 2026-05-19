from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.base import Base
from app.db.session import engine
import app.models

from app.routes.auth import router as auth_router
from app.routes.levels import router as levels_router
from app.routes.progress import router as progress_router

app = FastAPI(title="H4CKR API")

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class UTF8Middleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response

app.add_middleware(UTF8Middleware)

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
    return JSONResponse(content={"message": "API H4CKR fonctionne !"}, 
                       media_type="application/json; charset=utf-8")