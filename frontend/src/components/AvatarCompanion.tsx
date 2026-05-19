import { useState, useEffect, useRef } from "react";
import { useChiptune } from "../hooks/useChiptune";

interface Props {
  trigger: "idle" | "typing" | "wrong" | "hint" | "correct" | "victory" | "login";
}

const REPLIES: Record<string, string[]> = {
  idle: [
    "...tu es sûr d'être à ta place ici ?",
    "je t'observe.",
    "prends ton temps. on a TOUTE la nuit.",
    "tu vas vraiment essayer ?",
    "...",
    "toujours là à rien faire.",
    "le serveur attend. toi aussi apparemment.",
  ],
  typing: [
    "oh, tu penses vraiment que c'est ça ?",
    "intéressant... non.",
    "continue, je veux voir où tu vas avec ça.",
    "hmm. courageux.",
    "ça m'étonnerait que ce soit bon.",
    "tu tapes vite pour quelqu'un qui va se tromper.",
  ],
  wrong: [
    "pathétique.",
    "encore raté. lol.",
    "même un script kiddie ferait mieux.",
    "ACCESS DENIED. comme prévu.",
    "tu veux que je t'explique ? ah non, débrouille-toi.",
    "c'était... non. juste non.",
    "fascinant. tu es mauvais.",
    "j'allais dire quelque chose d'encourageant. j'ai changé d'avis.",
  ],
  hint: [
    "besoin d'aide ? quelle surprise...",
    "je savais que tu craquerais.",
    "un indice. bien sûr. pourquoi pas directement la réponse ?",
    "ah, l'indice. le refuge des désespérés.",
    "tellement prévisible.",
    "note : les points diminuent. tout comme mon respect.",
  ],
  correct: [
    "...ok t'as eu de la chance.",
    "ne t'habitue pas à réussir.",
    "bien. mais c'était le niveau 1.",
    "ACCESS GRANTED. profite, ça va pas durer.",
    "par chance ou par compétence ? la réponse m'importe peu.",
    "hm. correct. je reste sceptique.",
  ],
  victory: [
    "bon... t'es pas totalement nul finalement.",
    "je suis... surpris. légèrement.",
    "NEXUS Corp est tombé. t'as failli abandonner 12 fois.",
    "félicitations. maintenant oublie que je t'ai aidé.",
    "tu as réussi. ne me remercie pas.",
  ],
  login: [
    "encore toi ?",
    "bienvenue dans H4CKR. essaie de pas tout casser.",
    "un nouveau venu. adorable.",
    "identifie-toi. si tu peux.",
    "je t'observe depuis le début.",
    "mot de passe oublié ? c'est bien toi ça.",
  ],
};

function getRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function AvatarCompanion({ trigger }: Props) {
  const [bubble, setBubble] = useState("");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [shake, setShake] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrigger = useRef<string>("");
  const { playAvatarTalk, playAvatarMock, playAvatarSurprise, playAvatarHint } = useChiptune();

  const showBubble = (text: string, duration = 4000, sound?: () => void) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBubble(text);
    setBubbleVisible(true);
    if (sound) sound();
    timeoutRef.current = setTimeout(() => setBubbleVisible(false), duration);
  };

  // Idle automatique
  useEffect(() => {
    const scheduleIdle = () => {
      const t = setTimeout(() => {
        showBubble(getRandom(REPLIES.idle), 5000, playAvatarTalk);
        scheduleIdle();
      }, 18000 + Math.random() * 10000);
      return t;
    };
    const t = scheduleIdle();
    return () => clearTimeout(t);
  }, []);

  // Réaction aux triggers
  useEffect(() => {
    if (trigger === "typing" && lastTrigger.current === "typing") return;
    lastTrigger.current = trigger;

    if (trigger === "wrong") {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      showBubble(getRandom(REPLIES.wrong), 5000, playAvatarMock);
    } else if (trigger === "correct") {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 1000);
      showBubble(getRandom(REPLIES.correct), 5000, playAvatarTalk);
    } else if (trigger === "hint") {
      showBubble(getRandom(REPLIES.hint), 5000, playAvatarHint);
    } else if (trigger === "victory") {
      setBlinking(true);
      showBubble(getRandom(REPLIES.victory), 8000, playAvatarSurprise);
    } else if (trigger === "login") {
      setTimeout(() => showBubble(getRandom(REPLIES.login), 6000, playAvatarTalk), 2000);
    } else if (trigger === "typing") {
      if (Math.random() < 0.25) showBubble(getRandom(REPLIES.typing), 3000, playAvatarTalk);
    }
  }, [trigger]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 select-none">

      {/* Bulle */}
      <div style={{
        opacity: bubbleVisible ? 1 : 0,
        transform: bubbleVisible ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.3s ease",
        pointerEvents: bubbleVisible ? "auto" : "none",
        maxWidth: "220px",
      }}>
        <div className="border border-green-700 bg-black px-3 py-2 text-xs text-green-400 font-mono leading-relaxed relative"
          style={{ boxShadow: "0 0 15px rgba(0,255,68,0.1)" }}>
          {bubble}
          <div className="absolute right-6 w-0 h-0"
            style={{ bottom: "-8px", borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #16a34a" }} />
        </div>
      </div>

      {/* Avatar */}
      <div
        className="cursor-pointer"
        style={{ transform: shake ? "translateX(4px)" : "translateX(0)", transition: "transform 0.1s ease-in-out" }}
        onClick={() => showBubble(getRandom(REPLIES.idle), 4000, playAvatarTalk)}
      >
        <div style={{
          border: blinking ? "2px solid #4ade80" : "2px solid #166534",
          boxShadow: blinking ? "0 0 20px rgba(0,255,68,0.5)" : "0 0 10px rgba(0,255,68,0.1)",
          transition: "border-color 0.3s, box-shadow 0.3s",
          position: "relative",
        }}>
          <img src="/avatar.png" alt="avatar" style={{ width: 64, height: 64, objectFit: "cover", imageRendering: "pixelated", filter: "brightness(0.9)", display: "block" }} />
          <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ top: -4, right: -4 }} />
        </div>
      </div>
    </div>
  );
}