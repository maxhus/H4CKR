import hashlib
import pytest
from app.services.enigmes.exif_enigme import verifier_exif
from app.services.enigmes.http_enigme import verifier_http


def sha256(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


# ─── EXIF ────────────────────────────────────────────────────

def test_exif_valide():
    """Réponse correcte : hash correspond."""
    assert verifier_exif("ghost.png", "Author", "ghost_user", sha256("ghost_user")) is True

def test_exif_invalide():
    """Mauvaise réponse."""
    assert verifier_exif("ghost.png", "Author", "wrong_user", sha256("ghost_user")) is False

def test_exif_casse_insensible():
    """Insensible à la casse."""
    assert verifier_exif("ghost.png", "Author", "GHOST_USER", sha256("ghost_user")) is True

def test_exif_espaces_ignores():
    """Espaces en bordure ignorés."""
    assert verifier_exif("ghost.png", "Author", "  ghost_user  ", sha256("ghost_user")) is True

def test_exif_champ_different():
    """Le champ passé ne change pas le résultat — seule la réponse compte."""
    assert verifier_exif("photo.jpg", "GPS", "51.5074n", sha256("51.5074n")) is True

def test_exif_reponse_vide():
    """Réponse vide ne correspond pas."""
    assert verifier_exif("ghost.png", "Author", "", sha256("ghost_user")) is False

def test_exif_image_path_ignoree():
    """Le chemin de l'image n'affecte pas la validation."""
    assert verifier_exif("inexistant.png", "Author", "ghost_user", sha256("ghost_user")) is True


# ─── HTTP ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_http_valide():
    """Réponse correcte."""
    assert await verifier_http("http://exemple.com", "X-H4CKR-ACCESS", "x-h4ckr-access", sha256("x-h4ckr-access")) is True

@pytest.mark.asyncio
async def test_http_invalide():
    """Mauvaise réponse."""
    assert await verifier_http("http://exemple.com", "X-H4CKR-ACCESS", "wrong-header", sha256("x-h4ckr-access")) is False

@pytest.mark.asyncio
async def test_http_casse_insensible():
    """Insensible à la casse."""
    assert await verifier_http("http://exemple.com", "X-H4CKR-ACCESS", "X-H4CKR-ACCESS", sha256("x-h4ckr-access")) is True

@pytest.mark.asyncio
async def test_http_espaces_ignores():
    """Espaces ignorés."""
    assert await verifier_http("http://exemple.com", "X-H4CKR-ACCESS", "  x-h4ckr-access  ", sha256("x-h4ckr-access")) is True

@pytest.mark.asyncio
async def test_http_final_node():
    """Test avec FINAL_NODE."""
    assert await verifier_http("http://exemple.com", "Location", "final_node", sha256("final_node")) is True

@pytest.mark.asyncio
async def test_http_url_ignoree():
    """L'URL n'affecte pas la validation."""
    assert await verifier_http("http://nexus-corp.invalid", "X-Header", "x-h4ckr-access", sha256("x-h4ckr-access")) is True

@pytest.mark.asyncio
async def test_http_reponse_vide():
    """Réponse vide ne correspond pas."""
    assert await verifier_http("http://exemple.com", "X-H4CKR-ACCESS", "", sha256("x-h4ckr-access")) is False