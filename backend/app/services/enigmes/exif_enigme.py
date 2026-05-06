from PIL import Image
from PIL.ExifTags import TAGS

def extraire_exif(image_path: str, champ: str) -> str | None:
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        if not exif_data:
            return None
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag.lower() == champ.lower():
                return str(value)
        return None
    except Exception:
        return None

def verifier_exif(image_path: str, champ: str, reponse: str) -> bool:
    valeur = extraire_exif(image_path, champ)
    if valeur is None:
        return False
    return valeur.strip() == reponse.strip()