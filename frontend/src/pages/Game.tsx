import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
import ArtifactViewer from "../components/ArtifactViewer";

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

export default function Game() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [unlockedLevelIndex, setUnlockedLevelIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const userId = useAuthStore((s) => s.userId);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/levels").then((res) => {
      setLevels(res.data);
      if (res.data.length > 0) {
        setCurrentLevel(res.data[0]);
        setUnlockedLevelIndex(0);
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!currentLevel || !userId) return;
    setLoading(true);
    try {
      const res = await api.post(`/levels/${currentLevel.id}/answer`, {
        user_id: userId,
        reponse: answer,
        indices_utilises: 0,
        extra: {},
      });

      if (res.data.valide) {
        setFeedback("ACCESS GRANTED");
        setScore((s) => s + res.data.score);

        const currentIndex = levels.findIndex((l) => l.id === currentLevel.id);
        const nextIndex = currentIndex + 1;

        if (nextIndex < levels.length) {
          setUnlockedLevelIndex((prev) => Math.max(prev, nextIndex));
          setCurrentLevel(levels[nextIndex]);
          setAnswer("");
          setFeedback("ACCESS GRANTED - Niveau suivant débloqué");
        } else {
          setFeedback("ACCESS GRANTED - Vous avez terminé tous les niveaux !");
        }
      } else {
        setFeedback("ACCESS DENIED");
      }
    } catch {
      setFeedback("ERREUR RÉSEAU");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl tracking-widest">H4CKR</h1>
        <div className="flex gap-4 text-sm">
          <span>SCORE: {score}</span>
          <button onClick={() => navigate("/leaderboard")} className="hover:underline">LEADERBOARD</button>
          <button onClick={() => navigate("/profile")} className="hover:underline">PROFILE</button>
          <button onClick={handleLogout} className="text-red-500 hover:underline">LOGOUT</button>
        </div>
      </div>

      {currentLevel && (
        <div className="border border-green-800 p-4">
          <p className="text-xs text-green-600 mb-1">CHAPTER {currentLevel.chapter} — LEVEL {currentLevel.position} — {currentLevel.type.toUpperCase()}</p>
          <p className="text-sm mb-1">Points: {currentLevel.points}</p>
          {currentLevel.title && (
          <p className="text-lg mt-2">{currentLevel.title}</p>
          )}
          {currentLevel.description && (
          <p className="text-sm text-green-300 mt-2 leading-relaxed">{currentLevel.description}</p>
)}
          {currentLevel.artifact_url && (
            <ArtifactViewer type="file" url={currentLevel.artifact_url} />
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {levels.map((l, index) => {
          const isUnlocked = index <= unlockedLevelIndex;
          return (
            <button
              key={l.id}
              onClick={() => {
                if (!isUnlocked) return;
                setCurrentLevel(l);
                setFeedback("");
                setAnswer("");
              }}
              disabled={!isUnlocked}
              className={`border px-3 py-1 text-sm transition ${currentLevel?.id === l.id ? "bg-green-500 text-black border-green-500" : isUnlocked ? "border-green-800 hover:border-green-500" : "border-green-900 text-green-700 cursor-not-allowed"}`}
            >
              {l.chapter}-{l.position}
            </button>
          );
        })}
      </div>

      <div className={`p-4 text-lg ${feedback === "ACCESS GRANTED" ? "text-green-400" : feedback ? "text-red-500" : "text-green-800"}`}>
        {feedback || "AWAITING INPUT..."}
      </div>

      <input
        className="bg-black border border-green-500 p-2 outline-none"
        placeholder="Enter answer..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="border border-green-500 p-2 hover:bg-green-500 hover:text-black transition disabled:opacity-50"
      >
        {loading ? "SUBMITTING..." : "SUBMIT"}
      </button>
    </div>
  );
}
