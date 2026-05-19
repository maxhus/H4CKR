import hashlib
import pytest
from app.services.enigmes.json_enigme import verifier_json


def sha256(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


# ─── JSON ────────────────────────────────────────────────────
# Le joueur lit le JSON et soumet la valeur en clair.
# Le backend compare le hash de la réponse avec solution_hash.

def test_json_valide():
    """Réponse correcte : valeur extraite du JSON."""
    assert verifier_json('{"nom": "alice"}', "nom", "alice", sha256("alice")) is True

def test_json_mauvaise_reponse():
    """Réponse incorrecte."""
    assert verifier_json('{"nom": "alice"}', "nom", "bob", sha256("alice")) is False

def test_json_casse_insensible():
    """La comparaison est insensible à la casse."""
    assert verifier_json('{"nom": "alice"}', "nom", "ALICE", sha256("alice")) is True

def test_json_valeur_avec_underscore():
    """Valeur avec underscore (cas omega_protocol)."""
    assert verifier_json(
        '{"access": "omega_protocol"}',
        "access",
        "omega_protocol",
        sha256("omega_protocol")
    ) is True

def test_json_valeur_incorrecte():
    """Mauvaise valeur soumise."""
    assert verifier_json(
        '{"access": "omega_protocol"}',
        "access",
        "wrong_value",
        sha256("omega_protocol")
    ) is False



def test_json_valeur_entier():
    """Valeur entière convertie en string."""
    assert verifier_json('{"score": 42}', "score", "42", sha256("42")) is True

def test_json_node_correct():
    """Extraction correcte d'une valeur imbriquée via la bonne clé."""
    assert verifier_json(
        '{"id": "node-77"}',
        "id",
        "node-77",
        sha256("node-77")
    ) is True