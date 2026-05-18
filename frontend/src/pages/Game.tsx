import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";

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

// ─── Écran de félicitations ───────────────────────────────────
function VictoryScreen({ score, time, onLeaderboard, onLogout }: {
  score: number;
  time: string;
  onLeaderboard: () => void;
  onLogout: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center font-mono transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute text-green-900 text-xs animate-pulse"
            style={{ left: `${(i * 17 + 5) % 100}%`, top: `${(i * 23 + 10) % 100}%`, animationDelay: `${(i * 0.3) % 2}s` }}>
            {i % 2 === 0 ? "01" : "10"}
          </div>
        ))}
      </div>

      <div className="relative border border-green-500 bg-black p-12 max-w-lg w-full text-center flex flex-col gap-6 shadow-2xl shadow-green-900/50">
        <div>
          <p className="text-xs text-green-600 tracking-widest mb-2">MISSION ACCOMPLIE</p>
          <h1 className="text-4xl text-green-400 tracking-widest mb-1">H4CKR</h1>
          <p className="text-xs text-green-700">NEXUS CORP — SYSTÈME COMPROMIS</p>
        </div>

        <div className="border-t border-green-900" />

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center border border-green-900 p-3">
            <span className="text-xs text-green-600 tracking-widest">SCORE FINAL</span>
            <span className="text-2xl text-green-400">{score}</span>
          </div>
          <div className="flex justify-between items-center border border-green-900 p-3">
            <span className="text-xs text-green-600 tracking-widest">TEMPS TOTAL</span>
            <span className="text-lg text-green-400">{time}</span>
          </div>
          <div className="flex justify-between items-center border border-green-900 p-3">
            <span className="text-xs text-green-600 tracking-widest">NIVEAUX COMPLÉTÉS</span>
            <span className="text-lg text-green-400">15 / 15</span>
          </div>
        </div>

        <p className="text-xs text-green-700 leading-relaxed">
          Tu as infiltré avec succès les serveurs de NEXUS Corp.<br />
          Toutes les données ont été exfiltrées. Mission terminée.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLeaderboard}
            className="flex-1 border border-green-500 p-3 text-sm hover:bg-green-500 hover:text-black transition"
          >
            VOIR LE CLASSEMENT
          </button>
          <button
            onClick={onLogout}
            className="flex-1 border border-red-600 text-red-500 p-3 text-sm hover:bg-red-600 hover:text-black transition"
          >
            DÉCONNEXION
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────
function Timer({ startTime, stopped }: { startTime: number; stopped: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (stopped) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, stopped]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className="text-xs text-green-700 tabular-nums">
      {hours > 0 ? `${pad(hours)}:` : ""}{pad(minutes)}:{pad(seconds)}
    </span>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s` : `${pad(minutes)}m ${pad(seconds)}s`;
}

// ─── Page principale ──────────────────────────────────────────
export default function Game() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [unlockedLevelIndex, setUnlockedLevelIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [hintPosition, setHintPosition] = useState(0);
  const [hintMalus, setHintMalus] = useState(0);
  const [noMoreHints, setNoMoreHints] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.role);
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
      const done = new Set<number>(progressRes.data.map((p: { level_id: number }) => p.level_id));
      const totalScore = progressRes.data.reduce((acc: number, p: { score: number }) => acc + p.score, 0);
      setCompletedIds(done);
      setScore(totalScore);
      let lastUnlocked = 0;
      lvls.forEach((l, i) => { if (done.has(l.id)) lastUnlocked = i + 1; });
      setUnlockedLevelIndex(Math.min(lastUnlocked, lvls.length - 1));
      const firstUnlocked = lvls.find((l) => !done.has(l.id)) ?? lvls[0];
      setCurrentLevel(firstUnlocked ?? null);
      if (done.size === lvls.length && lvls.length > 0) setGameWon(true);
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
    if (completedIds.has(currentLevel.id)) return;
    setLoading(true);
    try {
      const res = await api.post(`/levels/${currentLevel.id}/answer`, {
        user_id: userId,
        reponse: answer,
        indices_utilises: hintMalus,
        extra: {},
      });
      if (res.data.valide) {
        const newCompleted = new Set([...completedIds, currentLevel.id]);
        setScore((s) => s + res.data.score);
        setCompletedIds(newCompleted);

        const currentIndex = levels.findIndex((l) => l.id === currentLevel.id);
        const nextIndex = currentIndex + 1;

        if (newCompleted.size === levels.length) {
          setEndTime(Date.now());
          setFeedback("🎉 ACCESS GRANTED — Tous les niveaux complétés !");
          setTimeout(() => setGameWon(true), 2000);
        } else if (nextIndex < levels.length) {
          setUnlockedLevelIndex((prev) => Math.max(prev, nextIndex));
          setFeedback("ACCESS GRANTED — Niveau suivant débloqué !");
          setTimeout(() => {
            setCurrentLevel(levels[nextIndex]);
            setAnswer("");
            setFeedback("");
            resetHints();
          }, 1500);
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

  const isCompleted = currentLevel ? completedIds.has(currentLevel.id) : false;
  const totalTime = formatTime(endTime ? endTime - startTime : Date.now() - startTime);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8 flex flex-col gap-6">

      {gameWon && (
        <VictoryScreen
          score={score}
          time={totalTime}
          onLeaderboard={() => navigate("/leaderboard")}
          onLogout={() => { logout(); navigate("/"); }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl tracking-widest">H4CKR</h1>
        <div className="flex gap-4 text-sm items-center">
          <Timer startTime={startTime} stopped={gameWon} />
          <span>SCORE: {score}</span>
          <button onClick={() => navigate("/leaderboard")} className="hover:underline">LEADERBOARD</button>
          <button onClick={() => navigate("/profile")} className="hover:underline">PROFILE</button>
          {role === "admin" && (
            <button onClick={() => navigate("/admin")} className="text-yellow-500 hover:underline">ADMIN</button>
          )}
          <button onClick={() => { logout(); navigate("/"); }} className="text-red-500 hover:underline">LOGOUT</button>
        </div>
      </div>

      {/* Progression globale */}
      <div>
        <div className="flex justify-between text-xs text-green-700 mb-1">
          <span>PROGRESSION</span>
          <span>{completedIds.size} / {levels.length} niveaux</span>
        </div>
        <div className="h-1 bg-green-950 w-full">
          <div
            className="h-1 bg-green-500 transition-all duration-500"
            style={{ width: levels.length > 0 ? `${(completedIds.size / levels.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Carte niveau */}
      {currentLevel && (
        <div className={`border p-4 flex flex-col gap-2 ${isCompleted ? "border-green-500 opacity-70" : "border-green-800"}`}>
          <div className="flex justify-between items-center">
            <p className="text-xs text-green-600">
              CHAPITRE {currentLevel.chapter} — NIVEAU {currentLevel.position} — {currentLevel.type.toUpperCase()}
            </p>
            {isCompleted && (
              <span className="text-xs text-green-500 border border-green-500 px-2 py-0.5">✓ COMPLÉTÉ</span>
            )}
          </div>
          <p className="text-xs text-green-600">Points : {currentLevel.points}</p>
          {currentLevel.title && <p className="text-lg">{currentLevel.title}</p>}
          {currentLevel.description && (
            <p className="text-sm text-green-300 leading-relaxed">{currentLevel.description}</p>
          )}
          {currentLevel.artifact_url && (
            <a href={currentLevel.artifact_url} target="_blank" className="text-xs text-green-600 underline mt-1">
              → Voir l'artefact
            </a>
          )}

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

          {!isCompleted && (
            <button
              onClick={handleHint}
              disabled={noMoreHints}
              className="text-xs text-yellow-600 border border-yellow-800 px-3 py-1 mt-1 hover:bg-yellow-900 transition w-fit disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {noMoreHints ? "AUCUN INDICE DISPONIBLE" : `DEMANDER UN INDICE${hints.length > 0 ? ` (indice ${hints.length + 1})` : ""}`}
            </button>
          )}
        </div>
      )}

      {/* Sélecteur niveaux */}
      <div className="flex gap-2 flex-wrap">
        {levels.map((l, index) => {
          const isUnlocked = index <= unlockedLevelIndex;
          const isActive = currentLevel?.id === l.id;
          const isDone = completedIds.has(l.id);
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
                isActive ? "bg-green-500 text-black border-green-500" :
                isDone ? "border-green-600 text-green-600" :
                isUnlocked ? "border-green-800 hover:border-green-500" :
                "border-green-900 text-green-900 cursor-not-allowed opacity-40"
              }`}
            >
              {isDone ? "✓ " : ""}{l.chapter}-{l.position}{!isUnlocked ? " 🔒" : ""}
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
        {isCompleted ? "✓ CE NIVEAU EST DÉJÀ COMPLÉTÉ" : feedback || "EN ATTENTE DE RÉPONSE..."}
      </div>

      {/* Input */}
      <input
        className="bg-black border border-green-500 p-2 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        placeholder={isCompleted ? "Niveau déjà complété" : "Saisissez votre réponse..."}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !isCompleted && handleSubmit()}
        disabled={isCompleted}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !currentLevel || isCompleted}
        className="border border-green-500 p-2 hover:bg-green-500 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCompleted ? "✓ COMPLÉTÉ" : loading ? "SOUMISSION..." : "SOUMETTRE"}
      </button>
    </div>
  );
}