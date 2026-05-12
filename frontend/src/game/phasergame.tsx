import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { GameScene, EVENTS } from "./gamescene";
import TerminalModal from "./terminalmodal";
import DialogueBox from "./dialoguebox";

interface DialogueData {
  speaker: string;
  lines: string[];
}

interface TerminalData {
  levelId: number;
  name: string;
}

interface Props {
  completedLevels: number[];
  onLevelComplete: (levelId: number, score: number) => void;
}

export default function PhaserGame({ completedLevels, onLevelComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);

  const [terminal, setTerminal] = useState<TerminalData | null>(null);
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: containerRef.current,
      backgroundColor: "#0a0a0a",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [GameScene],
      pixelArt: true,
      roundPixels: true,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Écouter les events Phaser → React
    game.events.on(EVENTS.OPEN_TERMINAL, (data: TerminalData) => {
      setTerminal(data);
    });

    game.events.on(EVENTS.SHOW_DIALOGUE, (data: DialogueData) => {
      setDialogue(data);
    });

    game.events.on(EVENTS.HIDE_DIALOGUE, () => {
      setDialogue(null);
    });

    // Récupérer la référence à la scène
    game.events.on("ready", () => {
      sceneRef.current = game.scene.getScene("GameScene") as GameScene;
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Passer completedLevels à la scène au démarrage
  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene("GameScene") as GameScene;
      if (scene) {
        scene.scene.restart({ completedLevels });
      }
    }
  }, [completedLevels]);

  const handleTerminalSuccess = (levelId: number, score: number) => {
    setTerminal(null);
    onLevelComplete(levelId, score);
    // Notifier la scène Phaser
    const scene = gameRef.current?.scene.getScene("GameScene") as GameScene;
    if (scene) scene.markLevelComplete(levelId);
  };

  return (
    <div className="relative">
      {/* Canvas Phaser */}
      <div ref={containerRef} className="border border-green-900" style={{ imageRendering: "pixelated" }} />

      {/* Overlay terminal (React par-dessus Phaser) */}
      {terminal && (
        <TerminalModal
          levelId={terminal.levelId}
          name={terminal.name}
          completedLevels={completedLevels}
          onSuccess={handleTerminalSuccess}
          onClose={() => setTerminal(null)}
        />
      )}

      {/* Dialogue NPC */}
      {dialogue && (
        <DialogueBox
          speaker={dialogue.speaker}
          lines={dialogue.lines}
          onClose={() => setDialogue(null)}
        />
      )}
    </div>
  );
}