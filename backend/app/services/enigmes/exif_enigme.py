import hashlib
from PIL import Image
from PIL.ExifTags import TAGS

def _hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

def verifier_exif(image_path: str, champ: str, reponse: str, solution_hash: str) -> bool:
    return _hash(reponse) == solution_hash.strip()