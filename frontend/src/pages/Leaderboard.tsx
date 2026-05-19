import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import MatrixRain from "../components/MatrixRain";

interface Entry {
  user_id: number;
  username: string;
  score: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/leaderboard").then((res: any) => {
      setEntries(res.data);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      <MatrixRain />

      {/* Scanlines */}
      <div className="fixed inset-0 z-10 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)" }} />

      <div className="relative z-20 max-w-2xl mx-auto p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-xs text-green-700 tracking-widest mb-1">NEXUS CORP — CLASSEMENT GLOBAL</p>
            <h1 className="text-3xl tracking-widest" style={{ textShadow: "0 0 20px #00ff44" }}>
              LEADERBOARD
            </h1>
          </div>
          <button onClick={() => navigate("/game")}
            className="text-xs border border-green-800 px-4 py-2 hover:border-green-500 hover:text-green-300 transition">
            ← RETOUR
          </button>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-green-900" />
          <span className="text-xs text-green-700">{"[ TOP HACKERS ]"}</span>
          <div className="flex-1 h-px bg-green-900" />
        </div>

        {/* Tableau */}
        <div className="border border-green-900 bg-black bg-opacity-80"
          style={{ boxShadow: "0 0 30px rgba(0,255,68,0.05)" }}>

          {/* En-tête */}
          <div className="grid grid-cols-12 text-xs text-green-700 tracking-widest border-b border-green-900 px-4 py-3">
            <div className="col-span-1">RK</div>
            <div className="col-span-7">AGENT</div>
            <div className="col-span-4 text-right">SCORE</div>
          </div>

          {/* Lignes */}
          {loaded && entries.map((e, i) => (
            <div
              key={e.user_id}
              className={`grid grid-cols-12 items-center px-4 py-3 border-b border-green-950 transition-all duration-200 hover:bg-green-950 hover:bg-opacity-30 ${i < 3 ? "hover:bg-opacity-50" : ""}`}
              style={i === 0 ? { boxShadow: "inset 3px 0 0 #00ff44" } : i === 1 ? { boxShadow: "inset 3px 0 0 #aaaaaa" } : i === 2 ? { boxShadow: "inset 3px 0 0 #cd7f32" } : {}}
            >
              <div className="col-span-1 text-sm">
                {i < 3 ? MEDALS[i] : <span className="text-green-800">#{i + 1}</span>}
              </div>
              <div className="col-span-7">
                <span className={`text-sm ${i === 0 ? "text-green-400" : i < 3 ? "text-green-500" : "text-green-600"}`}>
                  {i === 0 ? "▶ " : ""}{e.username}
                </span>
                {i === 0 && (
                  <span className="ml-2 text-xs text-green-700 animate-pulse">— ELITE HACKER</span>
                )}
              </div>
              <div className="col-span-4 text-right">
                <span className={`text-sm tabular-nums ${i === 0 ? "text-green-400" : "text-green-600"}`}>
                  {e.score.toLocaleString()}
                </span>
                <span className="text-xs text-green-800 ml-1">pts</span>
              </div>
            </div>
          ))}

          {loaded && entries.length === 0 && (
            <div className="px-4 py-12 text-center text-green-800 text-sm">
              AUCUN SCORE ENREGISTRÉ
            </div>
          )}

          {!loaded && (
            <div className="px-4 py-12 text-center text-green-700 text-sm animate-pulse">
              CHARGEMENT DES DONNÉES...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-green-900">
          {entries.length > 0 && `${entries.length} AGENT${entries.length > 1 ? "S" : ""} ENREGISTRÉ${entries.length > 1 ? "S" : ""}`}
        </div>
      </div>
    </div>
  );
}