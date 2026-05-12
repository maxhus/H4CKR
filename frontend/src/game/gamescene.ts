import Phaser from "phaser";

// Événements partagés entre Phaser et React
export const EVENTS = {
  OPEN_TERMINAL: "open_terminal",
  CLOSE_TERMINAL: "close_terminal",
  SHOW_DIALOGUE: "show_dialogue",
  HIDE_DIALOGUE: "hide_dialogue",
  LEVEL_COMPLETE: "level_complete",
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerSpeed = 180;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private interactables: Phaser.GameObjects.Rectangle[] = [];
  private interactLabels: Phaser.GameObjects.Text[] = [];
  private nearObject: { obj: Phaser.GameObjects.Rectangle; levelId: number; name: string } | null = null;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private completedLevels: Set<number> = new Set();
  private walls: Phaser.Physics.Arcade.StaticGroup | null = null;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { completedLevels?: number[] }) {
    if (data.completedLevels) {
      this.completedLevels = new Set(data.completedLevels);
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Fond ──────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a0a);

    // ── Grille pixelart ──────────────────────────────────
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a2a1a, 0.3);
    for (let x = 0; x < W; x += 32) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 32) grid.lineBetween(0, y, W, y);

    // ── Murs ─────────────────────────────────────────────
    this.walls = this.physics.add.staticGroup();
    this.drawRoom(W, H);

    // ── Joueur ────────────────────────────────────────────
    this.player = this.add.rectangle(W / 2, H / 2, 20, 28, 0x00ff88);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // Détail sprite joueur (pixel art simplifié)
    const playerDetail = this.add.graphics();
    playerDetail.fillStyle(0x003311);
    playerDetail.fillRect(-4, -8, 8, 6); // tête

    // ── Terminaux interactifs ─────────────────────────────
    this.createTerminal(160, 120, 1, "TERMINAL_A");
    this.createTerminal(W - 160, 120, 2, "TERMINAL_B");
    this.createTerminal(160, H - 120, 3, "TERMINAL_C");
    this.createTerminal(W - 160, H - 120, 4, "TERMINAL_D");

    // ── Porte centrale (débloquée si niveaux 1-4 complétés) ──
    this.createDoor(W / 2, 40, [1, 2, 3, 4]);

    // ── NPC ───────────────────────────────────────────────
    this.createNPC(W / 2, H - 100);

    // ── Contrôles ─────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // ── Légende ───────────────────────────────────────────
    this.add.text(12, H - 20, "[WASD / ↑↓←→] Déplacer   [E] Interagir", {
      fontSize: "11px", color: "#334433", fontFamily: "monospace",
    });

    // ── Titre zone ────────────────────────────────────────
    this.add.text(W / 2, 16, "ZONE_01 — PARKING SOUTERRAIN", {
      fontSize: "13px", color: "#00ff44", fontFamily: "monospace",
    }).setOrigin(0.5, 0);
  }

  private drawRoom(W: number, H: number) {
    const g = this.add.graphics();

    // Sol
    g.fillStyle(0x111811);
    g.fillRect(32, 32, W - 64, H - 64);

    // Murs extérieurs
    g.fillStyle(0x1a3a1a);
    g.fillRect(0, 0, W, 32);       // haut
    g.fillRect(0, H - 32, W, 32); // bas
    g.fillRect(0, 0, 32, H);      // gauche
    g.fillRect(W - 32, 0, 32, H); // droite

    // Détails murs (briques pixel)
    g.fillStyle(0x0d2a0d);
    for (let x = 32; x < W - 32; x += 32) {
      g.fillRect(x, 0, 2, 32);
      g.fillRect(x, H - 32, 2, 32);
    }
    for (let y = 32; y < H - 32; y += 32) {
      g.fillRect(0, y, 32, 2);
      g.fillRect(W - 32, y, 32, 2);
    }

    // Piliers
    [[80, 80], [W - 80, 80], [80, H - 80], [W - 80, H - 80]].forEach(([x, y]) => {
      g.fillStyle(0x224422);
      g.fillRect(x - 12, y - 12, 24, 24);
      g.fillStyle(0x336633);
      g.fillRect(x - 8, y - 8, 16, 16);
    });
  }

  private createTerminal(x: number, y: number, levelId: number, name: string) {
    const completed = this.completedLevels.has(levelId);
    const color = completed ? 0x004400 : 0x003300;
    const borderColor = completed ? 0x00ff44 : 0x00aa22;

    // Corps terminal
    const terminal = this.add.rectangle(x, y, 48, 56, color);
    this.physics.add.existing(terminal, true);

    // Écran
    const screen = this.add.rectangle(x, y - 6, 36, 28, completed ? 0x001a00 : 0x000800);
    const scanline = this.add.graphics();
    scanline.lineStyle(1, borderColor, 0.3);
    for (let i = y - 18; i < y + 8; i += 4) {
      scanline.lineBetween(x - 18, i, x + 18, i);
    }

    // Texte écran
    this.add.text(x, y - 6, completed ? "OK\n✓" : `LVL\n${levelId}`, {
      fontSize: "9px", color: completed ? "#00ff44" : "#00aa22",
      fontFamily: "monospace", align: "center",
    }).setOrigin(0.5);

    // Clavier
    this.add.rectangle(x, y + 18, 40, 10, 0x112211);

    // Bordure
    const border = this.add.graphics();
    border.lineStyle(2, borderColor);
    border.strokeRect(x - 24, y - 28, 48, 56);

    // Label
    const label = this.add.text(x, y + 36, `[E] ${name}`, {
      fontSize: "10px", color: "#00ff44", fontFamily: "monospace",
    }).setOrigin(0.5).setVisible(false);
    this.interactLabels.push(label);

    // Zone d'interaction
    const zone = this.add.rectangle(x, y, 80, 80, 0x000000, 0);
    this.physics.add.existing(zone, true);
    this.interactables.push(zone);
    (zone as any).__levelId = levelId;
    (zone as any).__name = name;
    (zone as any).__label = label;
    (zone as any).__completed = completed;

    // Clignotement si non complété
    if (!completed) {
      this.tweens.add({
        targets: border,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }

    return zone;
  }

  private createDoor(x: number, y: number, requiredLevels: number[]) {
    const allDone = requiredLevels.every((id) => this.completedLevels.has(id));
    const color = allDone ? 0x00ff44 : 0x331100;

    const door = this.add.rectangle(x, y + 16, 64, 32, color);
    this.add.text(x, y + 16, allDone ? "EXIT ▲" : "LOCKED", {
      fontSize: "10px",
      color: allDone ? "#000000" : "#ff4400",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    if (!allDone) {
      this.add.text(x, y + 36, `${this.completedLevels.size}/${requiredLevels.length} terminaux`, {
        fontSize: "9px", color: "#554422", fontFamily: "monospace",
      }).setOrigin(0.5);
    }
  }

  private createNPC(x: number, y: number) {
    // Corps NPC
    this.add.rectangle(x, y, 18, 24, 0x4444ff);
    this.add.rectangle(x, y - 14, 14, 14, 0x8888ff); // tête
    // Yeux
    this.add.rectangle(x - 3, y - 15, 3, 3, 0xffffff);
    this.add.rectangle(x + 3, y - 15, 3, 3, 0xffffff);

    this.add.text(x, y + 20, "GHOST", {
      fontSize: "9px", color: "#4444ff", fontFamily: "monospace",
    }).setOrigin(0.5);

    // Zone interaction NPC
    const npcZone = this.add.rectangle(x, y, 80, 60, 0x000000, 0);
    this.physics.add.existing(npcZone, true);
    this.interactables.push(npcZone);
    (npcZone as any).__levelId = -1; // -1 = NPC dialogue
    (npcZone as any).__name = "GHOST";
    const npcLabel = this.add.text(x, y + 36, "[E] Parler", {
      fontSize: "10px", color: "#4444ff", fontFamily: "monospace",
    }).setOrigin(0.5).setVisible(false);
    (npcZone as any).__label = npcLabel;
    this.interactLabels.push(npcLabel);
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    if (left) body.setVelocityX(-this.playerSpeed);
    else if (right) body.setVelocityX(this.playerSpeed);
    if (up) body.setVelocityY(-this.playerSpeed);
    else if (down) body.setVelocityY(this.playerSpeed);

    // Normaliser diagonale
    if ((left || right) && (up || down)) body.velocity.normalize().scale(this.playerSpeed);

    // Détecter proximité
    this.nearObject = null;
    this.interactLabels.forEach((l) => l.setVisible(false));

    for (const zone of this.interactables) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, zone.x, zone.y
      );
      if (dist < 70) {
        const label = (zone as any).__label;
        if (label) label.setVisible(true);
        this.nearObject = {
          obj: zone,
          levelId: (zone as any).__levelId,
          name: (zone as any).__name,
        };
        break;
      }
    }

    // Interaction
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearObject) {
      this.interact(this.nearObject.levelId, this.nearObject.name);
    }
  }

  private interact(levelId: number, name: string) {
    if (levelId === -1) {
      // Dialogue NPC
      this.game.events.emit(EVENTS.SHOW_DIALOGUE, {
        speaker: "GHOST",
        lines: [
          "Bienvenue, recrue.",
          "Cette zone est sous haute surveillance de NEXUS Corp.",
          "Tu vois ces terminaux ? Chacun contrôle un accès.",
          "Hack-les tous pour ouvrir la porte vers ZONE_02.",
          "Approche-toi et appuie sur [E] pour interagir.",
        ],
      });
    } else {
      // Ouvrir terminal d'énigme
      this.game.events.emit(EVENTS.OPEN_TERMINAL, { levelId, name });
    }
  }

  public markLevelComplete(levelId: number) {
    this.completedLevels.add(levelId);
    // Relancer la scène pour mettre à jour l'état visuel
    this.time.delayedCall(500, () => {
      this.scene.restart({ completedLevels: Array.from(this.completedLevels) });
    });
  }
}