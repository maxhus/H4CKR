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

# ── Métadonnées OpenAPI ────────────────────────────────────
tags_metadata = [
    {
        "name": "auth",
        "description": "Inscription et connexion. Retourne un **JWT token** à inclure dans les requêtes suivantes.",
    },
    {
        "name": "levels",
        "description": "Récupération des niveaux, soumission des réponses et demande d'indices. **solution_hash n'est jamais exposé.**",
    },
    {
        "name": "progress",
        "description": "Progression des joueurs et classement global.",
    },
]

app = FastAPI(
    title="H4CKR API",
    description="""
## API du jeu de hacking H4CKR

Application full-stack de hacking éducatif avec 15 niveaux répartis en 4 chapitres.

### Authentification
Toutes les routes (sauf `/` et `/health`) nécessitent un **Bearer JWT token** obtenu via `/api/auth/login`.

```
Authorization: Bearer <token>
```

### Sécurité
- Les mots de passe sont hashés avec **bcrypt**
- Les solutions des énigmes sont stockées en **SHA-256** — jamais exposées
- Les tokens JWT expirent après **30 minutes**

### Chapitres
| # | Thème | Niveaux |
|---|-------|---------|
| 1 | Encodage | Base64, César, ROT13, Hex |
| 2 | Logique | Regex, JSON |
| 3 | Infiltration | EXIF, GPS, HTTP |
| 4 | Breach | Regex+, Binaire, Final |
    """,
    version="2.0.0",
    openapi_tags=tags_metadata,
    contact={
        "name": "H4CKR Team",
        "url": "https://github.com/maxhus/H4CKR",
    },
    license_info={
        "name": "MIT",
    },
)

# ── CORS manuel — compatible Vercel serverless ─────────────
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")

        allowed = (
            origin.startswith("http://localhost") or
            origin.endswith(".vercel.app") or
            origin == "https://vercel.app"
        )

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

@app.get("/", tags=["health"], summary="Vérification API")
def root():
    return JSONResponse(
        content={"message": "API H4CKR fonctionne !", "version": "2.0.0", "status": "ok"},
        media_type="application/json; charset=utf-8"
    )

@app.get("/health", tags=["health"], summary="Health check")
def health():
    return {"status": "ok"}