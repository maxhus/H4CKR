import { useState, useEffect } from "react";

interface Props {
  speaker: string;
  lines: string[];
  onClose: () => void;
}

export default function DialogueBox({ speaker, lines, onClose }: Props) {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    setDisplayed("");
    setTyping(true);
    let i = 0;
    const text = lines[currentLine];
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { clearInterval(interval); setTyping(false); }
    }, 25);
    return () => clearInterval(interval);
  }, [currentLine, lines]);

  const handleNext = () => {
    if (typing) { setDisplayed(lines[currentLine]); setTyping(false); return; }
    if (currentLine < lines.length - 1) setCurrentLine((c) => c + 1);
    else onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNext(); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentLine, typing]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 cursor-pointer" onClick={handleNext}>
      <div className="border-t-2 border-blue-600 bg-black font-mono p-4"
        style={{ background: "rgba(0,0,10,0.97)", boxShadow: "0 -4px 20px rgba(0,0,255,0.1)" }}>
        <div className="flex items-start gap-4">

          {/* Avatar GHOST */}
          <div className="shrink-0 w-12 h-12 border border-blue-700 flex items-center justify-center"
            style={{ background: "rgba(0,0,30,0.9)" }}>
            <div className="text-center leading-tight">
              <div className="text-blue-400 text-xs">GH</div>
              <div className="text-blue-400 text-xs">OS</div>
              <div className="text-blue-400 text-xs">T</div>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-blue-500 text-xs mb-1 tracking-widest">{speaker}</div>
            <div className="text-green-300 text-sm min-h-8 leading-relaxed">
              {displayed}
              {typing && <span className="animate-pulse text-green-500 ml-0.5">█</span>}
            </div>
          </div>

          <div className="shrink-0 text-xs text-green-800 self-end">
            {currentLine < lines.length - 1 ? "[SUIVANT →]" : "[FERMER]"}
          </div>
        </div>

        {/* Progression */}
        <div className="flex gap-1 mt-3 justify-center">
          {lines.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 3,
              background: i <= currentLine ? "#3b82f6" : "#1e3a5f",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
} 