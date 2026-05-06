import pytest
from app.services.score import calculer_score

def test_score_sans_indice():
    assert calculer_score(100, 0) == 100

def test_score_un_indice():
    assert calculer_score(100, 1) == 90

def test_score_deux_indices():
    assert calculer_score(100, 2) == 80

def test_score_trois_indices():
    assert calculer_score(100, 3) == 70

def test_score_max_indices():
    assert calculer_score(100, 10) == 0

def test_score_points_variables():
    assert calculer_score(200, 1) == 180

def test_score_jamais_negatif():
    assert calculer_score(100, 20) >= 0