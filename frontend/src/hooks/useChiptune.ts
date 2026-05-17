import { useRef, useCallback } from "react";
import * as Tone from "tone";

export function useChiptune() {
  const startedRef = useRef(false);
  const loopRef = useRef<Tone.Sequence | null>(null);
  const synthRef = useRef<Tone.Synth | null>(null);
  const bassSynthRef = useRef<Tone.Synth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    await Tone.start();
    Tone.getTransport().bpm.value = 140;

    // Reverb léger
    const reverb = new Tone.Reverb({ decay: 0.8, wet: 0.15 }).toDestination();
    reverbRef.current = reverb;

    // Synth lead chiptune
    const synth = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
      volume: -14,
    }).connect(reverb);
    synthRef.current = synth;

    // Basse
    const bass = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.1 },
      volume: -18,
    }).toDestination();
    bassSynthRef.current = bass;

    // Mélodie principale — style hacker chiptune
    const melody = [
      "E4", "G4", "A4", "C5",
      "A4", "G4", "E4", null,
      "D4", "F4", "G4", "A4",
      "G4", "F4", "D4", null,
      "E4", "G4", "B4", "D5",
      "B4", "G4", "E4", null,
      "C4", "E4", "G4", "B4",
      "G4", "E4", "C4", null,
    ];

    // Ligne de basse
    const bassLine = [
      "E2", null, "E2", null,
      "D2", null, "D2", null,
      "E2", null, "E2", null,
      "C2", null, "C2", null,
    ];

    let melodyIndex = 0;
    const melodyLoop = new Tone.Sequence(
      (time: string | number) => {
        const note = melody[melodyIndex % melody.length];
        if (note) synth.triggerAttackRelease(note, "16n", time);
        melodyIndex++;
      },
      melody,
      "16n"
    );

    let bassIndex = 0;
    const bassLoop = new Tone.Sequence(
      (time: string | number) => {
        const note = bassLine[bassIndex % bassLine.length];
        if (note) bass.triggerAttackRelease(note, "8n", time);
        bassIndex++;
      },
      bassLine,
      "8n"
    );

    loopRef.current = melodyLoop;
    melodyLoop.start(0);
    bassLoop.start(0);
    Tone.getTransport().start();
  }, []);

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    loopRef.current?.stop();
    synthRef.current?.dispose();
    bassSynthRef.current?.dispose();
    startedRef.current = false;
  }, []);

  const playClick = useCallback(async () => {
    await Tone.start();
    const click = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
      volume: -20,
    }).toDestination();
    click.triggerAttackRelease("C5", "32n");
    setTimeout(() => click.dispose(), 200);
  }, []);

  const playSuccess = useCallback(async () => {
    await Tone.start();
    const s = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
      volume: -16,
    }).toDestination();
    const notes = ["C5", "E5", "G5", "C6"];
    notes.forEach((note, i) => {
      setTimeout(() => s.triggerAttackRelease(note, "16n"), i * 80);
    });
    setTimeout(() => s.dispose(), 600);
  }, []);

  const playError = useCallback(async () => {
    await Tone.start();
    const s = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
      volume: -18,
    }).toDestination();
    s.triggerAttackRelease("A2", "8n");
    setTimeout(() => s.dispose(), 400);
  }, []);

  return { start, stop, playClick, playSuccess, playError };
}