"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/features/profile/actions";
import { BIOME_OPTIONS } from "@/features/biome/biome-options";
import type { BiomeType } from "@/features/biome/biome-logic";

const STEPS = ["welcome", "name", "biome", "ready"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingForm({
  profileName,
}: {
  profileName: string;
}) {
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState(profileName);
  const [biome, setBiome] = useState<BiomeType>("forest");
  const [isPending, startTransition] = useTransition();

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function finish() {
    startTransition(async () => {
      await completeOnboarding(name, biome);
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-zinc-900 to-teal-950 text-white px-6">
      {/* Decorative radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Progress dots */}
        <div className="mb-10 flex justify-center gap-2">
          {STEPS.map((s) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all duration-500 ${
                s === step
                  ? "w-8 bg-emerald-400"
                  : STEPS.indexOf(s) < STEPS.indexOf(step)
                  ? "w-2 bg-emerald-500/60"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* ── Step 1: Welcome ─────────────────────────────── */}
        {step === "welcome" && (
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="text-7xl drop-shadow-xl select-none">🌿</div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Bienvenido al
                <br />
                <span className="text-emerald-400">Terrario Digital</span>
              </h1>
              <p className="mt-3 text-base text-white/60 leading-relaxed">
                Tus hábitos diarios darán vida a un ecosistema 3D único.
                <br />
                Vamos a personalizar tu espacio en tres pasos.
              </p>
            </div>
            <button
              onClick={next}
              className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-semibold text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-[1.02] transition-all"
            >
              Comenzar →
            </button>
          </div>
        )}

        {/* ── Step 2: Name ────────────────────────────────── */}
        {step === "name" && (
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold">¿Cómo te llamamos?</h2>
              <p className="mt-2 text-sm text-white/50">
                Este nombre aparecerá en tu terrario y en la comunidad.
              </p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">Tu nombre</span>
              <input
                id="onboarding-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Escribe tu nombre…"
                className="rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-emerald-400 transition"
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("welcome")}
                className="flex-1 rounded-2xl border border-white/15 py-3 text-sm text-white/60 hover:text-white hover:border-white/30 transition"
              >
                ← Atrás
              </button>
              <button
                onClick={next}
                disabled={!name.trim()}
                className="flex-[2] rounded-2xl bg-emerald-500 py-3 text-base font-semibold text-black hover:bg-emerald-400 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 transition-all"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Biome ────────────────────────────────── */}
        {step === "biome" && (
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Elige tu bioma</h2>
              <p className="mt-2 text-sm text-white/50">
                Define la estética de tu ecosistema. Puedes cambiarlo después.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {BIOME_OPTIONS.map((o) => (
                <button
                  key={o.type}
                  type="button"
                  onClick={() => setBiome(o.type)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                    biome === o.type
                      ? "border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/10"
                      : "border-white/10 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <span className="text-4xl">{o.emoji}</span>
                  <span>
                    <span className="block font-semibold">{o.label}</span>
                    <span className="block text-sm text-white/50">{o.desc}</span>
                  </span>
                  {biome === o.type && (
                    <span className="ml-auto text-emerald-400">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("name")}
                className="flex-1 rounded-2xl border border-white/15 py-3 text-sm text-white/60 hover:text-white hover:border-white/30 transition"
              >
                ← Atrás
              </button>
              <button
                onClick={next}
                className="flex-[2] rounded-2xl bg-emerald-500 py-3 text-base font-semibold text-black hover:bg-emerald-400 hover:scale-[1.02] transition-all"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Ready ────────────────────────────────── */}
        {step === "ready" && (
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="text-7xl drop-shadow-xl select-none">
              {BIOME_OPTIONS.find((o) => o.type === biome)?.emoji ?? "🌿"}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                ¡Todo listo,{" "}
                <span className="text-emerald-400">{name || "Explorador"}</span>!
              </h2>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">
                Tu <strong>{BIOME_OPTIONS.find((o) => o.type === biome)?.label}</strong>{" "}
                te espera. Cada hábito que completes lo hará crecer.
              </p>
            </div>

            <button
              onClick={finish}
              disabled={isPending}
              className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-semibold text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 transition-all"
            >
              {isPending ? "Creando tu terrario…" : "Entrar al terrario →"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
