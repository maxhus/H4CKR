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
      if (i >= text.length) {
        clearInterval(interval);
        setTyping(false);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [currentLine, lines]);

  const handleNext = () => {
    if (typing) {
      // Skip typing
      setDisplayed(lines[currentLine]);
      setTyping(false);
      return;
    }
    if (currentLine < lines.length - 1) {
      setCurrentLine((c) => c + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40" onClick={handleNext}>
      <div className="border-t-2 border-blue-500 bg-black bg-opacity-95 p-4 font-mono cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Avatar NPC */}
          <div className="shrink-0 w-12 h-12 border border-blue-500 flex items-center justify-center bg-blue-950">
            <div className="text-blue-400 text-xs text-center leading-tight">
              GH<br />OS<br />T
            </div>
          </div>

          <div className="flex-1">
            <div className="text-blue-400 text-xs mb-1 tracking-widest">{speaker}</div>
            <div className="text-green-300 text-sm min-h-[2.5rem]">{displayed}
              {typing && <span className="animate-pulse text-green-500">█</span>}
            </div>
          </div>

          <div className="shrink-0 text-xs text-green-700 self-end">
            {currentLine < lines.length - 1 ? "[ SUIVANT →]" : "[ FERMER ]"}
          </div>
        </div>

        {/* Progression */}
        <div className="flex gap-1 mt-2 justify-center">
          {lines.map((_, i) => (
            <div key={i} className={`w-2 h-1 ${i <= currentLine ? "bg-blue-400" : "bg-blue-900"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}