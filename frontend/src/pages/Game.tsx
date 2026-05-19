import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import MatrixRain from "../components/MatrixRain";
import AvatarCompanion from "../components/AvatarCompanion";
import { useChiptune } from "../hooks/useChiptune";

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

type AvatarTrigger = "idle" | "typing" | "wrong" | "hint" | "correct" | "victory" | "login";

// ─── Victory Screen ───────────────────────────────────────────
function VictoryScreen({ score, time, onLeaderboard, onLogout }: {
  score: number; time: string; onLeaderboard: () => void; onLogout: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [glitchTitle, setGlitchTitle] = useState("MISSION ACCOMPLIE");
  const chars = "!@#$%^&*<>{}[]|/\\01";

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        const arr = "MISSION ACCOMPLIE".split("");
        for (let i = 0; i < 2; i++) arr[Math.floor(Math.random() * arr.length)] = chars[Math.floor(Math.random() * chars.length)];
        setGlitchTitle(arr.join(""));
        setTimeout(() => setGlitchTitle("MISSION ACCOMPLIE"), 100);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.7s" }}
      className="fixed inset-0 z-50 flex items-center justify-center font-mono">
      <MatrixRain />
      <div className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)" }} />
      <div className="relative z-20 border border-green-500 bg-black bg-opacity-90 p-12 max-w-lg w-full mx-4 flex flex-col gap-6"
        style={{ boxShadow: "0 0 60px rgba(0,255,68,0.2), inset 0 0 60px rgba(0,255,68,0.03)" }}>
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400" />
        <div className="text-center">
          <p className="text-xs text-green-700 tracking-widest mb-3 animate-pulse">▶ NEXUS CORP — SYSTÈME COMPROMIS ◀</p>
          <h1 className="text-3xl tracking-widest text-green-400 mb-2" style={{ textShadow: "0 0 30px #00ff44, 0 0 60px #00ff44" }}>{glitchTitle}</h1>
          <div className="flex items-center gap-3 justify-center mt-3">
            <div className="flex-1 h-px bg-green-800" />
            <span className="text-xs text-green-700">H4CKR v2.0</span>
            <div className="flex-1 h-px bg-green-800" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: "SCORE FINAL", value: score.toLocaleString() + " pts", highlight: true },
            { label: "TEMPS TOTAL", value: time },
            { label: "NIVEAUX COMPLÉTÉS", value: "15 / 15" },
            { label: "STATUT", value: "ELITE HACKER" },
          ].map((stat) => (
            <div key={stat.label} className={`flex justify-between items-center border p-3 ${stat.highlight ? "border-green-500 bg-green-950 bg-opacity-20" : "border-green-900"}`}>
              <span className="text-xs text-green-700 tracking-widest">{stat.label}</span>
              <span className="text-sm tabular-nums" style={{ color: stat.highlight ? "#4ade80" : "#22c55e", textShadow: stat.highlight ? "0 0 10px #00ff44" : "none" }}>{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="border border-green-900 p-3 text-xs text-green-700 leading-relaxed text-center">
          {">"} Infiltration réussie. Toutes les données ont été exfiltrées.<br />
          {">"} NEXUS Corp ne saura jamais ce qui s'est passé.
        </div>
        <div className="flex gap-3">
          <button onClick={onLeaderboard} className="flex-1 border border-green-500 p-3 text-sm tracking-widest text-green-400 hover:bg-green-500 hover:text-black transition-all" style={{ boxShadow: "0 0 10px rgba(0,255,68,0.1)" }}>[ CLASSEMENT ]</button>
          <button onClick={onLogout} className="flex-1 border border-red-800 text-red-600 p-3 text-sm tracking-widest hover:bg-red-900 hover:bg-opacity-30 transition-all">[ DÉCONNEXION ]</button>
        </div>
      </div>
    </div>
  );
}

function Timer({ startTime, stopped }: { startTime: number; stopped: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stopped) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime, stopped]);
  const s = Math.floor(elapsed / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return <span className="text-xs text-green-700 tabular-nums">{pad(Math.floor(s / 60))}:{pad(s % 60)}</span>;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 60))}m ${pad(s % 60)}s`;
}

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
  const [avatarTrigger, setAvatarTrigger] = useState<AvatarTrigger>("idle");
  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { playClick, playAccessDenied, playAccessGranted, playKeypress } = useChiptune();

  useEffect(() => {
    if (!userId) return;
    Promise.all([api.get("/levels"), api.get(`/progress?user_id=${userId}`)]).then(([lr, pr]) => {
      const lvls: Level[] = lr.data;
      setLevels(lvls);
      const done = new Set<number>(pr.data.map((p: { level_id: number }) => p.level_id));
      setCompletedIds(done);
      setScore(pr.data.reduce((acc: number, p: { score: number }) => acc + p.score, 0));
      let last = 0;
      lvls.forEach((l, i) => { if (done.has(l.id)) last = i + 1; });
      setUnlockedLevelIndex(Math.min(last, lvls.length - 1));
      setCurrentLevel(lvls.find((l) => !done.has(l.id)) ?? lvls[0] ?? null);
      if (done.size === lvls.length && lvls.length > 0) { setGameWon(true); setAvatarTrigger("victory"); }
    });
  }, [userId]);

  const resetHints = () => { setHints([]); setHintPosition(0); setHintMalus(0); setNoMoreHints(false); };

  const handleHint = async () => {
    if (!currentLevel || !userId || noMoreHints) return;
    setAvatarTrigger("hint");
    try {
      const res = await api.post(`/levels/${currentLevel.id}/hint`, { user_id: userId, position: hintPosition + 1 });
      setHints((p) => [...p, res.data.content]);
      setHintPosition((p) => p + 1);
      setHintMalus((m) => m + res.data.malus);
    } catch { setNoMoreHints(true); }
  };

  const handleSubmit = async () => {
    if (!currentLevel || !userId || completedIds.has(currentLevel.id)) return;
    setLoading(true);
    playClick();
    try {
      const res = await api.post(`/levels/${currentLevel.id}/answer`, {
        user_id: userId, reponse: answer, indices_utilises: hintMalus, extra: {},
      });
      if (res.data.valide) {
        const newDone = new Set([...completedIds, currentLevel.id]);
        setScore((s) => s + res.data.score);
        setCompletedIds(newDone);
        const idx = levels.findIndex((l) => l.id === currentLevel.id);
        if (newDone.size === levels.length) {
          setEndTime(Date.now());
          setFeedback("🎉 ACCESS GRANTED — Mission accomplie !");
          setAvatarTrigger("victory");
          playAccessGranted();
          setTimeout(() => setGameWon(true), 2000);
        } else if (idx + 1 < levels.length) {
          setUnlockedLevelIndex((p) => Math.max(p, idx + 1));
          setFeedback("ACCESS GRANTED — Niveau suivant débloqué !");
          setAvatarTrigger("correct");
          playAccessGranted();
          setTimeout(() => { setCurrentLevel(levels[idx + 1]); setAnswer(""); setFeedback(""); resetHints(); setAvatarTrigger("idle"); }, 1500);
        }
      } else {
        setFeedback("ACCESS DENIED");
        setAvatarTrigger("wrong");
        playAccessDenied();
      }
    } catch { setFeedback("ERREUR RÉSEAU"); }
    finally { setLoading(false); }
  };

  const isCompleted = currentLevel ? completedIds.has(currentLevel.id) : false;
  const totalTime = formatTime(endTime ? endTime - startTime : Date.now() - startTime);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">
      {gameWon && <VictoryScreen score={score} time={totalTime} onLeaderboard={() => navigate("/leaderboard")} onLogout={() => { logout(); navigate("/"); }} />}

      <div className="flex justify-between items-center px-6 py-3 border-b border-green-900 bg-black bg-opacity-95" style={{ boxShadow: "0 1px 20px rgba(0,255,68,0.05)" }}>
        <div className="flex items-center gap-3">
          <span className="text-lg tracking-widest text-green-400" style={{ textShadow: "0 0 10px #00ff44" }}>H4CKR</span>
          <span className="text-xs text-green-800 border border-green-900 px-2 py-0.5">v2.0</span>
        </div>
        <div className="flex gap-5 text-xs items-center">
          <Timer startTime={startTime} stopped={gameWon} />
          <span><span className="text-green-700">SCORE </span><span className="tabular-nums">{score}</span></span>
          <button onClick={() => navigate("/leaderboard")} className="text-green-700 hover:text-green-400 transition">CLASSEMENT</button>
          <button onClick={() => navigate("/profile")} className="text-green-700 hover:text-green-400 transition">PROFIL</button>
          {role === "admin" && <button onClick={() => navigate("/admin")} className="text-yellow-700 hover:text-yellow-400 transition">ADMIN</button>}
          <button onClick={() => { logout(); navigate("/"); }} className="text-red-800 hover:text-red-500 transition">LOGOUT</button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5 max-w-3xl mx-auto w-full">
        <div>
          <div className="flex justify-between text-xs text-green-800 mb-1">
            <span>PROGRESSION GLOBALE</span>
            <span>{completedIds.size} / {levels.length}</span>
          </div>
          <div className="h-1 bg-green-950 w-full overflow-hidden">
            <div className="h-1 bg-green-500 transition-all duration-500"
              style={{ width: levels.length > 0 ? `${(completedIds.size / levels.length) * 100}%` : "0%", boxShadow: "0 0 6px #00ff44" }} />
          </div>
        </div>

        {currentLevel && (
          <div className="border p-5 flex flex-col gap-3 bg-black bg-opacity-60 transition-all"
            style={{ borderColor: isCompleted ? "#16a34a" : "#14532d", opacity: isCompleted ? 0.7 : 1 }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-800 border border-green-900 px-2 py-0.5">CH.{currentLevel.chapter} — LVL.{currentLevel.position}</span>
                <span className="text-xs text-green-700">[{currentLevel.type.toUpperCase()}]</span>
                <span className="text-xs text-green-800">{currentLevel.points} pts</span>
              </div>
              {isCompleted && <span className="text-xs text-green-500 border border-green-700 px-2 py-0.5">✓ COMPLÉTÉ</span>}
            </div>
            {currentLevel.title && <p className="text-lg text-green-300" style={{ textShadow: "0 0 8px rgba(0,255,68,0.3)" }}>{currentLevel.title}</p>}
            {currentLevel.description && <p className="text-sm text-green-600 leading-relaxed border-l-2 border-green-900 pl-3">{currentLevel.description}</p>}
            {currentLevel.artifact_url && (
              <a href={currentLevel.artifact_url} target="_blank" className="text-xs text-green-700 hover:text-green-400 underline transition w-fit">→ Télécharger l'artefact</a>
            )}
            {hints.length > 0 && (
              <div className="border border-yellow-900 bg-yellow-950 bg-opacity-10 p-3 flex flex-col gap-2 mt-1">
                <p className="text-xs text-yellow-700 tracking-widest">INDICES — malus : -{hintMalus} pts</p>
                {hints.map((h, i) => <p key={i} className="text-xs text-yellow-600">▶ {h}</p>)}
              </div>
            )}
            {!isCompleted && (
              <button onClick={handleHint} disabled={noMoreHints}
                className="text-xs text-yellow-800 border border-yellow-900 px-3 py-1 hover:border-yellow-700 hover:text-yellow-600 transition w-fit disabled:opacity-30 disabled:cursor-not-allowed">
                {noMoreHints ? "AUCUN INDICE" : `+ INDICE${hints.length > 0 ? ` (${hints.length + 1})` : ""}`}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {levels.map((l, index) => {
            const unlocked = index <= unlockedLevelIndex;
            const active = currentLevel?.id === l.id;
            const done = completedIds.has(l.id);
            return (
              <button key={l.id}
                onClick={() => {
                  if (!unlocked) return;
                  playClick();
                  setCurrentLevel(l); setFeedback(""); setAnswer(""); resetHints(); setAvatarTrigger("idle");
                }}
                disabled={!unlocked}
                style={{
                  border: active ? "1px solid #22c55e" : done ? "1px solid #166534" : unlocked ? "1px solid #14532d" : "1px solid #052e16",
                  background: active ? "#22c55e" : "transparent",
                  color: active ? "#000" : done ? "#4ade80" : unlocked ? "#166534" : "#052e16",
                  padding: "4px 10px", fontSize: "12px", cursor: unlocked ? "pointer" : "not-allowed", transition: "all 0.2s",
                }}>
                {done ? "✓" : !unlocked ? "🔒" : ""} {l.chapter}-{l.position}
              </button>
            );
          })}
        </div>

        <div className="text-sm px-1" style={{
          color: feedback.startsWith("ACCESS GRANTED") ? "#4ade80" : feedback === "ACCESS DENIED" ? "#ef4444" : feedback ? "#eab308" : "#14532d",
          textShadow: feedback.startsWith("ACCESS GRANTED") ? "0 0 10px #00ff44" : "none",
        }}>
          {">"} {isCompleted ? "CE NIVEAU EST DÉJÀ COMPLÉTÉ" : feedback || "EN ATTENTE DE RÉPONSE..."}
        </div>

        <div className="flex flex-col gap-2">
          <input
            className="bg-black p-3 text-sm text-green-400 outline-none transition"
            style={{ border: "1px solid #14532d", caretColor: "#00ff44" }}
            placeholder={isCompleted ? "Niveau déjà complété" : "Entrez le code d'accès..."}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (e.target.value) { setAvatarTrigger("typing"); playKeypress(); }
            }}
            onKeyDown={(e) => e.key === "Enter" && !isCompleted && handleSubmit()}
            disabled={isCompleted}
          />
          <button onClick={handleSubmit} disabled={loading || !currentLevel || isCompleted}
            className="p-3 text-sm tracking-widest transition"
            style={{ border: "1px solid #166534", color: "#22c55e", background: "transparent" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#22c55e"; (e.target as HTMLElement).style.color = "#000"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "#22c55e"; }}>
            {isCompleted ? "✓ COMPLÉTÉ" : loading ? "VÉRIFICATION..." : "[ SOUMETTRE ]"}
          </button>
        </div>
      </div>

      <AvatarCompanion trigger={avatarTrigger} />
    </div>
  );
}