import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";

interface ProgressEntry {
  level_id: number;
  score: number;
  completed_at: string;
}

export default function Profile() {
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    api.get(`/progress?user_id=${userId}`).then((res) => setProgress(res.data));
  }, [userId]);

  const totalScore = progress.reduce((acc, p) => acc + p.score, 0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl tracking-widest">PROFILE</h1>
        <button onClick={() => navigate("/game")} className="text-sm hover:underline">← BACK</button>
      </div>

      <div className="border border-green-800 p-4 mb-6">
        <p className="text-lg">{username}</p>
        <p className="text-green-600 text-sm">TOTAL SCORE: {totalScore}</p>
        <p className="text-green-600 text-sm">LEVELS COMPLETED: {progress.length}</p>
      </div>

      <h2 className="text-sm text-green-600 mb-3 tracking-widest">COMPLETED LEVELS</h2>
      <div className="flex flex-col gap-2">
        {progress.map((p) => (
          <div key={p.level_id} className="border border-green-900 p-3 flex justify-between">
            <span>Level {p.level_id}</span>
            <span className="text-green-600">{p.score} pts</span>
          </div>
        ))}
        {progress.length === 0 && (
          <p className="text-green-800">Aucun niveau complété</p>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 border border-red-500 text-red-500 p-2 hover:bg-red-500 hover:text-black transition w-full"
      >
        LOGOUT
      </button>
    </div>
  );
}
