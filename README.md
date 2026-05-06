# H4CKR — Escape Game Numérique Full-Stack

## Description

H4CKR est un escape game numérique full-stack orienté cybersécurité et logique.

Le joueur incarne un enquêteur numérique chargé d’infiltrer un réseau clandestin à travers plusieurs chapitres composés d’énigmes techniques.

Le projet met l’accent sur :

- la sécurité backend,
- la validation serveur,
- l’architecture API,
- la persistance des données,
- l’expérience immersive cyberpunk.

Le frontend ne connaît jamais les réponses des énigmes : toute validation est effectuée côté serveur via hash SHA-256.

---

# Objectifs pédagogiques

Ce projet a été réalisé dans le cadre d’un projet B2 afin de travailler :

- Développement Full-Stack
- API REST sécurisée
- Authentification JWT
- PostgreSQL & ORM
- Docker & DevOps
- Tests backend
- Architecture logicielle
- UX/UI cyberpunk immersive

---

# Technologies utilisées

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Axios
- Zustand
- React Router
- Phaser.js (prévu pour la partie 2D)

## Backend

- FastAPI
- Python 3.11
- SQLAlchemy 2.0
- Pydantic
- JWT Authentication
- Pytest

## Base de données

- PostgreSQL

## DevOps

- Docker
- Docker Compose
- GitHub Actions

---

# Fonctionnalités principales

## Système de comptes

- Register/Login
- JWT + Refresh Tokens
- Rôles :
    - Joueur
    - Admin

---

## Moteur d’énigmes sécurisé

### Types d’énigmes

- Base64
- César
- ROT13
- Hexadécimal
- Binaire
- Regex
- JSON malformé
- Métadonnées EXIF
- Analyse HTTP

### Sécurité

- Validation uniquement côté serveur
- Hash SHA-256 + sel
- Aucune solution exposée au frontend

---

## Gameplay

- 10 à 15 niveaux
- 3 chapitres narratifs
- Système d’indices avec malus
- Leaderboard global
- Progression sauvegardée
- Timer serveur

---

## Dashboard Admin

- Ajouter des énigmes
- Modifier les niveaux
- Upload des artefacts
- Gestion des indices

---

# Architecture du projet

```
H4CKR/
│
├── backend/
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

# Architecture technique

```
Frontend React + TypeScript
        │
        ▼
 REST API HTTPS
        │
        ▼
Backend FastAPI
        │
        ▼
 PostgreSQL
```

---

# Base de données

## Tables principales

| Table | Description |
| --- | --- |
| users | Comptes utilisateurs |
| levels | Niveaux / énigmes |
| attempts | Tentatives des joueurs |
| hints | Indices |
| progress | Progression |
| leaderboard | Classement |

---

# Installation

## Cloner le projet

```
git clone https://github.com/USERNAME/H4CKR.git
cd H4CKR
```

---

# Backend

```
cd backend

python-m venv venv

# Windows
venv\Scripts\activate

pip install-r requirements.txt
```

Lancer l’API :

```
uvicorn app.main:app--reload
```

Swagger :

```
http://localhost:8000/docs
```

---

# Frontend

```
cd frontend

npm install
npm run dev
```

Frontend :

```
http://localhost:5173
```

---

# Docker

Lancer tout le projet :

```
docker-compose up--build
```

---

# Tests

## Backend tests

```
pytest
```

Objectif :

- couverture ≥ 90% sur le moteur d’énigmes.

---

# Sécurité

Le frontend :

- ne possède aucune solution,
- ne valide rien localement,
- envoie uniquement les réponses.

Le backend :

- hash les réponses,
- compare les hashes,
- enregistre toutes les tentatives.

---

# Style visuel

Le projet adopte une direction artistique :

- cyberpunk,
- terminal hacker,
- ambiance néon,
- exploration 2D inspirée de :
    - HeXeR
    - Enter the Gungeon

---

# Avancement

## Jour 1

- Game Design Document
- UML
- Wireframes
- Liste des artefacts

## Jour 2

- Backend API
- PostgreSQL
- JWT
- Architecture FastAPI

## Jour 3

- Moteur d’énigmes
- Validation serveur
- Tests Pytest
- Swagger

## Jour 4

- Frontend React
- Routing
- API Integration
- UI cyberpunk

---

# Auteurs

Projet réalisé par :

- Malchus
- Hamza
-Lamis

Assistants IA utilisés :

- ChatGPT
- Claude

---

# Licence

Projet éducatif — B2 Full-Stack Cyber Escape Game.