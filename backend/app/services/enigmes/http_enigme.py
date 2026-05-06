import httpx

async def verifier_http(url: str, header_cible: str, reponse: str) -> bool:
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(url)
            valeur = resp.headers.get(header_cible)
            if valeur is None:
                return False
            return valeur.strip() == reponse.strip()
    except Exception:
        return False