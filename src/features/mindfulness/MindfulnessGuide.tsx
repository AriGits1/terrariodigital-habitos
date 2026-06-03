"use client";

import { useEffect, useRef, useState } from "react";
import { saveMindfulnessSession } from "./actions";

type Phase = "inhale" | "exhale";
const PHASE_MS = 4000;

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
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);
  const startRef = useRef<number>(0);

  // Drive the breathing cycle + haptic cues while running.
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();

    if (hapticsEnabled) pulse(60); // cue the first inhale

    const phaseTimer = setInterval(() => {
      setPhase((p) => {
        const next = p === "inhale" ? "exhale" : "inhale";
        if (hapticsEnabled) pulse(next === "inhale" ? 60 : [30, 40, 30]);
        return next;
      });
    }, PHASE_MS);

    const tick = setInterval(
      () => setElapsed((Date.now() - startRef.current) / 1000),
      200,
    );

    return () => {
      clearInterval(phaseTimer);
      clearInterval(tick);
    };
  }, [running, hapticsEnabled]);

  function start() {
    setSaved(false);
    setElapsed(0);
    setPhase("inhale");
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

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative flex h-72 w-72 items-center justify-center">
        <div
          className="absolute rounded-full bg-emerald-400/30"
          style={{
            width: "100%",
            height: "100%",
            transform: running
              ? phase === "inhale"
                ? "scale(1)"
                : "scale(0.5)"
              : "scale(0.7)",
            transition: `transform ${PHASE_MS}ms ease-in-out`,
          }}
        />
        <div className="z-10 text-center text-white">
          <p className="text-2xl font-light">
            {running ? (phase === "inhale" ? "Inhalá…" : "Exhalá…") : "Listo"}
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
          className="rounded-full bg-emerald-500 px-8 py-3 font-medium text-black"
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

      {saved && (
        <p className="text-sm text-emerald-300">
          ✓ Sesión registrada. Bien hecho.
        </p>
      )}
      {!hapticsEnabled && (
        <p className="text-xs text-white/40">
          Háptica desactivada — actívala en Configuración para sentir la guía.
        </p>
      )}
    </div>
  );
}
