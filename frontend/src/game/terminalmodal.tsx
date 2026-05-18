import { useState, useEffect, useRef } from "react";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";

interface Props {
  levelId: number;
  name: string;
  completedLevels: number[];
  onSuccess: (levelId: number, score: number) => void;
  onClose: () => void;
}

interface LevelData {
  id: number;
  title: string | null;
  description: string | null;
  type: string;
  points: number;
  artifact_url: string | null;
}

interface Hint {
  content: string;
  malus: number;
}

export default function TerminalModal({ levelId, name, completedLevels, onSuccess, onClose }: Props) {
  const [level, setLevel] = useState<LevelData | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);
  const [hintPos, setHintPos] = useState(0);
  const [hintMalus, setHintMalus] = useState(0);
  const [noMoreHints, setNoMoreHints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = useAuthStore((s) => s.userId);
  const alreadyDone = completedLevels.includes(levelId);

  useEffect(() => {
  api.get(`/levels/${levelId}`).then((r) => {
    setLevel(r.data);
    const l = r.data;
    const seq = [
      `> CONNEXION À ${name}...`,
      `> AUTHENTIFICATION...`,
      `> ACCÈS NIVEAU ${levelId} — [${l.type?.toUpperCase()}]`,
      `> ${l.title || "TERMINAL"}`,
      `─────────────────────────────`,
    ];
    // Ajouter les lignes une par une avec délai
    seq.forEach((line, i) => {
      setTimeout(() => {
        setLines((prev) => [...prev, line]);
      }, i * 150);
    });
  });
  inputRef.current?.focus();
}, [levelId]);

  const handleHint = async () => {
    if (!userId || noMoreHints) return;
    try {
      const res = await api.post(`/levels/${levelId}/hint`, { user_id: userId, position: hintPos + 1 });
      setHints((h) => [...h, { content: res.data.content, malus: res.data.malus }]);
      setHintPos((p) => p + 1);
      setHintMalus((m) => m + res.data.malus);
    } catch {
      setNoMoreHints(true);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !answer.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/levels/${levelId}/answer`, {
        user_id: userId,
        reponse: answer,
        indices_utilises: hintMalus,
        extra: {},
      });
      if (res.data.valide) {
        setLines((l) => [...l, "", `> ACCÈS ACCORDÉ ✓`, `> SCORE: +${res.data.score} pts`]);
        setFeedback("granted");
        setTimeout(() => onSuccess(levelId, res.data.score), 1500);
      } else {
        setLines((l) => [...l, `> ACCÈS REFUSÉ ✗ — MAUVAISE RÉPONSE`]);
        setFeedback("denied");
        setTimeout(() => setFeedback(""), 1000);
      }
    } catch {
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="border border-green-500 bg-black w-full max-w-2xl font-mono text-green-400 shadow-lg shadow-green-900/30">

        {/* Barre titre */}
        <div className="flex justify-between items-center border-b border-green-800 px-4 py-2 bg-green-950">
          <span className="text-xs tracking-widest">H4CKR TERMINAL — {name}</span>
          <button onClick={onClose} className="text-green-600 hover:text-red-400 text-sm">✕ ESC</button>
        </div>

        {/* Écran terminal */}
        <div className="p-4 h-48 overflow-y-auto text-xs leading-5 bg-black">
          {lines.map((line, i) => (
            <div key={i} className={
              line.includes("ACCORDÉ") ? "text-green-400" :
              line.includes("REFUSÉ") ? "text-red-400" :
              line.startsWith("─") ? "text-green-900" :
              "text-green-600"
            }>{line}</div>
          ))}
          {alreadyDone && (
            <div className="text-green-400 mt-2">✓ CE TERMINAL A DÉJÀ ÉTÉ COMPROMIS</div>
          )}
        </div>

        {/* Description */}
        {level && (
          <div className="border-t border-green-900 px-4 py-3 text-sm text-green-300 bg-black">
            {level.description}
            {level.artifact_url && (
              <a href={level.artifact_url} target="_blank" className="block mt-1 text-xs text-green-600 underline">
                → Voir l'artefact
              </a>
            )}
          </div>
        )}

        {/* Indices */}
        {hints.length > 0 && (
          <div className="border-t border-yellow-900 px-4 py-2 bg-black">
            {hints.map((h, i) => (
              <div key={i} className="text-xs text-yellow-500 mb-1">▶ {h.content}</div>
            ))}
            <div className="text-xs text-yellow-800">Malus actuel : -{hintMalus} pts</div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-green-800 px-4 py-3 flex gap-2 items-center bg-black">
          <span className="text-green-600 text-sm">{">"}</span>
          <input
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Entrez le code d'accès..."
            className={`flex-1 bg-transparent outline-none text-sm border-b ${
              feedback === "granted" ? "border-green-400 text-green-400" :
              feedback === "denied" ? "border-red-500 text-red-400" :
              "border-green-800 text-green-400"
            }`}
            disabled={loading || alreadyDone}
          />
        </div>

        {/* Actions */}
        <div className="flex border-t border-green-900">
          <button
            onClick={handleHint}
            disabled={noMoreHints || alreadyDone}
            className="flex-1 py-2 text-xs text-yellow-600 border-r border-green-900 hover:bg-yellow-950 transition disabled:opacity-30"
          >
            {noMoreHints ? "AUCUN INDICE" : `INDICE (-${hintPos === 0 ? "?" : "pts"})`}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || alreadyDone}
            className="flex-1 py-2 text-xs text-green-400 hover:bg-green-950 transition disabled:opacity-30"
          >
            {loading ? "VÉRIFICATION..." : "SOUMETTRE [ENTER]"}
          </button>
        </div>
      </div>
    </div>
  );
}