import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import MatrixRain from "../components/MatrixRain";

interface ProgressEntry {
  level_id: number;
  score: number;
  completed_at: string;
}

export default function Profile() {
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    api.get(`/progress?user_id=${userId}`).then((res) => {
      setProgress(res.data);
      setLoaded(true);
    });
  }, [userId]);

  const totalScore = progress.reduce((acc, p) => acc + p.score, 0);
  const totalLevels = 15;
  const completionRate = Math.round((progress.length / totalLevels) * 100);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      <MatrixRain />

      <div className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)" }} />

      <div className="relative z-20 max-w-2xl mx-auto p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-xs text-green-700 tracking-widest mb-1">NEXUS CORP — DOSSIER AGENT</p>
            <h1 className="text-3xl tracking-widest" style={{ textShadow: "0 0 20px #00ff44" }}>PROFILE</h1>
          </div>
          <button onClick={() => navigate("/game")}
            className="text-xs border border-green-800 px-4 py-2 hover:border-green-500 hover:text-green-300 transition">
            ← RETOUR
          </button>
        </div>

        {/* Carte agent */}
        <div className="border border-green-500 bg-black bg-opacity-80 p-6 mb-6"
          style={{ boxShadow: "0 0 30px rgba(0,255,68,0.1)" }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-green-700 tracking-widest mb-1">IDENTIFIANT</p>
              <p className="text-2xl text-green-400 mb-3" style={{ textShadow: "0 0 10px #00ff44" }}>
                {username}
              </p>
              {role === "admin" && (
                <span className="text-xs border border-yellow-600 text-yellow-500 px-2 py-0.5">ADMIN</span>
              )}
            </div>
            {/* Avatar ASCII */}
            <div className="border border-green-800 p-3 text-green-700 text-xs leading-tight text-center">
              <div>╔══╗</div>
              <div>║▓▓║</div>
              <div>╚══╝</div>
              <div className="text-green-900 mt-1">ID:{userId}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 border-t border-green-900 pt-4">
            <div className="text-center">
              <p className="text-2xl text-green-400 tabular-nums">{totalScore}</p>
              <p className="text-xs text-green-700 mt-1">SCORE TOTAL</p>
            </div>
            <div className="text-center border-x border-green-900">
              <p className="text-2xl text-green-400">{progress.length}/{totalLevels}</p>
              <p className="text-xs text-green-700 mt-1">NIVEAUX</p>
            </div>
            <div className="text-center">
              <p className="text-2xl text-green-400">{completionRate}%</p>
              <p className="text-xs text-green-700 mt-1">COMPLÉTION</p>
            </div>
          </div>

          {/* Barre progression */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-green-800 mb-1">
              <span>PROGRESSION GLOBALE</span>
              <span>{progress.length}/{totalLevels}</span>
            </div>
            <div className="h-2 bg-green-950 w-full relative overflow-hidden">
              <div
                className="h-2 bg-green-500 transition-all duration-1000"
                style={{ width: `${completionRate}%`, boxShadow: "0 0 8px #00ff44" }}
              />
              {/* Effet scan */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Liste niveaux complétés */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-green-900" />
          <span className="text-xs text-green-700">{"[ NIVEAUX COMPLÉTÉS ]"}</span>
          <div className="flex-1 h-px bg-green-900" />
        </div>

        <div className="flex flex-col gap-2">
          {loaded && progress.map((p, i) => (
            <div key={p.level_id}
              className="border border-green-900 bg-black bg-opacity-60 p-3 flex justify-between items-center hover:border-green-700 transition">
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-700">#{i + 1}</span>
                <span className="text-sm text-green-500">✓ NIVEAU {p.level_id}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-green-700">{formatDate(p.completed_at)}</span>
                <span className="text-sm text-green-400 tabular-nums">{p.score} pts</span>
              </div>
            </div>
          ))}

          {loaded && progress.length === 0 && (
            <div className="border border-green-950 p-8 text-center text-green-800 text-sm">
              AUCUN NIVEAU COMPLÉTÉ
            </div>
          )}

          {!loaded && (
            <div className="border border-green-950 p-8 text-center text-green-700 text-sm animate-pulse">
              CHARGEMENT...
            </div>
          )}
        </div>

        {/* Bouton logout */}
        <button onClick={() => { logout(); navigate("/"); }}
          className="mt-8 w-full border border-red-800 text-red-600 p-3 text-sm tracking-widest hover:bg-red-900 hover:bg-opacity-30 hover:border-red-600 transition">
          [ DÉCONNEXION ]
        </button>
      </div>
    </div>
  );
}