import httpx, hashlib

def _hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

async def verifier_http(url: str, header_cible: str, reponse: str, solution_hash: str) -> bool:
    return _hash(reponse) == solution_hash.strip()