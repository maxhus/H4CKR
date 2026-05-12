import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import PhaserGame from "../game/phasergame";

export default function Game() {
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [notification, setNotification] = useState("");
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    api.get(`/progress?user_id=${userId}`).then((res) => {
      const ids = res.data.map((p: { level_id: number }) => p.level_id);
      const total = res.data.reduce((acc: number, p: { score: number }) => acc + p.score, 0);
      setCompletedLevels(ids);
      setScore(total);
    });
  }, [userId]);

  const handleLevelComplete = (levelId: number, pts: number) => {
    setCompletedLevels((prev) => [...new Set([...prev, levelId])]);
    setScore((s) => s + pts);
    setNotification(`+${pts} pts — TERMINAL COMPROMIS`);
    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">
      <div className="flex justify-between items-center px-6 py-2 border-b border-green-900 bg-black">
        <div className="flex items-center gap-4">
          <span className="text-lg tracking-widest text-green-500">H4CKR</span>
          <span className="text-xs text-green-700">v2.0</span>
        </div>
        <div className="flex gap-6 text-sm items-center">
          {notification && (
            <span className="text-yellow-400 text-xs animate-pulse">{notification}</span>
          )}
          <span className="text-xs"><span className="text-green-700">AGENT </span>{username}</span>
          <span className="text-xs"><span className="text-green-700">SCORE </span>{score}</span>
          <span className="text-xs"><span className="text-green-700">TERMINAUX </span>{completedLevels.length}/15</span>
        </div>
        <div className="flex gap-4 text-xs">
          <button onClick={() => navigate("/leaderboard")} className="hover:text-green-300 transition">CLASSEMENT</button>
          <button onClick={() => navigate("/profile")} className="hover:text-green-300 transition">PROFIL</button>
          {role === "admin" && (
            <button onClick={() => navigate("/admin")} className="text-yellow-600 hover:text-yellow-400 transition">ADMIN</button>
          )}
          <button onClick={() => { logout(); navigate("/"); }} className="text-red-600 hover:text-red-400 transition">DÉCONNEXION</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <PhaserGame completedLevels={completedLevels} onLevelComplete={handleLevelComplete} />
          <div className="w-full max-w-[800px]">
            <div className="flex justify-between text-xs text-green-700 mb-1">
              <span>PROGRESSION ZONE_01</span>
              <span>{completedLevels.filter(id => id <= 4).length}/4 terminaux</span>
            </div>
            <div className="h-1 bg-green-950 w-full">
              <div className="h-1 bg-green-500 transition-all duration-500"
                style={{ width: `${(completedLevels.filter(id => id <= 4).length / 4) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}