import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import MatrixRain from "../components/MatrixRain";
import AvatarCompanion from "../components/AvatarCompanion";
import { useChiptune } from "../hooks/useChiptune";

function TypeWriter({ text, speed = 60, className = "" }: { text: string; speed?: number; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span className={className}>{displayed}<span className="animate-pulse">█</span></span>;
}

function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const [glitched, setGlitched] = useState(text);
  const chars = "!@#$%^&*<>{}[]|/\\01";
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        const arr = text.split("");
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          arr[Math.floor(Math.random() * arr.length)] = chars[Math.floor(Math.random() * chars.length)];
        }
        setGlitched(arr.join(""));
        setTimeout(() => setGlitched(text), 80);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [text]);
  return <span className={className}>{glitched}</span>;
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const [avatarTrigger, setAvatarTrigger] = useState<"idle" | "typing" | "wrong" | "hint" | "correct" | "victory" | "login">("login");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { start, playClick, playSuccess, playError } = useChiptune();

  useEffect(() => {
    const timer = setTimeout(() => setBootDone(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const startMusic = async () => {
    if (!musicStarted) { await start(); setMusicStarted(true); }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    playClick();
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, { username, password });
      const payload = JSON.parse(atob(res.data.access_token.split(".")[1]));
      setAuth(res.data.access_token, res.data.user_id, username, payload.role ?? "player");
      setAvatarTrigger("correct");
      await playSuccess();
      setTimeout(() => navigate("/game"), 600);
    } catch (err: any) {
      playError();
      setAvatarTrigger("wrong");
      setError(err.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono overflow-hidden" onClick={startMusic}>
      <MatrixRain />
      <div className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)" }} />

      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="border border-green-500 bg-black bg-opacity-90 p-8 flex flex-col gap-5"
          style={{ boxShadow: "0 0 40px rgba(0,255,68,0.15), inset 0 0 40px rgba(0,255,68,0.03)" }}>

          <div className="text-center mb-2">
            <div className="text-4xl tracking-widest mb-1" style={{ textShadow: "0 0 20px #00ff44, 0 0 40px #00ff44" }}>
              <GlitchText text="H4CKR" className="text-green-400" />
            </div>
            <div className="text-xs text-green-700 tracking-widest">
              {bootDone
                ? <TypeWriter text="NEXUS CORP INTRUSION SYSTEM v2.0" speed={40} />
                : <TypeWriter text="INITIALISATION..." speed={80} />}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-green-900" />
            <span className="text-xs text-green-700">{"[ AUTHENTIFICATION ]"}</span>
            <div className="flex-1 h-px bg-green-900" />
          </div>

          <div className="flex gap-2">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); playClick(); }}
                className={`flex-1 py-2 text-xs tracking-widest border transition-all duration-200 ${
                  mode === m ? "bg-green-500 text-black border-green-500" : "border-green-800 text-green-700 hover:border-green-500 hover:text-green-400"
                }`}>
                {m === "login" ? "CONNEXION" : "INSCRIPTION"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 tracking-widest">{">"} IDENTIFIANT</label>
              <input
                className="bg-black border border-green-800 focus:border-green-500 p-2 text-green-400 text-sm outline-none transition-colors"
                style={{ caretColor: "#00ff44" }}
                placeholder="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setAvatarTrigger("typing"); }}
                onFocus={startMusic}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 tracking-widest">{">"} MOT DE PASSE</label>
              <input
                className="bg-black border border-green-800 focus:border-green-500 p-2 text-green-400 text-sm outline-none transition-colors"
                style={{ caretColor: "#00ff44" }}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAvatarTrigger("typing"); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                onFocus={startMusic}
              />
            </div>
          </div>

          {error && (
            <div className="border border-red-800 bg-red-950 bg-opacity-30 p-2 text-xs text-red-400">
              {">"} ERREUR: {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="border border-green-500 py-3 text-sm tracking-widest text-green-400 hover:bg-green-500 hover:text-black transition-all duration-200 disabled:opacity-50"
            style={{ boxShadow: "0 0 10px rgba(0,255,68,0.1)" }}>
            {loading
              ? <TypeWriter text="CONNEXION EN COURS..." speed={40} />
              : mode === "login" ? "[ ACCÉDER ]" : "[ CRÉER UN COMPTE ]"}
          </button>

          {!musicStarted && (
            <div className="text-center text-xs text-green-900 animate-pulse">— CLIQUER POUR ACTIVER L'AUDIO —</div>
          )}
        </div>

        <div className="absolute top-0 left-4 w-3 h-3 border-t-2 border-l-2 border-green-500" />
        <div className="absolute top-0 right-4 w-3 h-3 border-t-2 border-r-2 border-green-500" />
        <div className="absolute bottom-0 left-4 w-3 h-3 border-b-2 border-l-2 border-green-500" />
        <div className="absolute bottom-0 right-4 w-3 h-3 border-b-2 border-r-2 border-green-500" />
      </div>

      <AvatarCompanion trigger={avatarTrigger} />
    </div>
  );
}