import re, hashlib

def _hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

def verifier_regex(pattern: str, targets: list[str], non_targets: list[str], solution_hash: str) -> bool:
    return _hash(pattern) == solution_hash.strip()