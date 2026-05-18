import pytest
from app.services.enigmes.json_enigme import verifier_json

def test_json_valide():
    json_str = '{"nom": "alice", "age": 25}'
    assert verifier_json(json_str, "nom", "alice") == True

def test_json_cle_inexistante():
    json_str = '{"nom": "alice"}'
    assert verifier_json(json_str, "age", "25") == False

def test_json_mauvaise_valeur():
    json_str = '{"nom": "alice"}'
    assert verifier_json(json_str, "nom", "bob") == False

def test_json_casse():
    assert verifier_json("pas du json !!!", "cle", "valeur") == False

def test_json_valeur_entier():
    json_str = '{"score": 42}'
    assert verifier_json(json_str, "score", "42") == True

def test_json_vide():
    assert verifier_json("{}", "cle", "valeur") == False