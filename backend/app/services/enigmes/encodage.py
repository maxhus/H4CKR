import base64
import binascii
import codecs
import hashlib

def _hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

def verifier_base64(reponse: str, solution_hash: str) -> bool:
    # Le joueur soumet la réponse décodée, on compare directement le hash
    return _hash(reponse) == solution_hash.strip()

def verifier_cesar(reponse: str, solution_hash: str, decalage: int) -> bool:
    return _hash(reponse) == solution_hash.strip()

def verifier_rot13(reponse: str, solution_hash: str) -> bool:
    return _hash(reponse) == solution_hash.strip()

def verifier_hex(reponse: str, solution_hash: str) -> bool:
    return _hash(reponse) == solution_hash.strip()

def verifier_binaire(reponse: str, solution_hash: str) -> bool:
    return _hash(reponse) == solution_hash.strip()