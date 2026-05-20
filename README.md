# H4CKR — Escape Game Numérique Full-Stack Cyberpunk

[![CI/CD](https://github.com/maxhus/H4CKR/actions/workflows/ci.yml/badge.svg)](https://github.com/maxhus/H4CKR/actions/workflows/ci.yml)

> Application web de hacking éducatif : infiltrez les 15 salles du serveur NEXUS CORP en résolvant des énigmes de cryptographie, encodage et logique.

Le joueur incarne un enquêteur numérique infiltrant les serveurs d'une organisation clandestine afin de découvrir la vérité derrière une IA nommée **H4CKR**.

Le frontend ne connaît jamais les réponses des énigmes — toute validation est effectuée côté serveur via hash SHA-256.

---

## 🌐 Démo en ligne

| Service | URL |
|---------|-----|
| 🎮 Frontend | https://h4-ckr-z98c.vercel.app |
| ⚙️ Backend API | https://h4-ckr.vercel.app |
| 📖 Swagger / OpenAPI | https://h4-ckr.vercel.app/docs |

---

## 🚀 Démarrage rapide (Docker)

```bash
git clone https://github.com/maxhus/H4CKR.git
cd H4CKR
docker-compose up --build
```

| Service | URL locale |
|---------|-----------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

---

## 🏗️ Stack technique

### Frontend
- React 18 + TypeScript + Vite + TailwindCSS
- Phaser 4 (moteur de jeu 2D)
- Zustand (état global)
- Axios (requêtes API)
- Tone.js (audio)
- React Router

### Backend
- FastAPI + Python 3.11
- SQLAlchemy 2.0 + Pydantic
- JWT Authentication (python-jose) + bcrypt
- PostgreSQL 15

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Vercel (déploiement) + Neon (PostgreSQL cloud)

---

## 🎮 Gameplay

### 4 chapitres — 15 niveaux

| Chapitre | Thème | Types d'énigmes |
|----------|-------|----------------|
| 1 — Encodage | Cryptographie classique | Base64, César, ROT13, Hex |
| 2 — Logique | Parsing & validation | Regex, JSON |
| 3 — Infiltration | Analyse de données | EXIF, GPS, HTTP Headers, Redirections |
| 4 — Breach | Challenges avancés | Regex+, Binaire, Double encodage, Final |

### Contrôles

| Touche | Action |
|--------|--------|
| A / D ou ← → | Déplacer le joueur |
| E | Entrer dans une salle / Interagir |
| Q | Retour au couloir |
| Échap | Menu pause |

### Fonctionnalités
- Système d'indices avec malus de score
- Leaderboard global
- Progression sauvegardée en base de données
- Dashboard administrateur (gestion des niveaux, indices, utilisateurs)
- Avatar companion avec sons contextuels
- Musique ambiante générative (Tone.js)

---

## 📁 Structure du projet

```
H4CKR/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app + CORS
│   │   ├── models/               # SQLAlchemy models (User, Level, Progress, Hint, Attempt)
│   │   ├── routes/               # auth, levels, progress, admin
│   │   ├── schemas.py            # Pydantic validation I/O
│   │   ├── services/enigmes/     # Logique de vérification (encodage, regex, json, exif, http)
│   │   ├── core/                 # Config + sécurité JWT
│   │   └── db/                   # Session SQLAlchemy + init.sql
│   ├── tests/                    # pytest unitaires + intégration + e2e
│   ├── requirements.txt
│   ├── .flake8
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                # Login, Menu, Game, Leaderboard, Profile, Admin
│   │   ├── game/                 # Phaser GameScene, TerminalModal, DialogueBox
│   │   ├── components/           # MatrixRain, AvatarCompanion
│   │   ├── hooks/                # useChiptune (Tone.js)
│   │   ├── store/                # Zustand auth store
│   │   └── api/                  # Axios client avec intercepteur JWT
│   ├── nginx.conf
│   ├── eslint.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

---

## 🔐 API REST

### Authentification
```http
POST /api/auth/register   # Créer un compte
POST /api/auth/login      # Connexion → JWT token
```

### Niveaux
```http
GET  /api/levels                    # Liste des niveaux (sans solution_hash)
GET  /api/levels/{id}               # Détail d'un niveau
POST /api/levels/{id}/answer        # Soumettre une réponse
POST /api/levels/{id}/hint          # Demander un indice
```

### Progression
```http
GET /api/progress         # Progression de l'utilisateur
GET /api/leaderboard      # Classement global
```

### Sécurité
- Mots de passe hashés avec **bcrypt**
- Solutions stockées en **SHA-256** — jamais exposées au frontend
- Tous les endpoints protégés par **Bearer JWT**
- CORS configuré pour autoriser uniquement les domaines autorisés

---

## 🧪 Tests

```bash
cd backend

# Unitaires + couverture HTML
python -m pytest tests/ --ignore=tests/test_e2e.py --cov=app/services/enigmes --cov-report=html

# Tous les tests
python -m pytest tests/ --ignore=tests/test_e2e.py -v
```

| Suite | Nombre | Couverture |
|-------|--------|-----------|
| Unitaires (module enigmes) | 58 | 100% |
| Intégration (endpoints API) | 21 | — |
| E2E (Playwright) | 28 | — |

---

## ⚙️ Variables d'environnement

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql+psycopg2://user:password@host/db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env.local`)
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🔄 CI/CD — GitHub Actions

Le pipeline se déclenche à chaque push sur `main` :

1. **Backend** — Flake8 lint + pytest (couverture ≥ 90%) + chargement init.sql
2. **Frontend** — ESLint + vite build
3. **Deploy** — Déploiement automatique sur Vercel

---

## 🐳 Docker

```bash
# Démarrer tous les services
docker-compose up --build

# Arrêter
docker-compose down

# Arrêter + supprimer les volumes
docker-compose down -v
```

---

## 📋 Journal de développement

| Jour | Travaux réalisés |
|------|-----------------|
| Jour 1 | Game Design Document, UML, Wireframes, Schéma BDD |
| Jour 2 | Backend API, PostgreSQL, JWT, Docker backend |
| Jour 3 | Moteur d'énigmes, validation serveur, tests pytest, Swagger |
| Jour 4 | Frontend React + TypeScript, routing, ArtifactViewer, terminal Matrix, connexion API, thème cyberpunk |
| Jour 5 | Moteur Phaser 4, GameScene 2D, couloir scrollable, salles par chapitre, avatar |
| Jour 6 | Docker complet, CI/CD GitHub Actions, déploiement Vercel + Neon |

---

## 👥 Équipe

| Membre | Rôle |
|--------|------|
| Malxhus | Frontend & UI, moteur Phaser, intégration API |
| Hamza | Backend FastAPI, modèle de données, sécurité JWT |
| Lamis | Documentation, tests, architecture |

### Assistants IA utilisés
- **ChatGPT** et **Claude** — aide à la structuration, résolution de problèmes techniques, optimisation de l'architecture

---

## 🔒 Contraintes respectées

- ✅ Validation uniquement côté serveur
- ✅ JWT + bcrypt
- ✅ 5 tables (User, Level, Progress, Hint, Attempt)
- ✅ Docker complet (3 services)
- ✅ Tests backend ≥ 90% de couverture
- ✅ 15 énigmes, 8 types différents
- ✅ Architecture 3 couches (Frontend / API / BDD)
- ✅ Frontend sans logique métier

---

## 📄 Licence

Projet éducatif — B2 Full-Stack Cyberpunk Escape Game.