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

export default function TerminalModal({ levelId, name, completedLevels, onSuccess, onClose }: Props) {
  const [level, setLevel] = useState<LevelData | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hints, setHints] = useState<{ content: string; malus: number }[]>([]);
  const [hintPos, setHintPos] = useState(0);
  const [hintMalus, setHintMalus] = useState(0);
  const [noMoreHints, setNoMoreHints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = useAuthStore((s) => s.userId);
  const alreadyDone = completedLevels.includes(levelId);

  useEffect(() => {
    setLines([]);
    api.get(`/levels/${levelId}`).then((r) => {
      setLevel(r.data);
      const l = r.data;
      const seq = [
        `> CONNEXION À ${name}...`,
        `> AUTHENTIFICATION...`,
        `> ACCÈS NIVEAU ${levelId} — [${l.type?.toUpperCase()}]`,
        `─────────────────────────────────`,
      ];
      seq.forEach((line, i) => {
        setTimeout(() => setLines((prev) => [...prev, line]), i * 120);
      });
    });
    setTimeout(() => inputRef.current?.focus(), 600);
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
    if (!userId || !answer.trim() || alreadyDone) return;
    setLoading(true);
    try {
      const res = await api.post(`/levels/${levelId}/answer`, {
        user_id: userId, reponse: answer, indices_utilises: hintMalus, extra: {},
      });
      if (res.data.valide) {
        setLines((l) => [...l, "", `> ACCÈS ACCORDÉ ✓`, `> SCORE: +${res.data.score} pts`, `> RETOUR AU COULOIR...`]);
        setFeedback("granted");
        setTimeout(() => onSuccess(levelId, res.data.score), 1800);
      } else {
        setLines((l) => [...l, `> ACCÈS REFUSÉ ✗`]);
        setFeedback("denied");
        setTimeout(() => setFeedback(""), 1200);
      }
    } catch {
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  };

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="absolute inset-0 bg-black bg-opacity-92 flex items-center justify-center z-50"
      style={{ backdropFilter: "blur(2px)" }}>
      <div className="border border-green-500 bg-black w-full max-w-2xl font-mono text-green-400"
        style={{ boxShadow: "0 0 40px rgba(0,255,68,0.15)" }}>

        {/* Titre */}
        <div className="flex justify-between items-center border-b border-green-800 px-4 py-2 bg-black"
          style={{ background: "rgba(0,20,0,0.8)" }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs tracking-widest">H4CKR TERMINAL — {name}</span>
          </div>
          <button onClick={onClose} className="text-green-800 hover:text-red-400 text-xs transition">
            ESC / ✕
          </button>
        </div>

        {/* Écran terminal */}
        <div className="p-4 h-36 overflow-y-auto text-xs leading-5 bg-black font-mono">
          {lines.map((line, i) => (
            <div key={i} className={
              line.includes("ACCORDÉ") ? "text-green-400" :
              line.includes("REFUSÉ") ? "text-red-400" :
              line.startsWith("─") ? "text-green-900" :
              line.startsWith(">") ? "text-green-600" : "text-green-800"
            }>{line}</div>
          ))}
          {alreadyDone && <div className="text-green-500 mt-1">✓ TERMINAL DÉJÀ COMPROMIS</div>}
        </div>

        {/* Description énigme */}
        {level && (
          <div className="border-t border-green-900 px-4 py-3 text-sm text-green-300 bg-black leading-relaxed">
            {level.title && <p className="text-green-400 font-bold mb-1">{level.title}</p>}
            <p className="text-green-600 text-xs">{level.description}</p>
            {level.artifact_url && (
              <a href={level.artifact_url} target="_blank"
                className="block mt-2 text-xs text-green-700 hover:text-green-400 underline transition">
                → Télécharger l'artefact
              </a>
            )}
          </div>
        )}

        {/* Indices */}
        {hints.length > 0 && (
          <div className="border-t border-yellow-900 px-4 py-2 bg-black">
            {hints.map((h, i) => (
              <div key={i} className="text-xs text-yellow-600 mb-1">▶ {h.content}</div>
            ))}
            <div className="text-xs text-yellow-900 mt-1">malus : -{hintMalus} pts</div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-green-900 px-4 py-3 flex gap-2 items-center bg-black">
          <span className="text-green-700 text-sm">{">"}</span>
          <input
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !alreadyDone && handleSubmit()}
            placeholder={alreadyDone ? "Terminal déjà compromis" : "Entrez le code d'accès..."}
            className="flex-1 bg-transparent outline-none text-sm text-green-400 disabled:opacity-40"
            style={{
              borderBottom: `1px solid ${feedback === "granted" ? "#22c55e" : feedback === "denied" ? "#ef4444" : "#166534"}`,
              caretColor: "#00ff44",
            }}
            disabled={loading || alreadyDone || feedback === "granted"}
          />
        </div>

        {/* Boutons */}
        <div className="flex border-t border-green-900">
          <button onClick={handleHint} disabled={noMoreHints || alreadyDone}
            className="flex-1 py-2 text-xs text-yellow-700 border-r border-green-900 hover:bg-yellow-950 transition disabled:opacity-30">
            {noMoreHints ? "AUCUN INDICE" : hints.length === 0 ? "DEMANDER UN INDICE" : `INDICE ${hints.length + 1}`}
          </button>
          <button onClick={handleSubmit} disabled={loading || alreadyDone || feedback === "granted"}
            className="flex-1 py-2 text-xs text-green-600 hover:bg-green-950 transition disabled:opacity-30">
            {loading ? "VÉRIFICATION..." : feedback === "granted" ? "ACCÈS ACCORDÉ ✓" : "SOUMETTRE [ENTER]"}
          </button>
        </div>
      </div>
    </div>
  );
}