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
  const [terminal, setTerminal] = useState<TerminalData | null>(null);
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);
  const completedRef = useRef<number[]>(completedLevels);

  // Garde completedRef à jour sans recréer le jeu
  useEffect(() => {
    completedRef.current = completedLevels;
  }, [completedLevels]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: containerRef.current,
      backgroundColor: "#080808",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [GameScene],
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.on(EVENTS.OPEN_TERMINAL, (data: TerminalData) => {
      setTerminal(data);
    });

    game.events.on(EVENTS.SHOW_DIALOGUE, (data: DialogueData) => {
      setDialogue(data);
    });

    game.events.on(EVENTS.HIDE_DIALOGUE, () => {
      setDialogue(null);
    });

    // Init avec les niveaux déjà complétés
    game.events.once("ready", () => {
      const scene = game.scene.getScene("GameScene") as GameScene;
      if (scene && completedRef.current.length > 0) {
        scene.scene.restart({ completedLevels: completedRef.current, mode: "corridor" });
      }
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const handleTerminalSuccess = (levelId: number, score: number) => {
    setTerminal(null);
    onLevelComplete(levelId, score);
    const scene = gameRef.current?.scene.getScene("GameScene") as GameScene;
    if (scene) scene.markLevelComplete(levelId);
  };

  const handleCloseTerminal = () => {
    setTerminal(null);
    // Rendre le focus au canvas Phaser pour que les contrôles reprennent
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) canvas.focus();
  };

  return (
    <div className="relative select-none" style={{ width: 800, height: 500 }}>
      <div
        ref={containerRef}
        className="border border-green-900"
        style={{ width: 800, height: 500, imageRendering: "pixelated" }}
      />

      {terminal && (
        <TerminalModal
          levelId={terminal.levelId}
          name={terminal.name}
          completedLevels={completedLevels}
          onSuccess={handleTerminalSuccess}
          onClose={handleCloseTerminal}
        />
      )}

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