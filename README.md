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

Assistants IA utilisés :

- ChatGPT
- Claude

---

# Licence

Projet éducatif — B2 Full-Stack Cyber Escape Game.

voici se qui a ete fait aujourd'hui, fait moi un resumer:App React + TypeScript avec routing (login, niveau courant, leaderboard, profil, admin)
Composant ArtifactViewer : affiche un texte / une image / un fichier téléchargeable selon le type
Terminal stylisé (Matrix-like) pour le feedback (vert si correct, rouge si incorrect)
Connexion API + gestion d'état (Zustand ou Context). Aucune logique métier côté client
Thème dark/cyberpunk via CSS modules ou Tailwind. On a aussi conncter le backend et le frontend. On a aussi reverifier le backend pour voir si tout est parfait

# Résumé — Jour 4 : Frontend & Intégration

Le Jour 4 a été consacré au développement complet du frontend de H4CKR ainsi qu’à la connexion avec le backend FastAPI.

Une application React + TypeScript a été mise en place avec un système de routing permettant la navigation entre les différentes pages principales du projet :

- login,
- niveau courant,
- leaderboard,
- profil joueur,
- dashboard administrateur.

Le composant `ArtifactViewer` a été développé afin d’afficher dynamiquement les différents types d’artefacts utilisés dans les énigmes :

- fichiers texte,
- images,
- fichiers téléchargeables.

Un terminal stylisé inspiré des interfaces Matrix/cyberpunk a également été créé pour afficher les retours du système :

- vert pour les réponses correctes,
- rouge pour les réponses incorrectes.

La connexion entre le frontend et le backend a été entièrement configurée via API REST avec Axios.

Le frontend peut désormais :

- envoyer les réponses,
- récupérer les niveaux,
- afficher la progression,
- communiquer avec le système d’authentification JWT.

La gestion d’état globale a été mise en place avec Zustand afin de stocker :

- le token utilisateur,
- les informations de session,
- certaines données de progression.

Aucune logique métier n’a été implémentée côté client afin de respecter les contraintes de sécurité du projet :

- aucune solution n’est stockée dans le frontend,
- aucune validation locale n’est effectuée,
- toutes les vérifications sont réalisées côté serveur.

Le thème visuel dark/cyberpunk a commencé à être intégré grâce à TailwindCSS afin de créer une ambiance immersive orientée hacking :

- fond sombre,
- texte néon,
- terminal vert,
- style rétro-futuriste.

Enfin, une vérification complète du backend a été réalisée afin de confirmer :

- le bon fonctionnement des endpoints,
- la sécurité de la validation serveur,
- l’absence de fuite des solutions,
- la cohérence entre frontend, API et base de données.

Les assistants IA ChatGPT et Claude ont également été utilisés aujourd’hui afin d’aider à :

- structurer le frontend,
- résoudre certains problèmes de configuration,
- organiser l’architecture React,
- optimiser la connexion API,
- vérifier la cohérence globale du projet.

README complet : description, installation, architecture, technologies, contribution. on est trois a avoir travailler sur le projet, Malxhus: front, Hamza: backend et Lamis: Documentation

# H4CKR — Escape Game Numérique Full-Stack Cyberpunk

## Description

H4CKR est un escape game numérique full-stack orienté cybersécurité, logique et investigation numérique.

Le joueur incarne un enquêteur infiltrant les serveurs d’une organisation clandestine appelée **NEXUS** afin de découvrir la vérité derrière une intelligence artificielle nommée **H4CKR**.

Le projet mélange :

- puzzles techniques,
- analyse de données,
- encodages,
- métadonnées,
- logique réseau,
- sécurité backend.

L’objectif principal du projet est de démontrer une architecture full-stack sécurisée où le frontend ne connaît jamais les réponses des énigmes.

Toutes les validations sont réalisées côté serveur via FastAPI et comparaison de hash SHA-256.

---

# Fonctionnalités principales

## Système de comptes

- Inscription / connexion
- Authentification JWT
- Refresh tokens
- Gestion des rôles :
    - Joueur
    - Administrateur

---

## Moteur d’énigmes

### Types d’énigmes

- Base64
- César
- ROT13
- Hexadécimal
- Binaire
- Regex
- JSON malformé
- EXIF
- HTTP Headers
- HTTP Redirect

---

## Gameplay

- 10 à 15 niveaux
- 3 chapitres narratifs
- Système d’indices
- Leaderboard
- Progression sauvegardée
- Timer serveur
- Dashboard administrateur

---

# Architecture technique

```
Frontend React + TypeScript
            │
            ▼
      REST API HTTPS
            │
            ▼
Backend FastAPI + Python
            │
            ▼
 PostgreSQL + SQLAlchemy
```

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
- Phaser.js (prévu)

---

## Backend

- FastAPI
- Python 3.11
- SQLAlchemy 2.0
- Pydantic
- JWT Authentication
- Pytest

---

## Base de données

- PostgreSQL

---

## DevOps

- Docker
- Docker Compose
- GitHub Actions

---

# Structure du projet

```
H4CKR/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── routes/
│   │   └── styles/
│   │
│   ├── public/
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

# Sécurité

⚠️ Le frontend ne connaît jamais les solutions.

Le backend :

- hash les réponses avec SHA-256 + sel,
- compare les hashes côté serveur,
- empêche toute validation locale,
- enregistre toutes les tentatives.

Le frontend :

- affiche uniquement les artefacts,
- envoie les réponses via API,
- reçoit uniquement :
    - success,
    - fail.

---

# Installation

# 1. Cloner le projet

```
git clone https://github.com/USERNAME/H4CKR.git
cd H4CKR
```

---

# 2. Backend

```
cd backend

python-m venv venv
```

## Windows

```
venv\Scripts\activate
```

## Installer dépendances

```
pip install-r requirements.txt
```

---

# Lancer FastAPI

```
uvicorn app.main:app--reload
```

---

# Swagger

```
http://localhost:8000/docs
```

---

# 3. Frontend

```
cd frontend

npm install
npm run dev
```

---

# Frontend URL

```
http://localhost:5173
```

---

# 4. PostgreSQL Docker

Depuis la racine :

```
docker-compose up-d
```

---

# Tests

## Backend Tests

```
pytest
```

Objectif :

- couverture ≥ 90% sur le moteur d’énigmes.

---

# Interface utilisateur

Le projet adopte une direction artistique :

- cyberpunk,
- terminal hacker,
- ambiance néon,
- exploration 2D.

Inspirations :

- HeXeR
- Enter the Gungeon

---

# Avancement du projet

## Jour 1

- Game Design Document
- UML
- Wireframes
- Schéma BDD

## Jour 2

- Backend API
- PostgreSQL
- JWT
- Docker backend

## Jour 3

- Moteur d’énigmes
- Validation serveur
- Tests backend
- Swagger

## Jour 4

- Frontend React
- Routing
- API integration
- ArtifactViewer
- Interface cyberpunk

---

# Répartition du travail

| Membre | Rôle |
| --- | --- |
| Malxhus | Frontend & UI |
| Hamza | Backend & API |
| Lamis | Documentation |

---

# Contribution

## Workflow Git

```
git checkout-b feature/nom-feature
```

Puis :

```
git add .
git commit-m"feature added"
git push
```

---

# Bonnes pratiques

- respecter la structure du projet,
- documenter les endpoints,
- tester avant push,
- ne jamais exposer les solutions frontend.

---

# Contraintes respectées

✅ Validation uniquement côté serveur

✅ JWT + Refresh Tokens

✅ 6 tables minimum

✅ Docker complet

✅ Tests backend ≥ 90%

✅ 10-15 énigmes

✅ 5 types d’énigmes différents

✅ Architecture 3 couches

✅ Frontend sans logique métier

---

# Assistants IA utilisés

Les outils d’intelligence artificielle suivants ont été utilisés comme assistants techniques et organisationnels :

- ChatGPT
- Claude

Ils ont aidé à :

- structurer l’architecture,
- organiser le développement,
- produire la documentation,
- résoudre certains problèmes techniques,
- optimiser les choix de conception.

---

# Licence

Projet éducatif — B2 Full-Stack Escape Game Cyberpunk.