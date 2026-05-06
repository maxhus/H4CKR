import json

def verifier_json(json_casse: str, cle_cible: str, reponse: str) -> bool:
    try:
        data = json.loads(json_casse)
        valeur = data.get(cle_cible)
        return str(valeur).strip() == reponse.strip()
    except Exception:
        return False