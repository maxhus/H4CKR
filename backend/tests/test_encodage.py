import hashlib
import base64
import pytest
from app.services.enigmes.encodage import (
    verifier_base64,
    verifier_cesar,
    verifier_rot13,
    verifier_hex,
    verifier_binaire,
)


def sha256(text: str) -> str:
    """Helper : génère le hash SHA256 comme le fait le backend."""
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


# ─── BASE64 ──────────────────────────────────────────────────
# Le joueur décode le Base64 lui-même et soumet le texte en clair.
# Le backend hache la réponse et compare avec solution_hash.

def test_base64_valide():
    """Réponse correcte : texte en clair correspond au hash."""
    assert verifier_base64("hello", sha256("hello")) is True

def test_base64_invalide():
    """Réponse incorrecte : mauvais texte."""
    assert verifier_base64("world", sha256("hello")) is False

def test_base64_casse_insensible():
    """La comparaison est insensible à la casse."""
    assert verifier_base64("HELLO", sha256("hello")) is True

def test_base64_espaces_ignores():
    """Les espaces en bordure sont ignorés."""
    assert verifier_base64("  hello  ", sha256("hello")) is True

def test_base64_vide():
    """Réponse vide ne correspond pas."""
    assert verifier_base64("", sha256("hello")) is False


# ─── CÉSAR ───────────────────────────────────────────────────
# Le joueur déchiffre le César et soumet le texte en clair.

def test_cesar_valide():
    """'khoor' déchiffré avec décalage 3 = 'hello'."""
    assert verifier_cesar("hello", sha256("hello"), 3) is True

def test_cesar_invalide():
    """Mauvaise réponse."""
    assert verifier_cesar("world", sha256("hello"), 3) is False

def test_cesar_decalage_4():
    """'lipps' déchiffré avec décalage 4 = 'hello'."""
    assert verifier_cesar("hello", sha256("hello"), 4) is True

def test_cesar_casse_insensible():
    """La comparaison est insensible à la casse."""
    assert verifier_cesar("HELLO", sha256("hello"), 3) is True

def test_cesar_decalage_zero():
    """Décalage 0 : le texte est identique."""
    assert verifier_cesar("hello", sha256("hello"), 0) is True


# ─── ROT13 ───────────────────────────────────────────────────

def test_rot13_valide():
    """'uryyb' décodé ROT13 = 'hello'."""
    assert verifier_rot13("hello", sha256("hello")) is True

def test_rot13_invalide():
    """Mauvaise réponse."""
    assert verifier_rot13("world", sha256("hello")) is False

def test_rot13_casse_insensible():
    assert verifier_rot13("HELLO", sha256("hello")) is True

def test_rot13_solution_differente():
    assert verifier_rot13("darknet", sha256("darknet")) is True


# ─── HEXADÉCIMAL ─────────────────────────────────────────────

def test_hex_valide():
    """'68656c6c6f' = 'hello' en ASCII hex."""
    assert verifier_hex("hello", sha256("hello")) is True

def test_hex_invalide():
    assert verifier_hex("world", sha256("hello")) is False

def test_hex_casse_insensible():
    assert verifier_hex("HELLO", sha256("hello")) is True

def test_hex_solution_system():
    assert verifier_hex("system", sha256("system")) is True


# ─── BINAIRE ─────────────────────────────────────────────────

def test_binaire_valide():
    """Le joueur soumet le texte décodé en clair."""
    assert verifier_binaire("hello", sha256("hello")) is True

def test_binaire_invalide():
    assert verifier_binaire("world", sha256("hello")) is False

def test_binaire_casse_insensible():
    assert verifier_binaire("HELLO", sha256("hello")) is True

def test_binaire_cyber_core():
    assert verifier_binaire("cyber_core", sha256("cyber_core")) is True