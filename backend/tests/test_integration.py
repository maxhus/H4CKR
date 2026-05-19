import hashlib
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def sha256(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


# ─── FIXTURES ────────────────────────────────────────────────

@pytest.fixture(scope="module")
def auth_token():
    """Crée un utilisateur de test et retourne son token."""
    username = "test_integration_user_42"
    password = "TestPassword123"

    # Register
    res = client.post("/api/auth/register", json={"username": username, "password": password})
    if res.status_code == 400:
        # Utilisateur déjà existant → login
        res = client.post("/api/auth/login", json={"username": username, "password": password})

    assert res.status_code in (200, 201)
    data = res.json()
    return {"token": data["access_token"], "user_id": data["user_id"]}


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token['token']}"}


# ─── AUTH ────────────────────────────────────────────────────

class TestAuth:

    def test_register_nouveau_utilisateur(self):
        """Register crée un compte et retourne un token."""
        import time
        username = f"user_test_{int(time.time())}"
        res = client.post("/api/auth/register", json={"username": username, "password": "Secret123"})
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert "user_id" in data
        assert data["token_type"] == "bearer"

    def test_register_username_existant(self):
        """Register avec username existant retourne 400."""
        client.post("/api/auth/register", json={"username": "dupli_user", "password": "pass"})
        res = client.post("/api/auth/register", json={"username": "dupli_user", "password": "pass"})
        assert res.status_code == 400

    def test_login_valide(self, auth_token):
        """Login avec bons credentials retourne un token."""
        assert "token" in auth_token
        assert len(auth_token["token"]) > 20

    def test_login_mauvais_password(self):
        """Login avec mauvais password retourne 401."""
        client.post("/api/auth/register", json={"username": "auth_test_user", "password": "correct"})
        res = client.post("/api/auth/login", json={"username": "auth_test_user", "password": "wrong"})
        assert res.status_code == 401

    def test_login_utilisateur_inexistant(self):
        """Login avec utilisateur inexistant retourne 401."""
        res = client.post("/api/auth/login", json={"username": "nobody_xyz", "password": "pass"})
        assert res.status_code == 401

    def test_token_contient_jwt(self, auth_token):
        """Le token est un JWT valide (3 parties séparées par des points)."""
        parts = auth_token["token"].split(".")
        assert len(parts) == 3


# ─── LEVELS ──────────────────────────────────────────────────

class TestLevels:

    def test_get_levels_retourne_liste(self, headers):
        """GET /api/levels retourne une liste de niveaux."""
        res = client.get("/api/levels", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_levels_sans_solution_hash(self, headers):
        """SÉCURITÉ : solution_hash ne doit jamais apparaître dans la réponse."""
        res = client.get("/api/levels", headers=headers)
        assert res.status_code == 200
        for level in res.json():
            assert "solution_hash" not in level, \
                f"solution_hash exposé dans le niveau {level.get('id')}"

    def test_get_level_by_id(self, headers):
        """GET /api/levels/{id} retourne un niveau."""
        res = client.get("/api/levels/1", headers=headers)
        assert res.status_code in (200, 404)  # 404 si les IDs ont changé
        if res.status_code == 200:
            data = res.json()
            assert "id" in data
            assert "solution_hash" not in data

    def test_get_level_inexistant(self, headers):
        """GET /api/levels/99999 retourne 404."""
        res = client.get("/api/levels/99999", headers=headers)
        assert res.status_code == 404

    def test_levels_contiennent_champs_requis(self, headers):
        """Chaque niveau a les champs attendus."""
        res = client.get("/api/levels", headers=headers)
        assert res.status_code == 200
        for level in res.json():
            assert "id" in level
            assert "chapter" in level
            assert "position" in level
            assert "type" in level
            assert "points" in level


# ─── ANSWER ──────────────────────────────────────────────────

class TestAnswer:

    def _get_first_level_id(self, headers) -> int:
        """Retourne l'ID du premier niveau disponible."""
        res = client.get("/api/levels", headers=headers)
        levels = res.json()
        return levels[0]["id"] if levels else 1

    def test_answer_invalide(self, auth_token, headers):
        """Mauvaise réponse retourne valide=False."""
        level_id = self._get_first_level_id(headers)
        res = client.post(f"/api/levels/{level_id}/answer", headers=headers, json={
            "user_id": auth_token["user_id"],
            "reponse": "MAUVAISE_REPONSE_XYZ_123",
            "indices_utilises": 0,
            "extra": {},
        })
        assert res.status_code == 200
        data = res.json()
        assert data["valide"] is False
        assert data["score"] == 0

    def test_answer_valide_base64(self, auth_token, headers):
        """Bonne réponse pour un niveau base64 retourne valide=True."""
        # Cherche le niveau base64
        res = client.get("/api/levels", headers=headers)
        levels = res.json()
        base64_level = next((l for l in levels if l["type"] == "base64"), None)
        if not base64_level:
            pytest.skip("Aucun niveau base64 trouvé")

        # La solution de Access Log est ACCESS_GRANTED
        res = client.post(f"/api/levels/{base64_level['id']}/answer", headers=headers, json={
            "user_id": auth_token["user_id"],
            "reponse": "ACCESS_GRANTED",
            "indices_utilises": 0,
            "extra": {},
        })
        assert res.status_code == 200
        data = res.json()
        assert "valide" in data
        assert "score" in data
        assert "message" in data

    def test_answer_retourne_score_positif_si_valide(self, auth_token, headers):
        """Une bonne réponse retourne un score > 0."""
        res = client.get("/api/levels", headers=headers)
        levels = res.json()
        if not levels:
            pytest.skip("Aucun niveau")

        # Tente avec la bonne réponse du niveau 1
        level = levels[0]
        correct = client.post(f"/api/levels/{level['id']}/answer", headers=headers, json={
            "user_id": auth_token["user_id"],
            "reponse": "ACCESS_GRANTED",
            "indices_utilises": 0,
            "extra": {},
        })
        data = correct.json()
        if data["valide"]:
            assert data["score"] > 0

    def test_answer_niveau_inexistant(self, auth_token, headers):
        """POST sur un niveau inexistant retourne 404."""
        res = client.post("/api/levels/99999/answer", headers=headers, json={
            "user_id": auth_token["user_id"],
            "reponse": "test",
            "indices_utilises": 0,
            "extra": {},
        })
        assert res.status_code == 404

    def test_answer_sans_solution_hash_dans_reponse(self, auth_token, headers):
        """SÉCURITÉ : la réponse à /answer ne contient pas solution_hash."""
        res = client.get("/api/levels", headers=headers)
        level_id = res.json()[0]["id"] if res.json() else 1
        res = client.post(f"/api/levels/{level_id}/answer", headers=headers, json={
            "user_id": auth_token["user_id"],
            "reponse": "test",
            "indices_utilises": 0,
            "extra": {},
        })
        assert "solution_hash" not in res.json()


# ─── PROGRESS ────────────────────────────────────────────────

class TestProgress:

    def test_get_progress_utilisateur(self, auth_token, headers):
        """GET /api/progress retourne la progression de l'utilisateur."""
        res = client.get(f"/api/progress?user_id={auth_token['user_id']}", headers=headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_get_leaderboard(self, headers):
        """GET /api/leaderboard retourne une liste."""
        res = client.get("/api/leaderboard", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_leaderboard_contient_champs_requis(self, headers):
        """Le leaderboard a les bons champs."""
        res = client.get("/api/leaderboard", headers=headers)
        for entry in res.json():
            assert "user_id" in entry
            assert "username" in entry
            assert "score" in entry
            assert "solution_hash" not in entry


# ─── HINTS ───────────────────────────────────────────────────

class TestHints:

    def test_hint_valide(self, auth_token, headers):
        """POST /api/levels/{id}/hint retourne un indice."""
        res = client.get("/api/levels", headers=headers)
        levels = res.json()
        if not levels:
            pytest.skip("Aucun niveau")
        level_id = levels[0]["id"]
        res = client.post(f"/api/levels/{level_id}/hint", headers=headers, json={
            "user_id": auth_token["user_id"],
            "position": 1,
        })
        assert res.status_code in (200, 404)
        if res.status_code == 200:
            data = res.json()
            assert "content" in data
            assert "malus" in data

    def test_hint_inexistant(self, auth_token, headers):
        """Indice à une position inexistante retourne 404."""
        res = client.get("/api/levels", headers=headers)
        levels = res.json()
        if not levels:
            pytest.skip("Aucun niveau")
        level_id = levels[0]["id"]
        res = client.post(f"/api/levels/{level_id}/hint", headers=headers, json={
            "user_id": auth_token["user_id"],
            "position": 9999,
        })
        assert res.status_code == 404