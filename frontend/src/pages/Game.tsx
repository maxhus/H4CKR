import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import AvatarCompanion from "../components/AvatarCompanion";
import MatrixRain from "../components/MatrixRain";
import { useChiptune } from "../hooks/useChiptune";
import PhaserGame from "../game/phasergame.jsx";

type AvatarTrigger = "idle" | "typing" | "wrong" | "hint" | "correct" | "victory" | "login";

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

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 60))}m ${pad(s % 60)}s`;
}

function VictoryScreen({ score, time, onLeaderboard, onLogout }: {
  score: number; time: string; onLeaderboard: () => void; onLogout: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("MISSION ACCOMPLIE");
  const chars = "!@#$%^&*<>[]|01";
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const iv = setInterval(() => {
      if (Math.random() < 0.2) {
        const arr = "MISSION ACCOMPLIE".split("");
        for (let i = 0; i < 2; i++) arr[Math.floor(Math.random() * arr.length)] = chars[Math.floor(Math.random() * chars.length)];
        setTitle(arr.join(""));
        setTimeout(() => setTitle("MISSION ACCOMPLIE"), 100);
      }
    }, 300);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-mono"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.7s" }}>
      <MatrixRain />
      <div className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)" }} />
      <div className="relative z-20 border border-green-500 bg-black bg-opacity-95 p-10 max-w-lg w-full mx-4 flex flex-col gap-5"
        style={{ boxShadow: "0 0 60px rgba(0,255,68,0.2)" }}>
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400" />
        <div className="text-center">
          <p className="text-xs text-green-700 tracking-widest mb-2 animate-pulse">▶ NEXUS CORP — SYSTÈME COMPROMIS ◀</p>
          <h1 className="text-3xl tracking-widest text-green-400" style={{ textShadow: "0 0 30px #00ff44" }}>{title}</h1>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: "SCORE FINAL", value: score.toLocaleString() + " pts", hi: true },
            { label: "TEMPS TOTAL", value: time, hi: false },
            { label: "SALLES INFILTRÉES", value: "15 / 15", hi: false },
            { label: "STATUT", value: "ELITE HACKER", hi: false },
          ].map((s) => (
            <div key={s.label} className={`flex justify-between border p-3 ${s.hi ? "border-green-500" : "border-green-900"}`}>
              <span className="text-xs text-green-700">{s.label}</span>
              <span className="text-sm" style={{ color: s.hi ? "#4ade80" : "#22c55e", textShadow: s.hi ? "0 0 10px #00ff44" : "none" }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div className="border border-green-900 p-3 text-xs text-green-700 leading-relaxed text-center">
          {">"} Infiltration réussie. Toutes les données ont été exfiltrées.<br />
          {">"} NEXUS Corp ne saura jamais ce qui s'est passé.
        </div>
        <div className="flex gap-3">
          <button onClick={onLeaderboard} className="flex-1 border border-green-500 p-3 text-sm text-green-400 hover:bg-green-500 hover:text-black transition">[ CLASSEMENT ]</button>
          <button onClick={onLogout} className="flex-1 border border-red-800 text-red-600 p-3 text-sm hover:bg-red-900 hover:bg-opacity-30 transition">[ DÉCONNEXION ]</button>
        </div>
      </div>
    </div>
  );
}

export default function Game() {
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  const [avatarTrigger, setAvatarTrigger] = useState<AvatarTrigger>("idle");
  const [notification, setNotification] = useState("");
  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { playAccessGranted } = useChiptune();

  useEffect(() => {
    if (!userId) return;
    api.get(`/progress?user_id=${userId}`).then((res) => {
      const ids = res.data.map((p: { level_id: number }) => p.level_id);
      const total = res.data.reduce((acc: number, p: { score: number }) => acc + p.score, 0);
      setCompletedLevels(ids);
      setScore(total);
      if (ids.length === 15) { setGameWon(true); setAvatarTrigger("victory"); }
    });
  }, [userId]);

  const handleLevelComplete = (levelId: number, pts: number) => {
    const newCompleted = [...new Set([...completedLevels, levelId])];
    setCompletedLevels(newCompleted);
    setScore((s) => s + pts);
    setAvatarTrigger("correct");
    playAccessGranted();
    setNotification(`+${pts} pts — TERMINAL COMPROMIS`);
    setTimeout(() => setNotification(""), 3000);
    if (newCompleted.length === 15) {
      setEndTime(Date.now());
      setGameWon(true);
      setAvatarTrigger("victory");
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">

      {gameWon && (
        <VictoryScreen
          score={score}
          time={formatTime(endTime ? endTime - startTime : Date.now() - startTime)}
          onLeaderboard={() => navigate("/leaderboard")}
          onLogout={() => { logout(); navigate("/"); }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-2 border-b border-green-900"
        style={{ boxShadow: "0 1px 15px rgba(0,255,68,0.05)" }}>
        <div className="flex items-center gap-3">
          <span className="text-lg tracking-widest" style={{ textShadow: "0 0 10px #00ff44" }}>H4CKR</span>
          <span className="text-xs text-green-900 border border-green-900 px-2 py-0.5">v2.0</span>
        </div>
        <div className="flex gap-5 text-xs items-center">
          {notification && <span className="text-yellow-400 animate-pulse">{notification}</span>}
          <Timer startTime={startTime} stopped={gameWon} />
          <span><span className="text-green-800">SCORE </span>{score}</span>
          <span><span className="text-green-800">SALLES </span>{completedLevels.length}/15</span>
          <button onClick={() => navigate("/leaderboard")} className="text-green-800 hover:text-green-400 transition">CLASSEMENT</button>
          <button onClick={() => navigate("/profile")} className="text-green-800 hover:text-green-400 transition">PROFIL</button>
          {role === "admin" && <button onClick={() => navigate("/admin")} className="text-yellow-800 hover:text-yellow-400 transition">ADMIN</button>}
          <button onClick={() => { logout(); navigate("/"); }} className="text-red-900 hover:text-red-500 transition">LOGOUT</button>
        </div>
      </div>

      {/* Barre progression */}
      <div className="h-0.5 bg-green-950">
        <div className="h-0.5 bg-green-600 transition-all duration-500"
          style={{ width: `${(completedLevels.length / 15) * 100}%`, boxShadow: "0 0 4px #00ff44" }} />
      </div>

      {/* Zone Phaser */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        <PhaserGame
          completedLevels={completedLevels}
          onLevelComplete={handleLevelComplete}
        />
      </div>

      <AvatarCompanion trigger={avatarTrigger} />
    </div>
  );
}