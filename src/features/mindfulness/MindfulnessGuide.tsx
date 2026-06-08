"use client";

import { useEffect, useRef, useState } from "react";
import { saveMindfulnessSession } from "./actions";

type Phase = "inhale" | "hold" | "exhale";

interface ModeConfig {
  id: string;
  name: string;
  desc: string;
  sequence: { phase: Phase; durationMs: number; label: string }[];
}

const MODES: ModeConfig[] = [
  {
    id: "balance",
    name: "Equilibrio",
    desc: "Simétrica (4-4). Para centrarte rápido.",
    sequence: [
      { phase: "inhale", durationMs: 4000, label: "Inhala" },
      { phase: "exhale", durationMs: 4000, label: "Exhala" },
    ],
  },
  {
    id: "relax",
    name: "Relajación",
    desc: "Técnica 4-7-8. Ideal para dormir o bajar la ansiedad.",
    sequence: [
      { phase: "inhale", durationMs: 4000, label: "Inhala" },
      { phase: "hold", durationMs: 7000, label: "Sostén" },
      { phase: "exhale", durationMs: 8000, label: "Exhala" },
    ],
  },
  {
    id: "focus",
    name: "Enfoque",
    desc: "Respiración de Caja. Ideal para concentración extrema.",
    sequence: [
      { phase: "inhale", durationMs: 4000, label: "Inhala" },
      { phase: "hold", durationMs: 4000, label: "Sostén" },
      { phase: "exhale", durationMs: 4000, label: "Exhala" },
      { phase: "hold", durationMs: 4000, label: "Sostén" },
    ],
  },
];

/** Vibrates if the device supports haptics and the user enabled them. */
function pulse(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function MindfulnessGuide({
  profileId,
  hapticsEnabled,
}: {
  profileId: string;
  hapticsEnabled: boolean;
}) {
  const [modeId, setModeId] = useState("balance");
  const mode = MODES.find((m) => m.id === modeId)!;

  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = mode.sequence[stepIndex];
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);
  const startRef = useRef<number>(0);

  // Drive the breathing cycle
  useEffect(() => {
    if (!running) return;
    
    if (hapticsEnabled) {
      if (currentStep.phase === "inhale") pulse(60);
      else if (currentStep.phase === "exhale") pulse([30, 40, 30]);
      else pulse(20);
    }

    const timer = setTimeout(() => {
      setStepIndex((s) => (s + 1) % mode.sequence.length);
    }, currentStep.durationMs);

    return () => clearTimeout(timer);
  }, [running, stepIndex, mode, hapticsEnabled]);

  // Drive the clock
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed * 1000;
    const tick = setInterval(
      () => setElapsed((Date.now() - startRef.current) / 1000),
      200
    );
    return () => clearInterval(tick);
  }, [running]);

  function start() {
    setSaved(false);
    setElapsed(0);
    setStepIndex(0);
    setRunning(true);
  }

  async function finish() {
    setRunning(false);
    pulse(0); // stop any ongoing vibration
    if (elapsed >= 5) {
      await saveMindfulnessSession(profileId, elapsed);
      setSaved(true);
    }
  }

  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60)
    .toString()
    .padStart(2, "0");

  const targetScale = !running
    ? 0.7
    : currentStep.phase === "inhale"
    ? 1
    : currentStep.phase === "exhale"
    ? 0.5
    : stepIndex === 1
    ? 1
    : 0.5;

  return (
    <div className="flex w-full flex-col items-center gap-8 max-w-md mx-auto">
      {!running && (
        <div className="flex flex-col gap-3 w-full">
          <p className="text-sm font-semibold text-white/70">Selecciona tu ritmo:</p>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setModeId(m.id)}
              className={`flex flex-col items-start rounded-xl border p-4 transition-all ${
                modeId === m.id
                  ? "border-emerald-400 bg-emerald-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <span className="font-medium">{m.name}</span>
              <span className="text-xs text-white/60 text-left mt-1">{m.desc}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative flex h-72 w-72 items-center justify-center">
        <div
          className="absolute rounded-full bg-emerald-400/30"
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${targetScale})`,
            transition: `transform ${currentStep.durationMs}ms ${
              currentStep.phase === "hold" ? "linear" : "ease-in-out"
            }`,
          }}
        />
        <div className="z-10 text-center text-white">
          <p className="text-2xl font-light">
            {running ? currentStep.label : "Listo"}
          </p>
          <p className="mt-2 text-sm text-white/50">
            {mins}:{secs}
          </p>
        </div>
      </div>

      {!running ? (
        <button
          type="button"
          onClick={start}
          className="rounded-full bg-emerald-500 px-10 py-3.5 font-medium text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-105 transition-all"
        >
          Comenzar
        </button>
      ) : (
        <button
          type="button"
          onClick={finish}
          className="rounded-full bg-white/15 px-8 py-3 font-medium text-white hover:bg-white/25"
        >
          Terminar
        </button>
      )}

      {saved && !running && (
        <p className="text-sm text-emerald-300">
          ✓ Sesión registrada. Bien hecho.
        </p>
      )}
      {!hapticsEnabled && (
        <p className="text-xs text-white/40 text-center">
          Háptica desactivada — actívala en Ajustes para sentir la guía sin mirar la pantalla.
        </p>
      )}
    </div>
  );
}
