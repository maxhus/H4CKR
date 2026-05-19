import hashlib
import pytest
from app.services.enigmes.regex_enigme import verifier_regex


def sha256(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


# ─── REGEX ───────────────────────────────────────────────────
# Le joueur soumet une expression régulière en clair.
# Le backend compare le hash de la regex soumise avec solution_hash.

def test_regex_valide():
    """Pattern correct soumis."""
    pattern = r"^[A-Z]{3}[0-9]{2}$"
    assert verifier_regex(pattern, [], [], sha256(pattern)) is True

def test_regex_invalide():
    """Mauvais pattern soumis."""
    pattern = r"^[A-Z]{3}[0-9]{2}$"
    assert verifier_regex(r"[a-z]+", [], [], sha256(pattern)) is False

def test_regex_pattern_avance():
    """Regex avancée avec lookaheads."""
    pattern = r"^(?=.*[A-Z])(?=.*\d).{8,}$"
    assert verifier_regex(pattern, [], [], sha256(pattern)) is True

def test_regex_pattern_avance_incorrect():
    """Mauvaise regex avancée."""
    pattern = r"^(?=.*[A-Z])(?=.*\d).{8,}$"
    assert verifier_regex(r"^[A-Z]+$", [], [], sha256(pattern)) is False

def test_regex_casse_insensible():
    """La comparaison est insensible à la casse."""
    pattern = r"^[A-Z]{3}[0-9]{2}$"
    assert verifier_regex(pattern.upper(), [], [], sha256(pattern)) is True

def test_regex_espaces_ignores():
    """Les espaces en bordure sont ignorés."""
    pattern = r"^[A-Z]{3}[0-9]{2}$"
    assert verifier_regex(f"  {pattern}  ", [], [], sha256(pattern)) is True

def test_regex_email():
    """Pattern email soumis correctement."""
    pattern = r"^[\w.-]+@[\w.-]+\.\w+$"
    assert verifier_regex(pattern, [], [], sha256(pattern)) is True

def test_regex_differente():
    """Deux patterns différents ne correspondent pas."""
    assert verifier_regex(
        r"^[A-Z]{3}[0-9]{2}$",
        [], [],
        sha256(r"^(?=.*[A-Z])(?=.*\d).{8,}$")
    ) is False