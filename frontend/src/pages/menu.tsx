import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import MatrixRain from "../components/MatrixRain";
import api from "../api/client.js";

interface Settings {
  musicVolume: number;
  sfxVolume: boolean;
  showTimer: boolean;
  difficulty: "normal" | "hard";
}

const DEFAULT_SETTINGS: Settings = {
  musicVolume: 70,
  sfxVolume: true,
  showTimer: true,
  difficulty: "normal",
};

function loadSettings(): Settings {
  try {
    const s = localStorage.getItem("h4ckr_settings");
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function saveSettings(s: Settings) {
  localStorage.setItem("h4ckr_settings", JSON.stringify(s));
}

// ─── Écran paramètres ────────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<Settings>(loadSettings);

  const update = (key: keyof Settings, value: unknown) => {
    const next = { ...s, [key]: value };
    setS(next);
    saveSettings(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-mono bg-black bg-opacity-80">
      <div className="border border-green-700 bg-black w-full max-w-md p-8 flex flex-col gap-6"
        style={{ boxShadow: "0 0 40px rgba(0,255,68,0.1)" }}>

        {/* Coins décoratifs */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-500" style={{ position: "relative" }} />

        <div className="flex justify-between items-center border-b border-green-900 pb-4">
          <h2 className="text-green-400 tracking-widest text-sm">⚙ PARAMÈTRES</h2>
          <button onClick={onClose} className="text-green-800 hover:text-red-400 transition text-xs">✕ FERMER</button>
        </div>

        {/* Volume musique */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs">
            <span className="text-green-700 tracking-widest">VOLUME MUSIQUE</span>
            <span className="text-green-400">{s.musicVolume}%</span>
          </div>
          <input type="range" min={0} max={100} value={s.musicVolume}
            onChange={(e) => update("musicVolume", Number(e.target.value))}
            className="w-full accent-green-500 h-1" />
        </div>

        {/* Effets sonores */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-700 tracking-widest">EFFETS SONORES</span>
          <button onClick={() => update("sfxVolume", !s.sfxVolume)}
            className="text-xs px-4 py-1 border transition"
            style={{ borderColor: s.sfxVolume ? "#22c55e" : "#166534", color: s.sfxVolume ? "#22c55e" : "#166534" }}>
            {s.sfxVolume ? "ON" : "OFF"}
          </button>
        </div>

        {/* Timer */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-700 tracking-widest">AFFICHER LE TIMER</span>
          <button onClick={() => update("showTimer", !s.showTimer)}
            className="text-xs px-4 py-1 border transition"
            style={{ borderColor: s.showTimer ? "#22c55e" : "#166534", color: s.showTimer ? "#22c55e" : "#166534" }}>
            {s.showTimer ? "ON" : "OFF"}
          </button>
        </div>

        {/* Difficulté */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-700 tracking-widest">DIFFICULTÉ</span>
          <div className="flex gap-2">
            {(["normal", "hard"] as const).map((d) => (
              <button key={d} onClick={() => update("difficulty", d)}
                className="text-xs px-4 py-1 border transition"
                style={{
                  borderColor: s.difficulty === d ? "#22c55e" : "#166534",
                  color: s.difficulty === d ? "#22c55e" : "#166534",
                  background: s.difficulty === d ? "rgba(34,197,94,0.1)" : "transparent",
                }}>
                {d.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-green-900 text-center">Les paramètres sont sauvegardés automatiquement</p>
      </div>
    </div>
  );
}

// ─── Page Menu ───────────────────────────────────────────────
export default function Menu() {
  const [progress, setProgress] = useState<{ count: number; score: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [glitch, setGlitch] = useState("H4CKR");
  const [loaded, setLoaded] = useState(false);
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const chars = "!@#$%^&*<>[]|01/\\";

  // Glitch titre
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.15) {
        const arr = "H4CKR".split("");
        arr[Math.floor(Math.random() * arr.length)] = chars[Math.floor(Math.random() * chars.length)];
        setGlitch(arr.join(""));
        setTimeout(() => setGlitch("H4CKR"), 80);
      }
    }, 400);
    return () => clearInterval(iv);
  }, []);

  // Charge la progression
  useEffect(() => {
    if (!userId) return;
    api.get(`/progress?user_id=${userId}`).then((res) => {
      const count = res.data.length;
      const score = res.data.reduce((acc: number, p: { score: number }) => acc + p.score, 0);
      setProgress({ count, score });
    }).finally(() => setLoaded(true));
  }, [userId]);

  const handleReset = async () => {
    // Remet la progression à zéro via l'API (à implémenter côté backend si besoin)
    // Pour l'instant on navigue juste vers le jeu fresh
    setShowResetConfirm(false);
    navigate("/game");
  };

  const hasProgress = progress && progress.count > 0;

  return (
    <div className="min-h-screen bg-black font-mono flex flex-col items-center justify-center relative overflow-hidden">
      <MatrixRain />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Confirm reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="border border-red-800 bg-black p-8 max-w-sm w-full flex flex-col gap-4">
            <p className="text-red-400 text-sm tracking-widest text-center">RECOMMENCER LA PARTIE ?</p>
            <p className="text-red-800 text-xs text-center">Toute ta progression sera perdue.</p>
            <div className="flex gap-3 mt-2">
              <button onClick={handleReset}
                className="flex-1 border border-red-700 text-red-500 py-2 text-xs hover:bg-red-900 hover:bg-opacity-20 transition">
                CONFIRMER
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                className="flex-1 border border-green-900 text-green-700 py-2 text-xs hover:border-green-600 hover:text-green-400 transition">
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-6">

        {/* Logo */}
        <div className="text-center">
          <div className="text-xs text-green-800 tracking-widest mb-4 animate-pulse">
            ▶ NEXUS CORP — INTRUSION SYSTEM v2.0 ◀
          </div>
          <h1 className="text-7xl tracking-widest text-green-400 select-none"
            style={{ textShadow: "0 0 40px #00ff44, 0 0 80px rgba(0,255,68,0.3)", fontFamily: "monospace" }}>
            {glitch}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-px bg-green-900" />
            <span className="text-xs text-green-800">SERVER BLOCK</span>
            <div className="flex-1 h-px bg-green-900" />
          </div>
        </div>

        {/* Infos joueur */}
        {loaded && (
          <div className="w-full border border-green-900 p-4 flex flex-col gap-2"
            style={{ background: "rgba(0,10,0,0.6)" }}>
            <div className="flex justify-between text-xs">
              <span className="text-green-800">AGENT</span>
              <span className="text-green-400">{username?.toUpperCase()}</span>
            </div>
            {hasProgress && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">SALLES COMPROMISES</span>
                  <span className="text-green-400">{progress.count} / 15</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">SCORE</span>
                  <span className="text-green-400">{progress.score.toLocaleString()} pts</span>
                </div>
                {/* Barre progression */}
                <div className="mt-1">
                  <div className="h-0.5 bg-green-950">
                    <div className="h-0.5 bg-green-500 transition-all"
                      style={{ width: `${(progress.count / 15) * 100}%`, boxShadow: "0 0 4px #00ff44" }} />
                  </div>
                </div>
              </>
            )}
            {!hasProgress && (
              <p className="text-xs text-green-900 text-center">Aucune progression — première mission</p>
            )}
          </div>
        )}

        {/* Boutons */}
        <div className="w-full flex flex-col gap-3">

          {/* Commencer / Continuer */}
          <button
            onClick={() => navigate("/game")}
            className="w-full py-4 text-sm tracking-widest border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-all"
            style={{ boxShadow: "0 0 20px rgba(0,255,68,0.1)" }}>
            {hasProgress ? "[ CONTINUER LA MISSION ]" : "[ COMMENCER LA MISSION ]"}
          </button>

          {/* Recommencer */}
          {hasProgress && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 text-xs tracking-widest border border-red-900 text-red-700 hover:border-red-600 hover:text-red-400 transition-all">
              [ RECOMMENCER ]
            </button>
          )}

          {/* Paramètres */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full py-3 text-xs tracking-widest border border-green-900 text-green-800 hover:border-green-700 hover:text-green-600 transition-all">
            [ PARAMÈTRES ]
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => navigate("/leaderboard")}
            className="w-full py-3 text-xs tracking-widest border border-green-900 text-green-800 hover:border-green-700 hover:text-green-600 transition-all">
            [ CLASSEMENT ]
          </button>

          {/* Déconnexion */}
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full py-2 text-xs tracking-widest text-red-900 hover:text-red-600 transition-all">
            DÉCONNEXION
          </button>
        </div>

        <p className="text-xs text-green-900 text-center">
          v2.0 — {new Date().getFullYear()} NEXUS CORP
        </p>
      </div>
    </div>
  );
}