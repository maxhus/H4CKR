import { useRef, useCallback } from "react";
import * as Tone from "tone";

// Synths réutilisables globaux — évite la création/destruction répétée
let clickSynth: Tone.Synth | null = null;
let keypressSynth: Tone.NoiseSynth | null = null;
let lastKeypressTime = 0;

export function useChiptune() {
  const startedRef = useRef(false);
  const melodyLoopRef = useRef<Tone.Sequence | null>(null);
  const chordLoopRef = useRef<Tone.Sequence | null>(null);
  const bassLoopRef = useRef<Tone.Sequence | null>(null);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    await Tone.start();
    Tone.getTransport().bpm.value = 62;

    const reverb = new Tone.Reverb({ decay: 7, wet: 0.6 }).toDestination();
    const delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.35, wet: 0.25 }).connect(reverb);
    const filter = new Tone.Filter({ type: "lowpass", frequency: 1800, rolloff: -12 }).connect(delay);
    const chorus = new Tone.Chorus({ frequency: 0.2, delayTime: 4, depth: 0.3, wet: 0.2 }).connect(filter);
    chorus.start();

    const lead = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.9, decay: 0.4, sustain: 0.5, release: 3 },
      volume: -20,
    }).connect(chorus);

    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 2.5, decay: 1, sustain: 0.8, release: 5 },
      volume: -26,
    }).connect(filter);

    const bass = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.7, release: 1.8 },
      volume: -24,
    }).connect(filter);

    const melody = [
      "A3", null, null, null, null, null, "B3", null,
      "C4", null, null, null, null, "B3", null, null,
      "E4", null, null, null, "D4", null, null, null,
      "C4", null, null, null, null, null, null, null,
      "A3", null, null, null, null, null, "C4", null,
      "E4", null, null, null, null, "D4", null, null,
      "E5", null, null, null, null, null, null, null,
    ];

    const chords = [
      ["A2", "C3", "E3", "G3"], null,
      ["F2", "A2", "C3", "E3"], null,
      ["C2", "E3", "G3", "B3"], null,
      ["G2", "B2", "D3", "F3"], null,
    ];

    const bassline = ["A1", null, "F1", null, "C2", null, "G1", null];

    let mi = 0;
    const melodyLoop = new Tone.Sequence((time) => {
      const note = melody[mi % melody.length];
      if (note) lead.triggerAttackRelease(note, "2n", time);
      mi++;
    }, melody, "4n");

    let ci = 0;
    const chordLoop = new Tone.Sequence((time) => {
      const chord = chords[ci % chords.length];
      if (chord) pad.triggerAttackRelease(chord, "1m", time);
      ci++;
    }, chords, "1m");

    let bi = 0;
    const bassLoop = new Tone.Sequence((time) => {
      const note = bassline[bi % bassline.length];
      if (note) bass.triggerAttackRelease(note, "1n", time);
      bi++;
    }, bassline, "1m");

    melodyLoopRef.current = melodyLoop;
    chordLoopRef.current = chordLoop;
    bassLoopRef.current = bassLoop;
    melodyLoop.start(0);
    chordLoop.start(0);
    bassLoop.start(0);
    Tone.getTransport().start();
  }, []);

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    melodyLoopRef.current?.stop();
    chordLoopRef.current?.stop();
    bassLoopRef.current?.stop();
    startedRef.current = false;
  }, []);

  // ─── UI SOUNDS ───────────────────────────────────────────────

  // Synth click réutilisable
  const playClick = useCallback(async () => {
    await Tone.start();
    if (!clickSynth) {
      clickSynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 },
        volume: -24,
      }).toDestination();
    }
    clickSynth.triggerAttackRelease("E5", "32n");
  }, []);

  // Keypress throttlé — max 1 son toutes les 80ms
  const playKeypress = useCallback(async () => {
    const now = Date.now();
    if (now - lastKeypressTime < 80) return;
    lastKeypressTime = now;
    await Tone.start();
    if (!keypressSynth) {
      keypressSynth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
        volume: -38,
      }).toDestination();
    }
    keypressSynth.triggerAttackRelease("32n");
  }, []);

  const playSuccess = useCallback(async () => {
    await Tone.start();
    const reverb = new Tone.Reverb({ decay: 2, wet: 0.4 }).toDestination();
    const s = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.4, sustain: 0.5, release: 1.5 },
      volume: -18,
    }).connect(reverb);
    s.triggerAttackRelease(["C4", "E4", "G4", "B4"], "2n");
    setTimeout(() => { s.dispose(); reverb.dispose(); }, 3000);
  }, []);

  const playError = useCallback(async () => {
    await Tone.start();
    const s = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 },
      volume: -22,
    }).toDestination();
    s.triggerAttackRelease("C3", "8n");
    setTimeout(() => s.dispose(), 800);
  }, []);

  // ─── AVATAR SOUNDS ───────────────────────────────────────────

  // Avatar parle — bips légers, espacés
  const playAvatarTalk = useCallback(async () => {
    await Tone.start();
    const s = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
      volume: -30,
    }).toDestination();
    // 2 bips seulement, plus espacés
    s.triggerAttackRelease("C5", "64n", Tone.now());
    s.triggerAttackRelease("E5", "64n", Tone.now() + 0.08);
    setTimeout(() => s.dispose(), 500);
  }, []);

  // Moquerie — glissando descendant
  const playAvatarMock = useCallback(async () => {
    await Tone.start();
    const s = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0, release: 0.12 },
      volume: -26,
    }).toDestination();
    s.triggerAttackRelease("F4", "16n", Tone.now());
    s.triggerAttackRelease("C4", "16n", Tone.now() + 0.12);
    setTimeout(() => s.dispose(), 600);
  }, []);

  // Surprise / victoire — accord montant avec reverb
  const playAvatarSurprise = useCallback(async () => {
    await Tone.start();
    const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.35 }).toDestination();
    const s = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.3, release: 0.8 },
      volume: -22,
    }).connect(reverb);
    const notes = ["C4", "E4", "G4", "C5"];
    notes.forEach((n, i) => s.triggerAttackRelease(n, "8n", Tone.now() + i * 0.1));
    setTimeout(() => { s.dispose(); reverb.dispose(); }, 1500);
  }, []);

  // Indice — ping double interrogatif
  const playAvatarHint = useCallback(async () => {
    await Tone.start();
    const s = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.2 },
      volume: -26,
    }).toDestination();
    s.triggerAttackRelease("A4", "8n", Tone.now());
    s.triggerAttackRelease("E5", "8n", Tone.now() + 0.18);
    setTimeout(() => s.dispose(), 800);
  }, []);

  // ACCESS DENIED — alarme courte non répétitive
  const playAccessDenied = useCallback(async () => {
    await Tone.start();
    const s = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0.1, release: 0.15 },
      volume: -20,
    }).toDestination();
    s.triggerAttackRelease("B2", "8n", Tone.now());
    s.triggerAttackRelease("G2", "8n", Tone.now() + 0.18);
    setTimeout(() => s.dispose(), 800);
  }, []);

  // ACCESS GRANTED — accord lumineux
  const playAccessGranted = useCallback(async () => {
    await Tone.start();
    const reverb = new Tone.Reverb({ decay: 2, wet: 0.5 }).toDestination();
    const s = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.4, release: 2 },
      volume: -18,
    }).connect(reverb);
    s.triggerAttackRelease(["E4", "G4", "B4", "E5"], "2n");
    setTimeout(() => { s.dispose(); reverb.dispose(); }, 3500);
  }, []);

  return {
    start, stop,
    playClick, playSuccess, playError, playKeypress,
    playAvatarTalk, playAvatarMock, playAvatarSurprise, playAvatarHint,
    playAccessDenied, playAccessGranted,
  };
}