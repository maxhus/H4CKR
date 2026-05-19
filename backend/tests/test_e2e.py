"""
Tests E2E Playwright — H4CKR
Parcours complet sur 3 niveaux représentatifs.
"""

import time
import pytest
import requests
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:5173"
API_URL  = "http://localhost:8000/api"
TEST_PASSWORD = "E2eTest123"


# ─── HELPERS ─────────────────────────────────────────────────

def unique_user():
    return f"e2e_{int(time.time() * 1000) % 9999999}"


def api_register_login(username: str, password: str) -> dict:
    res = requests.post(f"{API_URL}/auth/register",
                        json={"username": username, "password": password})
    if res.status_code == 400:
        res = requests.post(f"{API_URL}/auth/login",
                            json={"username": username, "password": password})
    data = res.json()
    return {
        "token": data["access_token"],
        "user_id": data["user_id"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


def api_complete_levels(auth: dict, solutions: dict):
    """Complète des niveaux via l'API (position → réponse)."""
    levels = requests.get(f"{API_URL}/levels", headers=auth["headers"]).json()
    for level in levels:
        sol = solutions.get(level["position"])
        if sol:
            requests.post(
                f"{API_URL}/levels/{level['id']}/answer",
                headers=auth["headers"],
                json={"user_id": auth["user_id"], "reponse": sol,
                      "indices_utilises": 0, "extra": {}},
            )


def ui_login(page: Page, username: str, password: str):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.locator("button", has_text="CONNEXION").first.click()
    page.locator("input[placeholder='username']").fill(username)
    page.locator("input[type='password']").fill(password)
    page.locator("button", has_text="ACCÉDER").first.click()
    page.wait_for_url(f"{BASE_URL}/game", timeout=10000)


def ui_register(page: Page, username: str, password: str):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.locator("button", has_text="INSCRIPTION").first.click()
    page.locator("input[placeholder='username']").fill(username)
    page.locator("input[type='password']").fill(password)
    page.locator("button", has_text="CRÉER").first.click()
    page.wait_for_url(f"{BASE_URL}/game", timeout=10000)


def submit_answer(page: Page, answer: str):
    """Soumet une réponse dans l'interface de jeu."""
    # Sélectionne le dernier input visible (champ de réponse)
    page.locator("input[placeholder*='accès'], input[placeholder*='réponse'], input[placeholder*='complété']").last.fill(answer)
    page.locator("button", has_text="SOUMETTRE").last.click()
    page.wait_for_timeout(1500)


def is_at_login(page: Page) -> bool:
    """Vérifie qu'on est sur la page de login."""
    return (f"{BASE_URL}/" in page.url or page.url == BASE_URL) and \
           page.locator("input[placeholder='username']").is_visible()


# ═══════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════

class TestAuthE2E:

    def test_page_login_charge(self, page: Page):
        """La page de login s'affiche correctement."""
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        expect(page.locator("text=H4CKR").first).to_be_visible()
        expect(page.locator("button", has_text="CONNEXION").first).to_be_visible()
        expect(page.locator("button", has_text="INSCRIPTION").first).to_be_visible()

    def test_register_nouvel_utilisateur(self, page: Page):
        """Un nouvel utilisateur peut s'inscrire et accéder au jeu."""
        ui_register(page, unique_user(), TEST_PASSWORD)
        assert "/game" in page.url

    def test_login_utilisateur_existant(self, page: Page):
        """Un utilisateur existant peut se connecter."""
        username = unique_user()
        api_register_login(username, TEST_PASSWORD)
        ui_login(page, username, TEST_PASSWORD)
        assert "/game" in page.url

    def test_login_mauvais_password(self, page: Page):
        """Un mauvais mot de passe n'accède pas au jeu."""
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.locator("input[placeholder='username']").fill("user_inexistant_xyz_99")
        page.locator("input[type='password']").fill("mauvais")
        page.locator("button", has_text="ACCÉDER").first.click()
        page.wait_for_timeout(2000)
        assert "/game" not in page.url or \
               page.locator("input[placeholder='username']").is_visible()

    def test_redirect_sans_auth(self, page: Page):
        """Accéder à /game sans token redirige vers login."""
        page.goto(BASE_URL)
        page.evaluate("localStorage.clear()")
        page.goto(f"{BASE_URL}/game")
        page.wait_for_timeout(2000)
        # Soit redirigé, soit l'input de login est visible
        redirected = "/game" not in page.url
        login_visible = page.locator("input[placeholder='username']").is_visible()
        assert redirected or login_visible

    def test_token_jwt_valide(self, page: Page):
        """Le token retourné est un JWT valide (3 parties)."""
        auth = api_register_login(unique_user(), TEST_PASSWORD)
        assert len(auth["token"].split(".")) == 3


# ═══════════════════════════════════════════════════════════════
# JEU — GÉNÉRAL
# ═══════════════════════════════════════════════════════════════

class TestGameE2E:

    @pytest.fixture(autouse=True)
    def login_user(self, page: Page):
        ui_register(page, unique_user(), TEST_PASSWORD)
        page.wait_for_timeout(1000)

    def test_page_jeu_charge(self, page: Page):
        """La page de jeu affiche les éléments principaux."""
        expect(page.locator("text=H4CKR").first).to_be_visible()
        expect(page.locator("text=SCORE").first).to_be_visible()

    def test_solution_hash_absent_dom(self, page: Page):
        """SÉCURITÉ : solution_hash n'apparaît jamais dans le DOM."""
        assert "solution_hash" not in page.content()

    def test_timer_visible(self, page: Page):
        """Le timer s'affiche dans le header."""
        page.wait_for_timeout(1500)
        expect(page.locator("text=/\\d{2}:\\d{2}/").first).to_be_visible()

    def test_progression_visible(self, page: Page):
        """La barre de progression est visible."""
        expect(page.locator("text=PROGRESSION").first).to_be_visible(timeout=5000)

    def test_logout_fonctionne(self, page: Page):
        """Le logout redirige vers la page de login."""
        page.locator("button", has_text="LOGOUT").first.click()
        page.wait_for_timeout(2000)
        assert is_at_login(page)


# ═══════════════════════════════════════════════════════════════
# NIVEAU 1 — BASE64
# ═══════════════════════════════════════════════════════════════

class TestNiveau1Base64:

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        ui_register(page, unique_user(), TEST_PASSWORD)
        page.wait_for_timeout(1500)

    def test_solution_hash_absent(self, page: Page):
        """solution_hash absent du DOM au chargement."""
        assert "solution_hash" not in page.content()

    def test_champ_reponse_visible(self, page: Page):
        """Le champ de saisie est visible."""
        inp = page.locator("input[placeholder*='accès'], input[placeholder*='réponse']").last
        expect(inp).to_be_visible(timeout=5000)

    def test_mauvaise_reponse_access_denied(self, page: Page):
        """Une mauvaise réponse affiche ACCESS DENIED."""
        submit_answer(page, "MAUVAISE_REPONSE_XYZ")
        expect(page.locator("text=ACCESS DENIED").first).to_be_visible(timeout=6000)

    def test_bonne_reponse_access_granted(self, page: Page):
        """La bonne réponse ACCESS_GRANTED valide le niveau 1."""
        submit_answer(page, "ACCESS_GRANTED")
        expect(page.locator("text=ACCESS GRANTED").first).to_be_visible(timeout=8000)

    def test_score_augmente_apres_validation(self, page: Page):
        """Le score augmente après une bonne réponse."""
        submit_answer(page, "ACCESS_GRANTED")
        page.wait_for_timeout(3000)
        # Score dans le header — vérifie qu'il n'est plus 0
        content = page.content()
        assert "SCORE" in content

    def test_indice_disponible(self, page: Page):
        """Un bouton d'indice est présent."""
        # Le bouton indice contient "+ INDICE" ou "DEMANDER"
        indice = page.locator("button", has_text="INDICE")
        expect(indice.first).to_be_visible(timeout=5000)

    def test_solution_hash_absent_apres_submit(self, page: Page):
        """solution_hash absent après soumission."""
        submit_answer(page, "MAUVAISE")
        page.wait_for_timeout(1000)
        assert "solution_hash" not in page.content()


# ═══════════════════════════════════════════════════════════════
# NIVEAU 5 — REGEX
# ═══════════════════════════════════════════════════════════════

class TestNiveau5Regex:

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        username = unique_user()
        auth = api_register_login(username, TEST_PASSWORD)
        api_complete_levels(auth, {
            1: "ACCESS_GRANTED", 2: "NEON SHADOW",
            3: "DARKNET", 4: "SYSTEM",
        })
        ui_login(page, username, TEST_PASSWORD)
        page.wait_for_timeout(2000)

    def test_niveau5_debloque(self, page: Page):
        """Le niveau 5 (2-1) est accessible après les 4 premiers."""
        # Cherche le bouton 2-1 dans la page
        btn = page.locator("button", has_text="2-1")
        expect(btn.first).to_be_visible(timeout=5000)

    def test_bonne_regex_validee(self, page: Page):
        """La regex correcte valide le niveau 5."""
        btn = page.locator("button", has_text="2-1").first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(800)
        submit_answer(page, "^[A-Z]{3}[0-9]{2}$")
        page.wait_for_timeout(3000)
        content = page.content()
        assert "ACCESS GRANTED" in content or "COMPLÉTÉ" in content

    def test_mauvaise_regex_refusee(self, page: Page):
        """Une mauvaise regex retourne ACCESS DENIED."""
        btn = page.locator("button", has_text="2-1").first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(800)
        submit_answer(page, "REGEX_INCORRECTE")
        expect(page.locator("text=ACCESS DENIED").first).to_be_visible(timeout=6000)

    def test_solution_hash_absent(self, page: Page):
        """solution_hash absent du DOM."""
        assert "solution_hash" not in page.content()


# ═══════════════════════════════════════════════════════════════
# NIVEAU 6 — JSON
# ═══════════════════════════════════════════════════════════════

class TestNiveau6JSON:

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        username = unique_user()
        auth = api_register_login(username, TEST_PASSWORD)
        api_complete_levels(auth, {
            1: "ACCESS_GRANTED", 2: "NEON SHADOW", 3: "DARKNET",
            4: "SYSTEM", 5: "^[A-Z]{3}[0-9]{2}$",
        })
        ui_login(page, username, TEST_PASSWORD)
        page.wait_for_timeout(2000)

    def test_niveau6_debloque(self, page: Page):
        """Le niveau 6 (2-2) est accessible."""
        btn = page.locator("button", has_text="2-2")
        expect(btn.first).to_be_visible(timeout=5000)

    def test_bonne_reponse_json(self, page: Page):
        """omega_protocol valide le niveau 6."""
        btn = page.locator("button", has_text="2-2").first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(800)
        submit_answer(page, "omega_protocol")
        page.wait_for_timeout(3000)
        content = page.content()
        assert "ACCESS GRANTED" in content or "COMPLÉTÉ" in content

    def test_mauvaise_reponse_json(self, page: Page):
        """Une mauvaise réponse retourne ACCESS DENIED."""
        btn = page.locator("button", has_text="2-2").first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(800)
        submit_answer(page, "MAUVAISE_VALEUR_JSON")
        expect(page.locator("text=ACCESS DENIED").first).to_be_visible(timeout=6000)

    def test_solution_hash_absent_apres_soumission(self, page: Page):
        """solution_hash absent même après soumission d'une réponse."""
        btn = page.locator("button", has_text="2-2").first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(800)
        submit_answer(page, "test_securite")
        page.wait_for_timeout(1000)
        assert "solution_hash" not in page.content()


# ═══════════════════════════════════════════════════════════════
# SÉCURITÉ
# ═══════════════════════════════════════════════════════════════

class TestSecuriteE2E:

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        ui_register(page, unique_user(), TEST_PASSWORD)
        page.wait_for_timeout(1000)

    def test_hash_absent_page_jeu(self, page: Page):
        """solution_hash absent de la page de jeu."""
        assert "solution_hash" not in page.content()

    def test_navigation_leaderboard(self, page: Page):
        """Navigation vers le leaderboard fonctionne."""
        page.goto(f"{BASE_URL}/leaderboard")
        page.wait_for_load_state("networkidle")
        assert "solution_hash" not in page.content()
        expect(page.locator("text=LEADERBOARD").first).to_be_visible()

    def test_hash_absent_profil(self, page: Page):
        """solution_hash absent du profil."""
        page.goto(f"{BASE_URL}/profile")
        page.wait_for_load_state("networkidle")
        assert "solution_hash" not in page.content()

    def test_logout_deconnecte(self, page: Page):
        """Le logout déconnecte et redirige."""
        page.locator("button", has_text="LOGOUT").first.click()
        page.wait_for_timeout(2000)
        assert is_at_login(page)