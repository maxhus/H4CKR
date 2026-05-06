import pytest
from app.services.enigmes.regex_enigme import verifier_regex

def test_regex_valide():
    assert verifier_regex(r"\d+", ["123", "456"], ["abc", "xyz"]) == True

def test_regex_invalide_target():
    assert verifier_regex(r"\d+", ["abc"], []) == False

def test_regex_invalide_non_target():
    assert verifier_regex(r"\d+", ["123"], ["456"]) == False

def test_regex_pattern_invalide():
    assert verifier_regex(r"[invalid", ["123"], []) == False

def test_regex_email():
    assert verifier_regex(
        r"^[\w.-]+@[\w.-]+\.\w+$",
        ["test@email.com", "user@domain.fr"],
        ["pasunemail", "manque@point"]
    ) == True

def test_regex_vide():
    assert verifier_regex(r"\d+", [], []) == True