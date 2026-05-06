import base64
import binascii
import codecs

def verifier_base64(reponse: str, solution: str) -> bool:
    try:
        decoded = base64.b64decode(reponse).decode("utf-8")
        return decoded.strip() == solution.strip()
    except Exception:
        return False

def verifier_cesar(reponse: str, solution: str, decalage: int) -> bool:
    def cesar(text, d):
        result = ""
        for c in text:
            if c.isalpha():
                base = ord('A') if c.isupper() else ord('a')
                result += chr((ord(c) - base + d) % 26 + base)
            else:
                result += c
        return result
    return cesar(reponse, -decalage).strip() == solution.strip()

def verifier_rot13(reponse: str, solution: str) -> bool:
    return codecs.encode(reponse, 'rot_13').strip() == solution.strip()

def verifier_hex(reponse: str, solution: str) -> bool:
    try:
        decoded = binascii.unhexlify(reponse.strip()).decode("utf-8")
        return decoded.strip() == solution.strip()
    except Exception:
        return False

def verifier_binaire(reponse: str, solution: str) -> bool:
    try:
        bits = reponse.strip().split()
        decoded = ''.join(chr(int(b, 2)) for b in bits)
        return decoded.strip() == solution.strip()
    except Exception:
        return False