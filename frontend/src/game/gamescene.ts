import Phaser from "phaser";

export const EVENTS = {
  OPEN_TERMINAL: "open_terminal",
  SHOW_DIALOGUE: "show_dialogue",
  HIDE_DIALOGUE: "hide_dialogue",
};

const ROOMS = [
  { id: 1,  chapter: 1, label: "BASE64" },
  { id: 2,  chapter: 1, label: "CESAR" },
  { id: 3,  chapter: 1, label: "ROT13" },
  { id: 4,  chapter: 1, label: "HEX" },
  { id: 5,  chapter: 2, label: "REGEX" },
  { id: 6,  chapter: 2, label: "JSON" },
  { id: 7,  chapter: 2, label: "JSON+" },
  { id: 8,  chapter: 3, label: "EXIF" },
  { id: 9,  chapter: 3, label: "GPS" },
  { id: 10, chapter: 3, label: "HTTP" },
  { id: 11, chapter: 3, label: "REDIR" },
  { id: 12, chapter: 4, label: "REGEX+" },
  { id: 13, chapter: 4, label: "BIN" },
  { id: 14, chapter: 4, label: "B64x2" },
  { id: 15, chapter: 4, label: "FINAL" },
];

const THEMES = [
  { tint: 0x00eeff, name: "ENCODAGE"    },
  { tint: 0xaa44ff, name: "LOGIQUE"     },
  { tint: 0xff4488, name: "INFILTRATION"},
  { tint: 0x88ff00, name: "BREACH"      },
];

const DOOR_SPACING = 150;

type SceneMode = "corridor" | "room";

export class GameScene extends Phaser.Scene {
  private mode: SceneMode = "corridor";
  private currentRoomId = 0;

  private playerSprite!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Image;
  private playerSpeed = 160;
  private playerFacing: "left" | "right" = "right";
  private stepAnim = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyQ!: Phaser.Input.Keyboard.Key;

  private interactables: Array<{
    x: number; y: number; w: number; h: number;
    roomId: number; label: Phaser.GameObjects.Text;
  }> = [];
  private nearRoom: number | null = null;
  private completedLevels: Set<number> = new Set();
  private transitionActive = false;

  constructor() { super({ key: "GameScene" }); }

  init(data: { completedLevels?: number[]; mode?: SceneMode; roomId?: number }) {
    if (data.completedLevels) this.completedLevels = new Set(data.completedLevels);
    if (data.mode) this.mode = data.mode;
    if (data.roomId !== undefined) this.currentRoomId = data.roomId;
    this.interactables = [];
    this.nearRoom = null;
    this.transitionActive = false;
  }

  preload() {
    // Pas de spritesheet — tout en Graphics pour éviter les artefacts visuels
  }

  create() {
    if (this.mode === "corridor") this.createCorridor();
    else this.createRoom(this.currentRoomId);
    this.setupKeys();
  }

  // ══════════════════════════════════════════════════════════
  // COULOIR
  // ══════════════════════════════════════════════════════════

  private createCorridor() {
    const W = this.scale.width;
    const H = this.scale.height;
    const CW = 220 + ROOMS.length * DOOR_SPACING;
    const FLOOR_Y = H - 80;
    const CEIL_Y  = 80;

    this.cameras.main.setBounds(0, 0, CW, H);
    this.cameras.main.setBackgroundColor("#06080f");
    this.physics.world.setBounds(0, 0, CW, H);

    const g = this.add.graphics();

    // ── Fond gradient sombre ──────────────────────────────
    for (let y = 0; y < H; y += 2) {
      const t = y / H;
      const r = Math.floor(6 + t * 4);
      const gr = Math.floor(8 + t * 6);
      const b = Math.floor(15 + t * 10);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b));
      g.fillRect(0, y, CW, 2);
    }

    // ── Sol ───────────────────────────────────────────────
    // Dalle principale
    g.fillStyle(0x0a0e1a);
    g.fillRect(0, FLOOR_Y, CW, H - FLOOR_Y);

    // Ligne de sol lumineuse
    g.lineStyle(2, 0x00ff88, 0.4);
    g.lineBetween(0, FLOOR_Y, CW, FLOOR_Y);

    // Carreaux sol
    g.lineStyle(1, 0x112233, 0.5);
    for (let x = 0; x < CW; x += 60) {
      g.lineBetween(x, FLOOR_Y, x, H);
    }

    // Reflet sol (lignes de perspective vers le centre)
    g.lineStyle(1, 0x00ff88, 0.06);
    for (let x = 0; x < CW; x += 30) {
      g.lineBetween(x, FLOOR_Y, CW / 2, H);
    }

    // ── Plafond ───────────────────────────────────────────
    g.fillStyle(0x080c18);
    g.fillRect(0, 0, CW, CEIL_Y);
    g.lineStyle(2, 0x00ff88, 0.3);
    g.lineBetween(0, CEIL_Y, CW, CEIL_Y);
    g.lineStyle(1, 0x112233, 0.4);
    for (let x = 0; x < CW; x += 60) {
      g.lineBetween(x, 0, x, CEIL_Y);
    }

    // ── Murs latéraux (lignes de fuite) ───────────────────
    g.lineStyle(1, 0x1a2a3a, 0.3);
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const y1 = CEIL_Y + t * (FLOOR_Y - CEIL_Y) * 0.3;
      const y2 = FLOOR_Y - t * (FLOOR_Y - CEIL_Y) * 0.3;
      g.lineBetween(0, y1, CW, y2);
    }

    // ── Lumières néon plafond ─────────────────────────────
    for (let lx = 160; lx < CW; lx += DOOR_SPACING) {
      // Tube néon
      const neon = this.add.graphics();
      neon.fillStyle(0x00eeff);
      neon.fillRect(lx - 20, CEIL_Y - 8, 40, 5);
      // Halo
      neon.fillStyle(0x003344, 0.3);
      neon.fillEllipse(lx, CEIL_Y + 20, 100, 50);
      // Lumière projetée sur le sol
      neon.fillStyle(0x001122, 0.15);
      neon.fillTriangle(lx - 30, CEIL_Y, lx + 30, CEIL_Y, lx, FLOOR_Y - 20);

      // Clignotement aléatoire
      if (Math.random() < 0.15) {
        this.tweens.add({
          targets: neon, alpha: 0.3,
          duration: 80 + Math.random() * 40,
          yoyo: true, repeat: 1,
          delay: Math.random() * 5000,
        });
      }
    }

    // ── Câbles au plafond ─────────────────────────────────
    const cables = this.add.graphics();
    cables.lineStyle(1, 0x223344, 0.6);
    for (let lx = 0; lx < CW; lx += DOOR_SPACING) {
      // Câble qui pend
      cables.beginPath();
      cables.moveTo(lx, CEIL_Y);
      cables.lineTo(lx + 20, CEIL_Y + 15);
      cables.lineTo(lx + 40, CEIL_Y + 5);
      cables.strokePath();
    }

    // ── Portes ────────────────────────────────────────────
    ROOMS.forEach((room, i) => {
      this.createCorridorDoor(220 + i * DOOR_SPACING, H / 2 - 10, room, FLOOR_Y, CEIL_Y);
    });

    // ── NPC GHOST ─────────────────────────────────────────
    this.createCorridorNPC(110, H / 2 - 10, FLOOR_Y);

    // ── Joueur ────────────────────────────────────────────
    const startX = this.completedLevels.size > 0
      ? Math.min(this.completedLevels.size, 14) * DOOR_SPACING + 180
      : 170;
    this.createPlayer(startX, FLOOR_Y - 24);
    this.cameras.main.startFollow(this.playerBody, true, 0.08, 0.08);

    // ── HUD ───────────────────────────────────────────────
    this.add.text(10, 8, `NEXUS CORP — SERVER BLOCK   ${this.completedLevels.size}/15`, {
      fontSize: "10px", color: "#1a4433", fontFamily: "monospace",
    }).setScrollFactor(0).setDepth(20);

    this.add.text(10, H - 16, "[A/D ou ←→] Déplacer   [E] Entrer", {
      fontSize: "9px", color: "#0d2211", fontFamily: "monospace",
    }).setScrollFactor(0).setDepth(20);
  }

  private createCorridorDoor(x: number, y: number, room: typeof ROOMS[0], floorY: number, ceilY: number) {
    const theme = THEMES[room.chapter - 1];
    const completed = this.completedLevels.has(room.id);
    const unlocked = room.id === 1 || this.completedLevels.has(room.id - 1) || completed;
    const color = completed ? theme.tint : unlocked ? 0x223344 : 0x0a0f1a;
    const alpha = completed ? 0.9 : unlocked ? 0.6 : 0.25;

    const g = this.add.graphics();

    // Encadrement mural
    g.lineStyle(1, 0x1a2a3a, 0.8);
    g.fillStyle(0x060a14);
    g.fillRect(x - 28, ceilY, 56, floorY - ceilY);

    // Corps de la porte
    g.fillStyle(color, alpha * 0.15);
    g.fillRect(x - 22, y - 42, 44, 84);

    // Bordure porte
    g.lineStyle(completed ? 2 : 1, color, completed ? 0.9 : unlocked ? 0.5 : 0.2);
    g.strokeRect(x - 22, y - 42, 44, 84);

    // Panneau numéro (haut de la porte)
    g.fillStyle(0x000000, 0.8);
    g.fillRect(x - 14, y - 38, 28, 18);
    g.lineStyle(1, color, unlocked ? 0.7 : 0.2);
    g.strokeRect(x - 14, y - 38, 28, 18);

    // Ligne centrale décorative
    if (unlocked) {
      g.lineStyle(1, color, 0.2);
      g.lineBetween(x, y - 24, x, y + 38);
    }

    // Poignée
    if (unlocked) {
      g.fillStyle(color, 0.6);
      g.fillCircle(x + 16, y, 4);
      g.fillStyle(0x000000, 0.5);
      g.fillCircle(x + 16, y, 2);
    }

    // LED status
    const ledColor = completed ? 0x00ff44 : unlocked ? 0xff8800 : 0xff2200;
    g.fillStyle(ledColor);
    g.fillCircle(x + 18, y - 36, 3);

    // Halo LED
    if (completed || unlocked) {
      g.fillStyle(ledColor, 0.2);
      g.fillCircle(x + 18, y - 36, 7);
      this.tweens.add({ targets: g, alpha: 0.7, duration: 1000 + Math.random() * 500, yoyo: true, repeat: -1 });
    }

    // Numéro
    this.add.text(x, y - 29, String(room.id).padStart(2, "0"), {
      fontSize: "9px",
      color: `#${(completed ? theme.tint : unlocked ? 0x4488aa : 0x223344).toString(16).padStart(6, "0")}`,
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(3);

    // Icône complété
    if (completed) {
      this.add.text(x, y + 4, "✓", {
        fontSize: "20px",
        color: `#${theme.tint.toString(16).padStart(6, "0")}`,
        fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(4).setAlpha(0.7);
    }

    // Label type (sous la porte)
    this.add.text(x, y + 52, room.label, {
      fontSize: "8px",
      color: completed
        ? `#${theme.tint.toString(16).padStart(6, "0")}`
        : unlocked ? "#334455" : "#1a2233",
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(3);

    // Clignotement prochain niveau
    if (room.id === this.completedLevels.size + 1) {
      const pulse = this.add.graphics().setDepth(1);
      pulse.fillStyle(theme.tint, 0.08);
      pulse.fillRect(x - 24, y - 44, 48, 88);
      this.tweens.add({ targets: pulse, alpha: 0, duration: 800, yoyo: true, repeat: -1 });
    }

    // Zone interaction (seulement si pas complété)
    if (unlocked && !completed) {
      const accentHex = `#${theme.tint.toString(16).padStart(6, "0")}`;
      const label = this.add.text(x, y - 56, "[E] ENTRER", {
        fontSize: "8px", color: accentHex,
        fontFamily: "monospace", backgroundColor: "#00000099",
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setVisible(false).setDepth(10);
      this.interactables.push({ x, y, w: 30, h: 80, roomId: room.id, label });
    }
  }

  private createCorridorNPC(x: number, y: number, floorY: number) {
    const g = this.add.graphics().setDepth(4);

    // Ombre au sol
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(x, floorY - 4, 28, 8);

    // Corps (manteau long)
    g.fillStyle(0x0d1033);
    g.fillRect(x - 9, y - 4, 18, 22);

    // Capuche
    g.fillStyle(0x080a22);
    g.fillRect(x - 11, y - 22, 22, 20);
    g.fillTriangle(x - 11, y - 22, x + 11, y - 22, x - 11, y - 34);

    // Masque blanc
    g.fillStyle(0xeeeeff, 0.95);
    g.fillRect(x - 7, y - 18, 14, 12);

    // Yeux masque (fentes rouges)
    g.fillStyle(0xff2200);
    g.fillRect(x - 6, y - 15, 5, 3);
    g.fillRect(x + 1, y - 15, 5, 3);

    // Bords manteau
    g.lineStyle(1, 0x1a2266, 0.8);
    g.strokeRect(x - 9, y - 4, 18, 22);
    g.strokeRect(x - 11, y - 22, 22, 20);

    this.add.text(x, y + 24, "GHOST", {
      fontSize: "8px", color: "#2233aa", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    // Animation flottement
    this.tweens.add({ targets: g, y: "-=5", duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const label = this.add.text(x, y - 46, "[E] Parler", {
      fontSize: "8px", color: "#4444ff",
      fontFamily: "monospace", backgroundColor: "#00000099", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setVisible(false).setDepth(10);
    this.interactables.push({ x, y, w: 50, h: 60, roomId: -1, label });
  }

  // ══════════════════════════════════════════════════════════
  // SALLE
  // ══════════════════════════════════════════════════════════

  private createRoom(roomId: number) {
    const W = this.scale.width;
    const H = this.scale.height;
    const room = ROOMS.find((r) => r.id === roomId)!;
    const theme = THEMES[room.chapter - 1];
    const completed = this.completedLevels.has(roomId);
    const accentHex = `#${theme.tint.toString(16).padStart(6, "0")}`;
    const tint = theme.tint;

    this.cameras.main.setBackgroundColor("#050508");

    const g = this.add.graphics();

    // ── Fond sombre ───────────────────────────────────────
    g.fillStyle(0x060810);
    g.fillRect(0, 0, W, H);

    // ── Sol carrelé ───────────────────────────────────────
    const TS = 48;
    for (let ty = H - TS * 2; ty < H; ty += TS) {
      for (let tx = 0; tx < W; tx += TS) {
        const alt = ((tx / TS) + (ty / TS)) % 2 === 0;
        g.fillStyle(alt ? 0x0a0d18 : 0x080b14);
        g.fillRect(tx, ty, TS, TS);
      }
    }
    // Ligne de sol
    g.lineStyle(2, tint, 0.3);
    g.lineBetween(0, H - TS * 2, W, H - TS * 2);

    // ── Sol principal (grille fine) ───────────────────────
    g.lineStyle(1, tint, 0.06);
    for (let tx = 0; tx < W; tx += TS) g.lineBetween(tx, TS, tx, H - TS * 2);
    for (let ty = TS; ty < H - TS * 2; ty += TS) g.lineBetween(0, ty, W, ty);

    // ── Murs (bordures épaisses) ──────────────────────────
    // Haut
    g.fillStyle(0x080c18);
    g.fillRect(0, 0, W, TS);
    g.lineStyle(2, tint, 0.5);
    g.lineBetween(0, TS, W, TS);

    // Bas
    g.fillStyle(0x080c18);
    g.fillRect(0, H - TS, W, TS);
    g.lineStyle(2, tint, 0.3);
    g.lineBetween(0, H - TS, W, H - TS);

    // Gauche
    g.fillStyle(0x08101a);
    g.fillRect(0, TS, TS, H - TS * 2);
    g.lineStyle(2, tint, 0.5);
    g.lineBetween(TS, TS, TS, H - TS);

    // Droite
    g.fillStyle(0x08101a);
    g.fillRect(W - TS, TS, TS, H - TS * 2);
    g.lineStyle(2, tint, 0.5);
    g.lineBetween(W - TS, TS, W - TS, H - TS);

    // ── Coins décoratifs ──────────────────────────────────
    [[TS, TS], [W - TS, TS], [TS, H - TS], [W - TS, H - TS]].forEach(([cx, cy]) => {
      g.fillStyle(tint, 0.4);
      g.fillRect(cx - 6, cy - 6, 12, 12);
      g.fillStyle(0x000000);
      g.fillRect(cx - 4, cy - 4, 8, 8);
      g.fillStyle(tint, 0.7);
      g.fillRect(cx - 2, cy - 2, 4, 4);
    });

    // ── Tuyaux le long des murs ───────────────────────────
    g.lineStyle(3, tint, 0.15);
    g.lineBetween(TS + 8, TS, TS + 8, H - TS);
    g.lineStyle(2, tint, 0.08);
    g.lineBetween(TS + 14, TS, TS + 14, H - TS);

    // ── Néons plafond ─────────────────────────────────────
    [W * 0.3, W * 0.5, W * 0.7].forEach((lx) => {
      g.fillStyle(tint, 0.6);
      g.fillRect(lx - 24, TS - 4, 48, 4);
      g.fillStyle(tint, 0.1);
      g.fillEllipse(lx, TS + 10, 80, 30);
    });

    // ── Déco selon chapitre ───────────────────────────────
    this.addRoomDeco(g, W, H, tint, room.chapter, TS);

    // ── Porte retour ──────────────────────────────────────
    this.createBackDoor(g, tint, accentHex, H, TS);

    // ── Terminal ──────────────────────────────────────────
    this.createRoomTerminal(g, W * 0.65, H / 2, roomId, room.label, tint, accentHex, completed, TS);

    // ── Joueur ────────────────────────────────────────────
    this.createPlayer(TS * 2.5, H / 2 + 20);

    // ── HUD ───────────────────────────────────────────────
    this.add.text(W / 2, 10, `SALLE ${String(roomId).padStart(2, "0")} — ${room.label}`, {
      fontSize: "11px", color: accentHex, fontFamily: "monospace",
    }).setOrigin(0.5, 0).setDepth(10);

    if (completed) {
      this.add.text(W - 10, 10, "✓ COMPLÉTÉE", {
        fontSize: "9px", color: accentHex, fontFamily: "monospace",
      }).setOrigin(1, 0).setDepth(10);
    }

    this.add.text(10, H - 14, "[A/D] Déplacer  [E] Interagir  [Q] Retour couloir", {
      fontSize: "8px", color: "#0d1a22", fontFamily: "monospace",
    }).setDepth(10);
  }

  private addRoomDeco(g: Phaser.GameObjects.Graphics, W: number, H: number, tint: number, chapter: number, TS: number) {
    if (chapter === 1) {
      // Racks serveurs — rectangles avec LEDs
      [H * 0.3, H * 0.5, H * 0.7].forEach((sy, i) => {
        g.fillStyle(0x0a0e1a);
        g.fillRect(TS + 20, sy - 22, 64, 44);
        g.lineStyle(1, tint, 0.4);
        g.strokeRect(TS + 20, sy - 22, 64, 44);
        // Slots
        for (let si = 0; si < 3; si++) {
          g.fillStyle(0x050810);
          g.fillRect(TS + 24, sy - 14 + si * 14, 40, 10);
          g.lineStyle(1, tint, 0.2);
          g.strokeRect(TS + 24, sy - 14 + si * 14, 40, 10);
          // LED clignotante
          const led = this.add.graphics().setDepth(3);
          led.fillStyle(i % 2 === 0 ? tint : 0xff4400);
          led.fillCircle(TS + 68, sy - 9 + si * 14, 2);
          this.tweens.add({ targets: led, alpha: 0.2, duration: 600 + si * 200 + i * 300, yoyo: true, repeat: -1 });
        }
      });
    } else if (chapter === 2) {
      // Écrans holographiques
      [H * 0.32, H * 0.68].forEach((sy, i) => {
        g.fillStyle(0x000814, 0.9);
        g.fillRect(TS + 16, sy - 28, 72, 56);
        g.lineStyle(1, tint, 0.5);
        g.strokeRect(TS + 16, sy - 28, 72, 56);
        // Lignes de données
        for (let li = 0; li < 4; li++) {
          g.lineStyle(1, tint, 0.15 + li * 0.05);
          g.lineBetween(TS + 20, sy - 18 + li * 12, TS + 84, sy - 18 + li * 12);
        }
        // Scanline animée
        const scan = this.add.graphics().setDepth(3);
        scan.fillStyle(tint, 0.1);
        scan.fillRect(TS + 17, sy - 27, 70, 4);
        this.tweens.add({ targets: scan, y: 54, duration: 1200 + i * 400, repeat: -1, ease: "Linear" });
      });
    } else if (chapter === 3) {
      // Tuyaux industriels
      g.lineStyle(4, 0x334455, 0.8);
      g.lineBetween(TS + 20, H * 0.25, W * 0.4, H * 0.25);
      g.lineBetween(TS + 20, H * 0.75, W * 0.4, H * 0.75);
      g.lineStyle(2, tint, 0.2);
      g.lineBetween(TS + 20, H * 0.25, W * 0.4, H * 0.25);
      g.lineBetween(TS + 20, H * 0.75, W * 0.4, H * 0.75);
      // Raccords tuyaux
      [TS + 40, TS + 80, TS + 120].forEach((px) => {
        g.fillStyle(0x445566);
        g.fillCircle(px, H * 0.25, 5);
        g.fillCircle(px, H * 0.75, 5);
      });
      // Panneau warning
      g.fillStyle(0x221100);
      g.fillRect(W * 0.25, H / 2 - 22, 44, 44);
      g.lineStyle(2, 0xff8800, 0.7);
      g.strokeRect(W * 0.25, H / 2 - 22, 44, 44);
      g.fillStyle(0xff8800, 0.8);
      g.fillTriangle(W * 0.25 + 22, H / 2 - 14, W * 0.25 + 8, H / 2 + 14, W * 0.25 + 36, H / 2 + 14);
      g.fillStyle(0x221100);
      g.fillRect(W * 0.25 + 20, H / 2 - 6, 4, 14);
      g.fillRect(W * 0.25 + 20, H / 2 + 10, 4, 4);
    } else {
      // Core central pulsant
      const cx = W * 0.28;
      const cy = H / 2;
      // Cercles concentriques
      [40, 56, 72].forEach((r, i) => {
        g.lineStyle(1, tint, 0.3 - i * 0.08);
        g.strokeCircle(cx, cy, r);
      });
      g.fillStyle(tint, 0.08);
      g.fillCircle(cx, cy, 38);
      g.fillStyle(tint, 0.15);
      g.fillCircle(cx, cy, 20);
      g.fillStyle(tint, 0.4);
      g.fillCircle(cx, cy, 8);
      // Rotation simulée par tweens
      const ring = this.add.graphics().setDepth(3);
      ring.lineStyle(1, tint, 0.5);
      ring.strokeCircle(cx, cy, 48);
      ring.fillStyle(tint, 0.8);
      ring.fillCircle(cx + 48, cy, 4);
      this.tweens.add({ targets: ring, angle: 360, duration: 4000, repeat: -1, ease: "Linear" });
    }
  }

  private createBackDoor(g: Phaser.GameObjects.Graphics, tint: number, accentHex: string, H: number, TS: number) {
    const x = TS * 1.2;
    const y = H / 2;

    g.fillStyle(0x080c18);
    g.fillRect(x - 20, y - 38, 40, 76);
    g.lineStyle(2, tint, 0.6);
    g.strokeRect(x - 20, y - 38, 40, 76);
    g.lineStyle(1, tint, 0.2);
    g.lineBetween(x, y - 24, x, y + 36);
    g.fillStyle(tint, 0.5);
    g.fillCircle(x + 14, y, 4);

    this.add.text(x, y, "←", {
      fontSize: "18px", color: accentHex, fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    const label = this.add.text(x, y - 52, "[E] RETOUR", {
      fontSize: "8px", color: accentHex,
      fontFamily: "monospace", backgroundColor: "#00000099", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setVisible(false).setDepth(10);
    this.interactables.push({ x, y, w: 50, h: 80, roomId: 0, label });
  }

  private createRoomTerminal(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, levelId: number, label: string,
    tint: number, accentHex: string, completed: boolean, TS: number
  ) {
    // Socle
    g.fillStyle(0x060a14);
    g.fillRect(x - 44, y - 60, 88, 120);
    g.lineStyle(completed ? 2 : 1, tint, completed ? 0.8 : 0.4);
    g.strokeRect(x - 44, y - 60, 88, 120);

    // Écran
    g.fillStyle(completed ? 0x001a0a : 0x000814);
    g.fillRect(x - 34, y - 50, 68, 50);
    g.lineStyle(1, tint, 0.6);
    g.strokeRect(x - 34, y - 50, 68, 50);

    // Scanlines écran
    for (let sl = 0; sl < 5; sl++) {
      g.lineStyle(1, tint, 0.08);
      g.lineBetween(x - 33, y - 40 + sl * 9, x + 33, y - 40 + sl * 9);
    }

    // Clavier
    g.fillStyle(0x0a0e1a);
    g.fillRect(x - 32, y + 10, 64, 20);
    g.lineStyle(1, tint, 0.3);
    g.strokeRect(x - 32, y + 10, 64, 20);
    // Touches
    for (let ki = 0; ki < 6; ki++) {
      g.fillStyle(tint, 0.15);
      g.fillRect(x - 28 + ki * 10, y + 14, 8, 12);
    }

    // LED status
    g.fillStyle(completed ? 0x00ff44 : 0xff3300);
    g.fillCircle(x + 38, y - 56, 5);
    g.fillStyle(completed ? 0x00ff44 : 0xff3300, 0.2);
    g.fillCircle(x + 38, y - 56, 10);

    // Warning si non complété
    if (!completed) {
      g.fillStyle(0x221100);
      g.fillRect(x - 44, y - 56, 20, 20);
      g.lineStyle(1, 0xff8800, 0.6);
      g.strokeRect(x - 44, y - 56, 20, 20);
      g.fillStyle(0xff8800, 0.7);
      g.fillTriangle(x - 34, y - 51, x - 42, y - 38, x - 26, y - 38);
    }

    // Glow animé si non complété
    if (!completed) {
      const glow = this.add.graphics().setDepth(2);
      glow.lineStyle(1, tint, 0.3);
      glow.strokeRect(x - 44, y - 60, 88, 120);
      this.tweens.add({ targets: glow, alpha: 0.2, duration: 1200, yoyo: true, repeat: -1 });
    }

    // Texte écran
    this.add.text(x, y - 26, completed ? `${levelId}\n\nOK ✓` : `${levelId}\n\n>>>`, {
      fontSize: "10px", color: accentHex, fontFamily: "monospace", align: "center",
    }).setOrigin(0.5).setDepth(5);

    this.add.text(x, y + 44, label, {
      fontSize: "9px", color: accentHex, fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(5);

    // Zone interaction
    const lbl = this.add.text(x, y - 76, "[E] TERMINAL", {
      fontSize: "8px", color: accentHex,
      fontFamily: "monospace", backgroundColor: "#00000099", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setVisible(false).setDepth(10);
    this.interactables.push({ x, y, w: TS * 2.2, h: TS * 3.2, roomId: levelId * 100, label: lbl });
  }

  // ══════════════════════════════════════════════════════════
  // JOUEUR — plus grand et plus lisible
  // ══════════════════════════════════════════════════════════

  private createPlayer(x: number, y: number) {
    this.playerBody = this.physics.add.image(x, y, "__DEFAULT");
    this.playerBody.setVisible(false);
    this.playerBody.setCollideWorldBounds(true);
    (this.playerBody.body as Phaser.Physics.Arcade.Body).setSize(18, 28);
    this.playerSprite = this.add.graphics().setDepth(6);
    this.drawPlayer();
  }

  private drawPlayer(bob = 0) {
    const g = this.playerSprite;
    g.clear();
    const f = this.playerFacing === "left" ? -1 : 1;

    // Ombre
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, 18, 22, 6);

    // Jambes
    g.fillStyle(0x1a2e1a);
    g.fillRect(-7, 10, 6, 10);
    g.fillRect(1, 10, 6, 10);

    // Corps (combinaison)
    g.fillStyle(0x1a3322);
    g.fillRect(-9, -4, 18, 16);
    // Détails combinaison
    g.lineStyle(1, 0x00ff88, 0.3);
    g.lineBetween(-6, 0, -6, 10);
    g.fillStyle(0x00ff88, 0.4);
    g.fillRect(-2, 2, 4, 6);

    // Cou
    g.fillStyle(0x2a4433);
    g.fillRect(-3, -8 + bob, 6, 6);

    // Tête (casque)
    g.fillStyle(0x1a2e22);
    g.fillRect(-8, -20 + bob, 16, 14);
    // Visière
    g.fillStyle(0x003322, 0.9);
    g.fillRect(-6, -18 + bob, 12, 8);
    // Yeux (LEDs)
    g.fillStyle(0x00ff88);
    g.fillRect(f * -5, -15 + bob, 4, 3);
    g.fillRect(f * 1, -15 + bob, 4, 3);
    // Reflet visière
    g.fillStyle(0x00ffaa, 0.3);
    g.fillRect(-5, -17 + bob, 4, 2);
    // Antenne
    g.fillStyle(0x00ff88, 0.6);
    g.fillRect(f * 5, -22 + bob, 2, 5);

    // Bras
    g.fillStyle(0x1a3322);
    g.fillRect(f * -12, -2, 4, 10);
    g.fillRect(f * 8, -2, 4, 10);
  }

  // ══════════════════════════════════════════════════════════
  // CONTRÔLES
  // ══════════════════════════════════════════════════════════

  private setupKeys() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyQ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    if (this.mode === "room") {
      this.keyQ.on("down", () => this.exitRoom());
    }
  }

  // ══════════════════════════════════════════════════════════
  // UPDATE
  // ══════════════════════════════════════════════════════════

  update() {
    if (this.transitionActive || !this.playerBody) return;
    const body = this.playerBody.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    body.setVelocity(0);

    const left  = this.cursors.left.isDown  || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const up    = this.cursors.up.isDown    || this.keyW.isDown;
    const down  = this.cursors.down.isDown  || this.keyS.isDown;

    if (left)       { body.setVelocityX(-this.playerSpeed); this.playerFacing = "left"; }
    else if (right) { body.setVelocityX(this.playerSpeed);  this.playerFacing = "right"; }
    if (up)         body.setVelocityY(-this.playerSpeed);
    else if (down)  body.setVelocityY(this.playerSpeed);

    if ((left || right) && (up || down)) body.velocity.normalize().scale(this.playerSpeed);

    this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
    this.playerSprite.setScale(this.playerFacing === "left" ? -1 : 1, 1);

    if (left || right || up || down) {
      this.stepAnim++;
      this.drawPlayer(Math.sin(this.stepAnim * 0.28) * 2);
    }

    // Proximité
    this.nearRoom = null;
    this.interactables.forEach(({ x, y, w, h, roomId, label }) => {
      const near = Math.abs(this.playerBody.x - x) < w / 2 + 16
                && Math.abs(this.playerBody.y - y) < h / 2 + 16;
      label.setVisible(near);
      if (near) this.nearRoom = roomId;
    });

    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.nearRoom !== null) {
      this.handleInteract(this.nearRoom);
    }
  }

  // ══════════════════════════════════════════════════════════
  // INTERACTIONS
  // ══════════════════════════════════════════════════════════

  private handleInteract(id: number) {
    if (id === -1) {
      const done = this.completedLevels.size;
      this.game.events.emit(EVENTS.SHOW_DIALOGUE, {
        speaker: "GHOST",
        lines: [
          `${done}/15 salles compromises.`,
          done === 0 ? "Commence par la salle 01." : `Continue. Salle ${done + 1} t'attend.`,
          "Approche une porte et appuie sur [E] pour entrer.",
          done >= 15 ? "...mission terminée. Impressionnant." : "Ne te fais pas prendre.",
        ],
      });
    } else if (id === 0) {
      this.exitRoom();
    } else if (id > 0 && id < 100) {
      this.enterRoom(id);
    } else if (id >= 100) {
      this.game.events.emit(EVENTS.OPEN_TERMINAL, {
        levelId: Math.floor(id / 100),
        name: `SALLE_${String(Math.floor(id / 100)).padStart(2, "0")}`,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // TRANSITIONS
  // ══════════════════════════════════════════════════════════

  private enterRoom(roomId: number) {
    if (this.transitionActive) return;
    this.transitionActive = true;
    this.cameras.main.fade(250, 0, 0, 0, false, (_: unknown, p: number) => {
      if (p === 1) this.scene.restart({ completedLevels: Array.from(this.completedLevels), mode: "room", roomId });
    });
  }

  private exitRoom() {
    if (this.transitionActive) return;
    this.transitionActive = true;
    this.cameras.main.fade(250, 0, 0, 0, false, (_: unknown, p: number) => {
      if (p === 1) this.scene.restart({ completedLevels: Array.from(this.completedLevels), mode: "corridor" });
    });
  }

  public markLevelComplete(levelId: number) {
    this.completedLevels.add(levelId);
    this.time.delayedCall(700, () => {
      this.transitionActive = true;
      this.cameras.main.fade(350, 0, 180, 80, false, (_: unknown, p: number) => {
        if (p === 1) this.scene.restart({ completedLevels: Array.from(this.completedLevels), mode: "corridor" });
      });
    });
  }
}