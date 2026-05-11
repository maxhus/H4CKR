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
    def cesar(text, d):
        result = ""
        for c in text:
            if c.isalpha():
                base = ord('A') if c.isupper() else ord('a')
                result += chr((ord(c) - base + d) % 26 + base)
            else:
                result += c
        return result
    decoded = cesar(reponse, -decalage)
    return _hash(decoded) == solution_hash.strip()

def verifier_rot13(reponse: str, solution_hash: str) -> bool:
    decoded = codecs.encode(reponse, 'rot_13')
    return _hash(decoded) == solution_hash.strip()

def verifier_hex(reponse: str, solution_hash: str) -> bool:
    try:
        decoded = binascii.unhexlify(reponse.strip()).decode("utf-8")
        return _hash(decoded) == solution_hash.strip()
    except Exception:
        return False

def verifier_binaire(reponse: str, solution_hash: str) -> bool:
    try:
        bits = reponse.strip().split()
        decoded = ''.join(chr(int(b, 2)) for b in bits)
        return _hash(decoded) == solution_hash.strip()
    except Exception:
        return False