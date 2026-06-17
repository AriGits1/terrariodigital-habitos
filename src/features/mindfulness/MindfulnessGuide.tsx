"use client";

import { useEffect, useRef, useState } from "react";
import { saveMindfulnessSession } from "./actions";
import { Settings2, ChevronRight } from "lucide-react";

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
  const [panelOpen, setPanelOpen] = useState(false);
  const startRef = useRef<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [panelOpen]);

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
    setPanelOpen(false);
  }

  async function finish() {
    setRunning(false);
    pulse(0);
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
    <div className="relative flex w-full flex-col items-center gap-8 max-w-md mx-auto">
      {/* Floating rhythm selector toggle */}
      <div ref={panelRef} className="absolute right-0 top-0 z-20">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          disabled={running}
          title="Cambiar ritmo de respiración"
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            running
              ? "bg-white/5 text-white/30 cursor-not-allowed"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {mode.name}
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              panelOpen ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Slide-down panel */}
        <div
          className={`absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-xl transition-all duration-200 origin-top-right ${
            panelOpen
              ? "scale-100 opacity-100 pointer-events-auto"
              : "scale-95 opacity-0 pointer-events-none"
          }`}
        >
          <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-white/40">
            Ritmo de respiración
          </p>
          <div className="flex flex-col gap-1 p-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setModeId(m.id);
                  setPanelOpen(false);
                  setStepIndex(0);
                }}
                className={`flex flex-col items-start rounded-xl px-3 py-2.5 text-left transition-all ${
                  modeId === m.id
                    ? "bg-emerald-500/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-sm">
                  {modeId === m.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                  {m.name}
                </span>
                <span className="mt-0.5 text-xs text-white/50 pl-3.5">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Breathing animation — always the star */}
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
