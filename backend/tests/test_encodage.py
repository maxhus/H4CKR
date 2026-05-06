import pytest
from app.services.enigmes.encodage import (
    verifier_base64,
    verifier_cesar,
    verifier_rot13,
    verifier_hex,
    verifier_binaire
)

# --- BASE64 ---
def test_base64_valide():
    import base64
    encoded = base64.b64encode(b"hello").decode()
    assert verifier_base64(encoded, "hello") == True

def test_base64_invalide():
    assert verifier_base64("pasdubase64!!!", "hello") == False

def test_base64_mauvaise_solution():
    import base64
    encoded = base64.b64encode(b"hello").decode()
    assert verifier_base64(encoded, "world") == False

# --- CESAR ---
def test_cesar_valide():
    assert verifier_cesar("khoor", "hello", 3) == True

def test_cesar_invalide():
    assert verifier_cesar("khoor", "world", 3) == False

def test_cesar_decalage_variable():
    assert verifier_cesar("lipps", "hello", 4) == True

# --- ROT13 ---
def test_rot13_valide():
    assert verifier_rot13("uryyb", "hello") == True

def test_rot13_invalide():
    assert verifier_rot13("uryyb", "world") == False

# --- HEX ---
def test_hex_valide():
    assert verifier_hex("68656c6c6f", "hello") == True

def test_hex_invalide():
    assert verifier_hex("zzzzzz", "hello") == False

def test_hex_mauvaise_solution():
    assert verifier_hex("68656c6c6f", "world") == False

# --- BINAIRE ---
def test_binaire_valide():
    assert verifier_binaire("01101000 01100101 01101100 01101100 01101111", "hello") == True

def test_binaire_invalide():
    assert verifier_binaire("99999999", "hello") == False