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
  { floor: "floor_cyan_a",  floor2: "floor_cyan_b",  wall: "wall_a",     tint: 0x00eeff, name: "ENCODAGE"    },
  { floor: "floor_violet",  floor2: "floor_stone",   wall: "wall_b",     tint: 0xaa44ff, name: "LOGIQUE"     },
  { floor: "floor_stone",   floor2: "floor_dark",    wall: "wall_frame", tint: 0xff4488, name: "INFILTRATION" },
  { floor: "floor_cyan_b",  floor2: "floor_cyan_a",  wall: "wall_a",     tint: 0x88ff00, name: "BREACH"      },
];

type SceneMode = "corridor" | "room";

export class GameScene extends Phaser.Scene {
  private mode: SceneMode = "corridor";
  private currentRoomId = 0;

  // Joueur — sprite + corps physique séparés
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
    const tiles = [
      "floor_cyan_a", "floor_cyan_b", "floor_violet", "floor_orange",
      "floor_dark", "floor_stone", "wall_a", "wall_b", "wall_frame",
      "pipe_corner", "pipe_h", "console_a", "console_b",
      "screen_cyan", "screen_blue", "warning",
    ];
    tiles.forEach((t) => this.load.image(t, `/tiles/${t}.png`));
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
    const TS = 48; // tile size affiché
    const CW = 200 + ROOMS.length * 120;

    this.cameras.main.setBounds(0, 0, CW, H);
    this.cameras.main.setBackgroundColor("#060810");

    // Sol
    for (let x = 0; x < CW; x += TS) {
      const key = x % (TS * 2) === 0 ? "floor_dark" : "floor_stone";
      this.add.image(x + TS / 2, H - TS * 1.5, key).setDisplaySize(TS, TS).setAlpha(0.6);
      this.add.image(x + TS / 2, H - TS * 0.5, key).setDisplaySize(TS, TS).setAlpha(0.3);
    }

    // Plafond
    for (let x = 0; x < CW; x += TS) {
      this.add.image(x + TS / 2, TS * 0.5, "wall_a").setDisplaySize(TS, TS).setAlpha(0.5);
      this.add.image(x + TS / 2, TS * 1.5, "wall_b").setDisplaySize(TS, TS).setAlpha(0.3);
    }

    // Lignes de perspective
    const g = this.add.graphics();
    g.lineStyle(1, 0x223344, 0.5);
    g.lineBetween(0, TS * 2, CW, TS * 2);
    g.lineBetween(0, H - TS * 2, CW, H - TS * 2);
    for (let x = 0; x < CW; x += TS * 2) {
      g.lineStyle(1, 0x112233, 0.3);
      g.lineBetween(x, TS * 2, x, H - TS * 2);
    }

    // Lumières plafond
    for (let lx = 120; lx < CW; lx += 120) {
      this.add.image(lx, TS * 2.5, "screen_cyan")
        .setDisplaySize(32, 12).setAlpha(0.7).setTint(0x00ccff);
      const halo = this.add.graphics();
      halo.fillStyle(0x003366, 0.12);
      halo.fillEllipse(lx, TS * 2.5 + 16, 70, 30);
    }

    // Portes
    ROOMS.forEach((room, i) => {
      this.createCorridorDoor(180 + i * 120, H / 2, room);
    });

    // NPC
    this.createCorridorNPC(100, H / 2 - 10);

    // Panneau
    this.add.text(50, H / 2 + 70, "NEXUS CORP\nSERVER BLOCK", {
      fontSize: "9px", color: "#334444", fontFamily: "monospace", align: "center",
    }).setOrigin(0.5);

    // Joueur
    const startX = this.completedLevels.size > 0
      ? Math.min(this.completedLevels.size, 14) * 120 + 140
      : 140;
    this.createPlayer(startX, H / 2 - 10);
    this.cameras.main.startFollow(this.playerBody, true, 0.08, 0.08);

    // HUD
    this.add.text(10, 8,
      `NEXUS CORP — SERVER BLOCK   ${this.completedLevels.size}/15`,
      { fontSize: "10px", color: "#224433", fontFamily: "monospace" }
    ).setScrollFactor(0).setDepth(20);

    this.add.text(10, H - 16,
      "[A/D ou ←→] Déplacer   [E] Entrer dans la salle",
      { fontSize: "9px", color: "#112222", fontFamily: "monospace" }
    ).setScrollFactor(0).setDepth(20);
  }

  private createCorridorDoor(x: number, y: number, room: typeof ROOMS[0]) {
    const theme = THEMES[room.chapter - 1];
    const completed = this.completedLevels.has(room.id);
    const unlocked = room.id === 1 || this.completedLevels.has(room.id - 1) || completed;
    const accentHex = `#${theme.tint.toString(16).padStart(6, "0")}`;

    // Fond mural
    this.add.image(x, y, "wall_frame")
      .setDisplaySize(52, 90).setAlpha(unlocked ? 0.7 : 0.2).setTint(unlocked ? theme.tint : 0x333333);

    // Icône statut
    if (completed) {
      this.add.image(x, y, "screen_cyan")
        .setDisplaySize(40, 40).setTint(theme.tint).setAlpha(0.8);
    } else if (unlocked) {
      this.add.image(x, y, "console_b")
        .setDisplaySize(40, 40).setTint(0x445566).setAlpha(0.6);
    }

    // Numéro
    this.add.text(x, y - 28, String(room.id).padStart(2, "0"), {
      fontSize: "9px", color: accentHex, fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(3).setAlpha(unlocked ? 1 : 0.3);

    // Label type
    this.add.text(x, y + 38, room.label, {
      fontSize: "8px",
      color: completed ? accentHex : "#334444",
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(3);

    // LED
    const ledG = this.add.graphics().setDepth(4);
    ledG.fillStyle(completed ? 0x00ff44 : unlocked ? 0xff8800 : 0xff2200);
    ledG.fillCircle(x + 20, y - 36, 4);
    if (completed || unlocked) {
      this.tweens.add({ targets: ledG, alpha: 0.3, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1 });
    }

    // ✓
    if (completed) {
      this.add.text(x, y + 10, "✓", {
        fontSize: "16px", color: accentHex, fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(4).setAlpha(0.8);
    }

    // Clignotement prochain niveau
    if (room.id === this.completedLevels.size + 1) {
      const glow = this.add.graphics().setDepth(1);
      glow.fillStyle(theme.tint, 0.2);
      glow.fillRect(x - 30, y - 50, 60, 100);
      this.tweens.add({ targets: glow, alpha: 0, duration: 600, yoyo: true, repeat: -1 });
    }

    // Zone interaction
    if (unlocked) {
      const label = this.add.text(x, y - 58, "[E] ENTRER", {
        fontSize: "8px", color: accentHex,
        fontFamily: "monospace", backgroundColor: "#000000cc",
        padding: { x: 3, y: 2 },
      }).setOrigin(0.5).setVisible(false).setDepth(10);

      this.interactables.push({ x, y, w: 55, h: 100, roomId: room.id, label });
    }
  }

  private createCorridorNPC(x: number, y: number) {
    // Sprite NPC avec graphics
    const g = this.add.graphics().setDepth(4);
    // Corps
    g.fillStyle(0x111133); g.fillRect(x - 10, y - 2, 20, 18);
    // Tête
    g.fillStyle(0x222244); g.fillRect(x - 8, y - 18, 16, 14);
    // Capuche
    g.fillStyle(0x0a0a22); g.fillRect(x - 12, y - 24, 24, 18);
    // Masque
    g.fillStyle(0xffffff, 0.9); g.fillRect(x - 6, y - 17, 12, 10);
    // Yeux
    g.fillStyle(0x000000); g.fillRect(x - 5, y - 16, 4, 4); g.fillRect(x + 1, y - 16, 4, 4);

    this.add.text(x, y + 24, "GHOST", {
      fontSize: "8px", color: "#4444aa", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    this.tweens.add({ targets: g, y: "-=4", duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const label = this.add.text(x, y - 40, "[E] Parler", {
      fontSize: "8px", color: "#4444ff",
      fontFamily: "monospace", backgroundColor: "#000000cc", padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    this.interactables.push({ x, y, w: 60, h: 60, roomId: -1, label });
  }

  // ══════════════════════════════════════════════════════════
  // SALLE
  // ══════════════════════════════════════════════════════════

  private createRoom(roomId: number) {
    const W = this.scale.width;
    const H = this.scale.height;
    const TS = 48;
    const room = ROOMS.find((r) => r.id === roomId)!;
    const theme = THEMES[room.chapter - 1];
    const completed = this.completedLevels.has(roomId);
    const accentHex = `#${theme.tint.toString(16).padStart(6, "0")}`;

    this.cameras.main.setBackgroundColor("#050508");

    // Sol tuilé en damier
    for (let ty = TS; ty < H - TS; ty += TS) {
      for (let tx = TS; tx < W - TS; tx += TS) {
        const alt = ((tx / TS) + (ty / TS)) % 2 === 0;
        const key = alt ? theme.floor : theme.floor2;
        this.add.image(tx + TS / 2, ty + TS / 2, key)
          .setDisplaySize(TS, TS).setAlpha(0.65);
      }
    }

    // Murs haut/bas
    for (let tx = 0; tx < W; tx += TS) {
      this.add.image(tx + TS / 2, TS / 2, theme.wall)
        .setDisplaySize(TS, TS).setTint(theme.tint).setAlpha(0.7);
      this.add.image(tx + TS / 2, H - TS / 2, theme.wall)
        .setDisplaySize(TS, TS).setTint(theme.tint).setAlpha(0.7);
    }
    // Murs gauche/droit
    for (let ty = TS; ty < H - TS; ty += TS) {
      this.add.image(TS / 2, ty + TS / 2, theme.wall)
        .setDisplaySize(TS, TS).setTint(theme.tint).setAlpha(0.7);
      this.add.image(W - TS / 2, ty + TS / 2, theme.wall)
        .setDisplaySize(TS, TS).setTint(theme.tint).setAlpha(0.7);
    }

    // Coins avec pipe
    [[TS, TS], [W - TS, TS], [TS, H - TS], [W - TS, H - TS]].forEach(([cx, cy]) => {
      this.add.image(cx, cy, "pipe_corner")
        .setDisplaySize(TS, TS).setTint(theme.tint).setAlpha(0.8);
    });

    // Bordure lumineuse intérieure
    const borderG = this.add.graphics();
    borderG.lineStyle(1, theme.tint, 0.3);
    borderG.strokeRect(TS, TS, W - TS * 2, H - TS * 2);

    // Déco selon chapitre
    this.addRoomDeco(W, H, theme, room.chapter, TS);

    // Porte retour
    this.createBackDoor(theme, H, TS, accentHex);

    // Terminal
    this.createRoomTerminal(W * 0.65, H / 2, roomId, room.label, theme, completed, TS, accentHex);

    // Joueur (entre par la gauche)
    this.createPlayer(TS * 2.5, H / 2);

    // HUD
    this.add.text(W / 2, 8, `SALLE ${String(roomId).padStart(2, "0")} — ${room.label}`, {
      fontSize: "10px", color: accentHex, fontFamily: "monospace",
    }).setOrigin(0.5, 0).setDepth(10);

    if (completed) {
      this.add.text(W - 8, 8, "✓ COMPLÉTÉE", {
        fontSize: "9px", color: accentHex, fontFamily: "monospace",
      }).setOrigin(1, 0).setDepth(10);
    }

    this.add.text(8, H - 14, "[A/D] Déplacer  [E] Interagir  [Q] Retour couloir", {
      fontSize: "8px", color: "#112222", fontFamily: "monospace",
    }).setDepth(10);
  }

  private addRoomDeco(W: number, H: number, theme: typeof THEMES[0], chapter: number, TS: number) {
    if (chapter === 1) {
      // Racks serveurs à gauche
      [H / 3, H / 2, 2 * H / 3].forEach((sy) => {
        this.add.image(TS * 2.5, sy, "console_a")
          .setDisplaySize(TS * 1.2, TS * 1.2).setTint(theme.tint).setAlpha(0.5).setDepth(2);
        const led = this.add.graphics().setDepth(3);
        led.fillStyle(theme.tint, 0.8);
        led.fillCircle(TS * 2.5 + 20, sy - 20, 3);
        this.tweens.add({ targets: led, alpha: 0.2, duration: 700 + Math.random() * 500, yoyo: true, repeat: -1 });
      });
    } else if (chapter === 2) {
      // Écrans
      [H / 3, 2 * H / 3].forEach((sy, i) => {
        const sc = this.add.image(TS * 2.5 + i * TS * 0.5, sy, "screen_cyan")
          .setDisplaySize(TS * 1.5, TS * 1.2).setTint(theme.tint).setAlpha(0.6).setDepth(2);
        this.tweens.add({ targets: sc, alpha: 0.3, duration: 600 + i * 200, yoyo: true, repeat: -1 });
      });
    } else if (chapter === 3) {
      // Tuyaux
      for (let px = TS * 1.5; px < W * 0.45; px += TS) {
        this.add.image(px, H * 0.3, "pipe_h")
          .setDisplaySize(TS, TS * 0.6).setTint(theme.tint).setAlpha(0.4).setDepth(2);
        this.add.image(px, H * 0.7, "pipe_h")
          .setDisplaySize(TS, TS * 0.6).setTint(theme.tint).setAlpha(0.4).setDepth(2);
      }
      this.add.image(W * 0.3, H / 2, "warning")
        .setDisplaySize(TS * 1.5, TS * 1.5).setTint(theme.tint).setAlpha(0.4).setDepth(2);
    } else {
      // Core
      const core = this.add.image(W * 0.25, H / 2, "screen_cyan")
        .setDisplaySize(TS * 2.5, TS * 2.5).setTint(theme.tint).setAlpha(0.5).setDepth(2);
      this.tweens.add({ targets: core, scaleX: core.scaleX * 1.1, scaleY: core.scaleY * 1.1, alpha: 0.2, duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.add.image(W * 0.25, H / 2, "console_b")
        .setDisplaySize(TS, TS).setTint(theme.tint).setAlpha(0.7).setDepth(3);
    }
  }

  private createBackDoor(theme: typeof THEMES[0], H: number, TS: number, accentHex: string) {
    const x = TS * 1.2;
    const y = H / 2;

    this.add.image(x, y, "wall_frame")
      .setDisplaySize(TS * 0.8, TS * 1.6).setTint(theme.tint).setAlpha(0.7).setDepth(3);
    this.add.text(x, y, "←", {
      fontSize: "16px", color: accentHex, fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    const label = this.add.text(x, y - 50, "[E] RETOUR", {
      fontSize: "8px", color: accentHex,
      fontFamily: "monospace", backgroundColor: "#000000cc", padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    this.interactables.push({ x, y, w: 50, h: 80, roomId: 0, label });
  }

  private createRoomTerminal(
    x: number, y: number, levelId: number, label: string,
    theme: typeof THEMES[0], completed: boolean, TS: number, accentHex: string
  ) {
    // Corps terminal
    this.add.image(x, y, "console_a")
      .setDisplaySize(TS * 2, TS * 2.5).setTint(theme.tint).setAlpha(completed ? 0.9 : 0.5).setDepth(2);

    // Écran
    const screenKey = completed ? "screen_cyan" : "screen_blue";
    const screen = this.add.image(x, y - TS * 0.4, screenKey)
      .setDisplaySize(TS * 1.4, TS).setTint(theme.tint).setAlpha(0.9).setDepth(3);
    if (!completed) {
      this.tweens.add({ targets: screen, alpha: 0.4, duration: 1000, yoyo: true, repeat: -1 });
    }

    // Clavier
    this.add.image(x, y + TS * 0.8, "pipe_h")
      .setDisplaySize(TS * 1.6, TS * 0.4).setTint(0x333333).setDepth(3);

    // LED
    const ledG = this.add.graphics().setDepth(4);
    ledG.fillStyle(completed ? 0x00ff00 : 0xff3300);
    ledG.fillCircle(x + TS * 0.9, y - TS * 1.1, 5);
    this.tweens.add({ targets: ledG, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    // Warning si non complété
    if (!completed) {
      this.add.image(x - TS * 0.9, y - TS * 1.1, "warning")
        .setDisplaySize(TS * 0.5, TS * 0.5).setTint(0xff8800).setAlpha(0.7).setDepth(4);
    }

    // Texte
    this.add.text(x, y - TS * 0.2, completed ? `${levelId}\nOK ✓` : `${levelId}\n>>>`, {
      fontSize: "10px", color: accentHex, fontFamily: "monospace", align: "center",
    }).setOrigin(0.5).setDepth(5);

    this.add.text(x, y + TS * 1.2, label, {
      fontSize: "9px", color: accentHex, fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(5);

    // Zone interaction
    const lbl = this.add.text(x, y - TS * 1.6, "[E] TERMINAL", {
      fontSize: "8px", color: accentHex,
      fontFamily: "monospace", backgroundColor: "#000000cc", padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    this.interactables.push({ x, y, w: TS * 2, h: TS * 3, roomId: levelId * 100, label: lbl });
  }

  // ══════════════════════════════════════════════════════════
  // JOUEUR — corps physique séparé du visuel
  // ══════════════════════════════════════════════════════════

  private createPlayer(x: number, y: number) {
    // Corps physique — rectangle séparé du visuel
    const rect = this.add.rectangle(x, y, 16, 22, 0x00ff00, 0);
    this.physics.add.existing(rect);
    this.playerBody = rect as unknown as Phaser.Physics.Arcade.Image;
    const body = this.playerBody.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    // Sprite visuel
    this.playerSprite = this.add.graphics().setDepth(6);
    this.drawPlayer();
  }

  private drawPlayer(bobOffset = 0) {
    const g = this.playerSprite;
    g.clear();
    const flip = this.playerFacing === "left" ? -1 : 1;

    // Corps
    g.fillStyle(0x224422); g.fillRect(-8, -2, 16, 14);
    // Tête
    g.fillStyle(0x336633); g.fillRect(-6, -14 + bobOffset, 12, 12);
    // Yeux
    g.fillStyle(0x00ff44);
    g.fillRect(flip * -4, -11 + bobOffset, 3, 3);
    g.fillRect(flip * 1, -11 + bobOffset, 3, 3);
    // Jambes
    g.fillStyle(0x112211);
    g.fillRect(-6, 12, 5, 8);
    g.fillRect(1, 12, 5, 8);
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
    body.setVelocity(0);
    if (!body) return;
    
    const left  = this.cursors.left.isDown  || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const up    = this.cursors.up.isDown    || this.keyW.isDown;
    const down  = this.cursors.down.isDown  || this.keyS.isDown;

    if (left)       { body.setVelocityX(-this.playerSpeed); this.playerFacing = "left"; }
    else if (right) { body.setVelocityX(this.playerSpeed);  this.playerFacing = "right"; }
    if (up)         body.setVelocityY(-this.playerSpeed);
    else if (down)  body.setVelocityY(this.playerSpeed);

    if ((left || right) && (up || down)) body.velocity.normalize().scale(this.playerSpeed);

    // Sprite suit le corps
    this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
    this.playerSprite.setScale(this.playerFacing === "left" ? -1 : 1, 1);

    // Animation marche
    const moving = left || right || up || down;
    if (moving) {
      this.stepAnim++;
      const bob = Math.sin(this.stepAnim * 0.3) * 1.5;
      this.drawPlayer(bob);
    }

    // Proximité interactables
    this.nearRoom = null;
    this.interactables.forEach(({ x, y, w, h, roomId, label }) => {
      const px = this.playerBody.x;
      const py = this.playerBody.y;
      const near = Math.abs(px - x) < w / 2 + 20 && Math.abs(py - y) < h / 2 + 20;
      label.setVisible(near);
      if (near) this.nearRoom = roomId;
    });

    // Interaction [E]
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
      const levelId = Math.floor(id / 100);
      this.game.events.emit(EVENTS.OPEN_TERMINAL, {
        levelId,
        name: `SALLE_${String(levelId).padStart(2, "0")}`,
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
      if (p === 1) this.scene.restart({
        completedLevels: Array.from(this.completedLevels),
        mode: "room", roomId,
      });
    });
  }

  private exitRoom() {
    if (this.transitionActive) return;
    this.transitionActive = true;
    this.cameras.main.fade(250, 0, 0, 0, false, (_: unknown, p: number) => {
      if (p === 1) this.scene.restart({
        completedLevels: Array.from(this.completedLevels),
        mode: "corridor",
      });
    });
  }

  public markLevelComplete(levelId: number) {
    this.completedLevels.add(levelId);
    this.time.delayedCall(700, () => {
      this.transitionActive = true;
      this.cameras.main.fade(350, 0, 180, 80, false, (_: unknown, p: number) => {
        if (p === 1) this.scene.restart({
          completedLevels: Array.from(this.completedLevels),
          mode: "corridor",
        });
      });
    });
  }
}