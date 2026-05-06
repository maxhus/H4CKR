def calculer_score(points_base: int, indices_utilises: int) -> int:
    malus = indices_utilises * 10
    multiplicateur = max(0, 100 - malus) / 100
    return int(points_base * multiplicateur)