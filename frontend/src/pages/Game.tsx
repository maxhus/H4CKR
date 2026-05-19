import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import AvatarCompanion from "../components/AvatarCompanion";
import MatrixRain from "../components/MatrixRain";
import { useChiptune } from "../hooks/useChiptune";
import PhaserGame from "../game/phasergame";

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
  return <span className="tabular-nums">{pad(Math.floor(s / 60))}:{pad(s % 60)}</span>;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 60))}m ${pad(s % 60)}s`;
}

// ─── Menu Pause ──────────────────────────────────────────────
function PauseMenu({ score, completedCount, onResume, onLeaderboard, onProfile, onLogout, onSettings }: {
  score: number;
  completedCount: number;
  onResume: () => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  onLogout: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-mono"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
      <div className="border border-green-700 bg-black w-full max-w-sm p-8 flex flex-col gap-4"
        style={{ boxShadow: "0 0 40px rgba(0,255,68,0.1)" }}>

        {/* Titre */}
        <div className="text-center border-b border-green-900 pb-4">
          <p className="text-xs text-green-800 tracking-widest mb-1 animate-pulse">▶ PAUSE ◀</p>
          <h2 className="text-xl tracking-widest text-green-400">H4CKR</h2>
        </div>

        {/* Stats rapides */}
        <div className="flex justify-between text-xs border border-green-900 p-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-green-800">SCORE</span>
            <span className="text-green-400">{score}</span>
          </div>
          <div className="w-px bg-green-900" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-green-800">SALLES</span>
            <span className="text-green-400">{completedCount}/15</span>
          </div>
          <div className="w-px bg-green-900" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-green-800">PROGRESSION</span>
            <span className="text-green-400">{Math.round((completedCount / 15) * 100)}%</span>
          </div>
        </div>

        {/* Boutons */}
        <button onClick={onResume}
          className="w-full py-3 text-sm tracking-widest border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition">
          [ REPRENDRE ]
        </button>

        <button onClick={onLeaderboard}
          className="w-full py-2 text-xs tracking-widest border border-green-900 text-green-700 hover:border-green-600 hover:text-green-400 transition">
          [ CLASSEMENT ]
        </button>

        <button onClick={onProfile}
          className="w-full py-2 text-xs tracking-widest border border-green-900 text-green-700 hover:border-green-600 hover:text-green-400 transition">
          [ PROFIL ]
        </button>

        <button onClick={onSettings}
          className="w-full py-2 text-xs tracking-widest border border-green-900 text-green-700 hover:border-green-600 hover:text-green-400 transition">
          [ PARAMÈTRES ]
        </button>

        <button onClick={onLogout}
          className="w-full py-2 text-xs tracking-widest text-red-900 hover:text-red-500 transition border border-transparent hover:border-red-900">
          DÉCONNEXION
        </button>

        <p className="text-xs text-green-900 text-center">[ESC] pour reprendre</p>
      </div>
    </div>
  );
}

// ─── Paramètres ──────────────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [musicVolume, setMusicVolume] = useState(() => {
    try { return Number(JSON.parse(localStorage.getItem("h4ckr_settings") || "{}").musicVolume ?? 70); } catch { return 70; }
  });
  const [sfx, setSfx] = useState(() => {
    try { return JSON.parse(localStorage.getItem("h4ckr_settings") || "{}").sfxVolume ?? true; } catch { return true; }
  });

  const save = (vol: number, s: boolean) => {
    const prev = JSON.parse(localStorage.getItem("h4ckr_settings") || "{}");
    localStorage.setItem("h4ckr_settings", JSON.stringify({ ...prev, musicVolume: vol, sfxVolume: s }));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center font-mono"
      style={{ background: "rgba(0,0,0,0.9)" }}>
      <div className="border border-green-700 bg-black w-full max-w-sm p-8 flex flex-col gap-5"
        style={{ boxShadow: "0 0 40px rgba(0,255,68,0.1)" }}>
        <div className="flex justify-between items-center border-b border-green-900 pb-3">
          <h2 className="text-green-400 tracking-widest text-sm">⚙ PARAMÈTRES</h2>
          <button onClick={onClose} className="text-green-800 hover:text-red-400 text-xs transition">✕</button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs">
            <span className="text-green-700 tracking-widest">VOLUME MUSIQUE</span>
            <span className="text-green-400">{musicVolume}%</span>
          </div>
          <input type="range" min={0} max={100} value={musicVolume}
            onChange={(e) => { setMusicVolume(Number(e.target.value)); save(Number(e.target.value), sfx); }}
            className="w-full accent-green-500 h-1" />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-green-700 tracking-widest">EFFETS SONORES</span>
          <button onClick={() => { setSfx(!sfx); save(musicVolume, !sfx); }}
            className="text-xs px-4 py-1 border transition"
            style={{ borderColor: sfx ? "#22c55e" : "#166534", color: sfx ? "#22c55e" : "#166534" }}>
            {sfx ? "ON" : "OFF"}
          </button>
        </div>

        <button onClick={onClose}
          className="w-full py-2 text-xs tracking-widest border border-green-700 text-green-500 hover:bg-green-900 hover:bg-opacity-20 transition mt-2">
          [ FERMER ]
        </button>
      </div>
    </div>
  );
}

// ─── Victory Screen ──────────────────────────────────────────
function VictoryScreen({ score, time, onLeaderboard, onMenu }: {
  score: number; time: string; onLeaderboard: () => void; onMenu: () => void;
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
        <div className="flex gap-3">
          <button onClick={onLeaderboard} className="flex-1 border border-green-500 p-3 text-sm text-green-400 hover:bg-green-500 hover:text-black transition">[ CLASSEMENT ]</button>
          <button onClick={onMenu} className="flex-1 border border-green-800 text-green-700 p-3 text-sm hover:border-green-600 hover:text-green-400 transition">[ MENU ]</button>
        </div>
      </div>
    </div>
  );
}

// ─── Game principal ───────────────────────────────────────────
export default function Game() {
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  const [avatarTrigger, setAvatarTrigger] = useState<AvatarTrigger>("idle");
  const [notification, setNotification] = useState("");
  const userId = useAuthStore((s) => s.userId);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { playAccessGranted } = useChiptune();

  // Touche Échap — ouvre/ferme le menu pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaused((p) => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!userId) return;
    api.get(`/progress?user_id=${userId}`).then((res) => {
      const ids: number[] = res.data.map((p: { level_id: number }) => p.level_id);
      const total: number = res.data.reduce((acc: number, p: { score: number }) => acc + p.score, 0);
      setCompletedLevels(ids);
      setScore(total);
      if (ids.length === 15) { setGameWon(true); setAvatarTrigger("victory"); }
    }).finally(() => setLoaded(true));
  }, [userId]);

  const handleLevelComplete = useCallback((levelId: number, pts: number) => {
    setCompletedLevels((prev) => {
      const next = [...new Set([...prev, levelId])];
      if (next.length === 15) {
        setEndTime(Date.now());
        setGameWon(true);
        setAvatarTrigger("victory");
      }
      return next;
    });
    setScore((s) => s + pts);
    setAvatarTrigger("correct");
    playAccessGranted();
    setNotification(`+${pts} pts — TERMINAL COMPROMIS`);
    setTimeout(() => setNotification(""), 3000);
  }, [playAccessGranted]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">

      {gameWon && (
        <VictoryScreen
          score={score}
          time={formatTime(endTime ? endTime - startTime : Date.now() - startTime)}
          onLeaderboard={() => navigate("/leaderboard")}
          onMenu={() => navigate("/menu")}
        />
      )}

      {paused && !gameWon && (
        <PauseMenu
          score={score}
          completedCount={completedLevels.length}
          onResume={() => setPaused(false)}
          onLeaderboard={() => navigate("/leaderboard")}
          onProfile={() => navigate("/profile")}
          onSettings={() => setShowSettings(true)}
          onLogout={() => { logout(); navigate("/"); }}
        />
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* HUD minimal — juste score + timer + hint ESC */}
      <div className="flex justify-between items-center px-4 py-1.5 border-b border-green-950 bg-black"
        style={{ boxShadow: "0 1px 10px rgba(0,255,68,0.03)" }}>
        <div className="flex items-center gap-4 text-xs text-green-800">
          <span className="text-green-700 tracking-widest">H4CKR</span>
          <span><span className="text-green-900">SCORE </span>{score}</span>
          <span><span className="text-green-900">SALLES </span>{completedLevels.length}/15</span>
          {notification && <span className="text-yellow-600 animate-pulse">{notification}</span>}
        </div>
        <div className="flex items-center gap-4 text-xs text-green-900">
          <Timer startTime={startTime} stopped={gameWon} />
          <button onClick={() => setPaused(true)}
            className="border border-green-950 px-2 py-0.5 hover:border-green-800 hover:text-green-700 transition">
            [ESC] PAUSE
          </button>
        </div>
      </div>

      {/* Barre progression */}
      <div className="h-0.5 bg-green-950">
        <div className="h-0.5 bg-green-700 transition-all duration-500"
          style={{ width: `${(completedLevels.length / 15) * 100}%`, boxShadow: "0 0 3px #00ff44" }} />
      </div>

      {/* Zone Phaser */}
      <div className="flex-1 flex items-center justify-center bg-black">
        {!loaded ? (
          <div className="text-green-900 text-xs font-mono animate-pulse tracking-widest">
            {">"} CHARGEMENT...
          </div>
        ) : (
          <PhaserGame
            completedLevels={completedLevels}
            onLevelComplete={handleLevelComplete}
          />
        )}
      </div>

      <AvatarCompanion trigger={avatarTrigger} />
    </div>
  );
}