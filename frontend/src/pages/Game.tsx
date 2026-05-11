import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import ArtifactViewer from "../components/ArtifactViewer";

interface Level {
  id: number;
  chapter: number;
  position: number;
  type: string;
  title: string | null;
  description: string | null;
  artifact_url: string | null;
  points: number;
}

export default function Game() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [unlockedLevelIndex, setUnlockedLevelIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [hintPosition, setHintPosition] = useState(0);
  const [hintMalus, setHintMalus] = useState(0);
  const [noMoreHints, setNoMoreHints] = useState(false);
  const userId = useAuthStore((s) => s.userId);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      api.get("/levels"),
      api.get(`/progress?user_id=${userId}`),
    ]).then(([levelsRes, progressRes]) => {
      const lvls: Level[] = levelsRes.data;
      setLevels(lvls);
      const completedIds = new Set<number>(progressRes.data.map((p: { level_id: number }) => p.level_id));
      const totalScore = progressRes.data.reduce((acc: number, p: { score: number }) => acc + p.score, 0);
      setScore(totalScore);
      // Détermine le dernier niveau déverrouillé
      let lastUnlocked = 0;
      lvls.forEach((l, i) => {
        if (completedIds.has(l.id)) lastUnlocked = i + 1;
      });
      setUnlockedLevelIndex(Math.min(lastUnlocked, lvls.length - 1));
      const firstUnlocked = lvls.find((l) => !completedIds.has(l.id)) ?? lvls[0];
      setCurrentLevel(firstUnlocked ?? null);
    });
  }, [userId]);

  const resetHints = () => {
    setHints([]);
    setHintPosition(0);
    setHintMalus(0);
    setNoMoreHints(false);
  };

  const handleHint = async () => {
    if (!currentLevel || !userId || noMoreHints) return;
    try {
      const res = await api.post(`/levels/${currentLevel.id}/hint`, {
        user_id: userId,
        position: hintPosition + 1,
      });
      setHints((prev) => [...prev, res.data.content]);
      setHintPosition((p) => p + 1);
      setHintMalus((m) => m + res.data.malus);
    } catch {
      setNoMoreHints(true);
    }
  };

  const handleSubmit = async () => {
    if (!currentLevel || !userId) return;
    setLoading(true);
    try {
      const res = await api.post(`/levels/${currentLevel.id}/answer`, {
        user_id: userId,
        reponse: answer,
        indices_utilises: hintMalus,
        extra: {},
      });

      if (res.data.valide) {
        setScore((s) => s + res.data.score);
        const currentIndex = levels.findIndex((l) => l.id === currentLevel.id);
        const nextIndex = currentIndex + 1;

        if (nextIndex < levels.length) {
          setUnlockedLevelIndex((prev) => Math.max(prev, nextIndex));
          setFeedback("ACCESS GRANTED — Niveau suivant débloqué !");
          setTimeout(() => {
            setCurrentLevel(levels[nextIndex]);
            setAnswer("");
            setFeedback("");
            resetHints();
          }, 1500);
        } else {
          setFeedback("🎉 ACCESS GRANTED — Tous les niveaux complétés !");
        }
      } else {
        setFeedback("ACCESS DENIED");
      }
    } catch {
      setFeedback("ERREUR RÉSEAU");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl tracking-widest">H4CKR</h1>
        <div className="flex gap-4 text-sm">
          <span>SCORE: {score}</span>
          <button onClick={() => navigate("/leaderboard")} className="hover:underline">LEADERBOARD</button>
          <button onClick={() => navigate("/profile")} className="hover:underline">PROFILE</button>
          <button onClick={() => { logout(); navigate("/"); }} className="text-red-500 hover:underline">LOGOUT</button>
        </div>
      </div>

      {/* Carte du niveau */}
      {currentLevel && (
        <div className="border border-green-800 p-4 flex flex-col gap-2">
          <p className="text-xs text-green-600">
            CHAPITRE {currentLevel.chapter} — NIVEAU {currentLevel.position} — {currentLevel.type.toUpperCase()}
          </p>
          <p className="text-xs text-green-600">Points : {currentLevel.points}</p>
          {currentLevel.title && (
            <p className="text-lg">{currentLevel.title}</p>
          )}
          {currentLevel.description && (
            <p className="text-sm text-green-300 leading-relaxed">{currentLevel.description}</p>
          )}
          {currentLevel.artifact_url && (
            <ArtifactViewer type="file" url={currentLevel.artifact_url} />
          )}

          {/* Indices affichés */}
          {hints.length > 0 && (
            <div className="border border-yellow-800 p-3 mt-2 flex flex-col gap-2">
              <p className="text-xs text-yellow-600 tracking-widest">
                INDICES — malus actuel : -{hintMalus} pts
              </p>
              {hints.map((h, i) => (
                <p key={i} className="text-sm text-yellow-300">▶ {h}</p>
              ))}
            </div>
          )}

          {/* Bouton indice */}
          <button
            onClick={handleHint}
            disabled={noMoreHints}
            className="text-xs text-yellow-600 border border-yellow-800 px-3 py-1 mt-1 hover:bg-yellow-900 transition w-fit disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {noMoreHints ? "AUCUN INDICE DISPONIBLE" : `DEMANDER UN INDICE${hints.length > 0 ? ` (indice ${hints.length + 1})` : ""}`}
          </button>
        </div>
      )}

      {/* Sélecteur de niveaux */}
      <div className="flex gap-2 flex-wrap">
        {levels.map((l, index) => {
          const isUnlocked = index <= unlockedLevelIndex;
          const isActive = currentLevel?.id === l.id;
          return (
            <button
              key={l.id}
              onClick={() => {
                if (!isUnlocked) return;
                setCurrentLevel(l);
                setFeedback("");
                setAnswer("");
                resetHints();
              }}
              disabled={!isUnlocked}
              className={`border px-3 py-1 text-sm transition ${
                isActive
                  ? "bg-green-500 text-black border-green-500"
                  : isUnlocked
                  ? "border-green-800 hover:border-green-500"
                  : "border-green-900 text-green-900 cursor-not-allowed opacity-40"
              }`}
            >
              {l.chapter}-{l.position}{!isUnlocked ? " 🔒" : ""}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      <div className={`p-4 text-lg ${
        feedback.startsWith("ACCESS GRANTED") ? "text-green-400" :
        feedback === "ACCESS DENIED" ? "text-red-500" :
        feedback ? "text-yellow-400" : "text-green-800"
      }`}>
        {feedback || "EN ATTENTE DE RÉPONSE..."}
      </div>

      {/* Input réponse */}
      <input
        className="bg-black border border-green-500 p-2 outline-none"
        placeholder="Saisissez votre réponse..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !currentLevel}
        className="border border-green-500 p-2 hover:bg-green-500 hover:text-black transition disabled:opacity-50"
      >
        {loading ? "SOUMISSION..." : "SOUMETTRE"}
      </button>
    </div>
  );
}