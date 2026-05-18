import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";

interface Entry {
  user_id: number;
  username: string;
  score: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/leaderboard").then((res: any) => setEntries(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl tracking-widest">LEADERBOARD</h1>
        <button onClick={() => navigate("/game")} className="text-sm hover:underline">← BACK</button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-green-600 text-sm border-b border-green-800">
            <th className="text-left py-2">RANK</th>
            <th className="text-left py-2">USER</th>
            <th className="text-right py-2">SCORE</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.user_id} className="border-b border-green-900 hover:bg-green-950 transition">
              <td className="py-2 text-green-600">#{i + 1}</td>
              <td className="py-2">{e.username}</td>
              <td className="py-2 text-right">{e.score}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={3} className="py-4 text-center text-green-800">Aucun score enregistré</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}