import { useState } from "react";
import api from "../api/client";
import ArtifactViewer from "../components/ArtifactViwer";

export default function Game() {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async () => {
    const res = await api.post("/levels/1/answer", { answer });
    setFeedback(res.data.success ? "ACCESS GRANTED" : "ACCESS DENIED");
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8 flex flex-col gap-6">
      <div className={`p-4 text-lg ${feedback === "ACCESS GRANTED" ? "text-green-400" : "text-red-500"}`}>
        {feedback || "AWAITING INPUT..."}
      </div>
      <ArtifactViewer type="text" url="/artifacts/level1.txt" />
      <input className="bg-black border border-green-500 p-2 outline-none"
        placeholder="Enter answer..." onChange={(e) => setAnswer(e.target.value)} />
      <button onClick={handleSubmit}
        className="border border-green-500 p-2 hover:bg-green-500 hover:text-black transition">
        SUBMIT
      </button>
    </div>
  );
}