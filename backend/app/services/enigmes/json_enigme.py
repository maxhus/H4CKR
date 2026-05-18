import hashlib

def _hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

def verifier_json(json_casse: str, cle_cible: str, reponse: str, solution_hash: str) -> bool:
    return _hash(reponse) == solution_hash.strip()