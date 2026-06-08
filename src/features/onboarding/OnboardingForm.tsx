"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/features/profile/actions";
import { BIOME_OPTIONS } from "@/features/biome/biome-options";
import type { BiomeType } from "@/features/biome/biome-logic";

export default function OnboardingForm() {
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState("");
  const [biome, setBiome] = useState<BiomeType>("forest");
  const [isPending, startTransition] = useTransition();

  function finish() {
    startTransition(() => completeOnboarding(name, biome));
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white/5 p-8 text-white backdrop-blur-md">
      {step === 0 ? (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-semibold">🌿 Bienvenido</h1>
            <p className="mt-1 text-sm text-white/60">
              Tu terrario crece con tus hábitos. ¿Cómo te llamas?
            </p>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(1)}
            placeholder="Tu nombre"
            autoFocus
            className="rounded-xl bg-white/10 px-4 py-3 text-lg outline-none placeholder:text-white/30 focus:bg-white/20"
          />
          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={!name.trim()}
            className="rounded-xl bg-emerald-500 px-4 py-3 font-medium text-black disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-semibold">Elige tu bioma</h1>
            <p className="mt-1 text-sm text-white/60">
              Puedes cambiarlo después; además se adapta a tu ánimo.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {BIOME_OPTIONS.map((o) => (
              <button
                key={o.type}
                type="button"
                onClick={() => setBiome(o.type)}
                className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                  biome === o.type
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <span className="text-3xl">{o.emoji}</span>
                <span>
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-sm text-white/50">{o.desc}</span>
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            disabled={isPending}
            className="rounded-xl bg-emerald-500 px-4 py-3 font-medium text-black disabled:opacity-40"
          >
            {isPending ? "Creando tu terrario…" : "Entrar al terrario"}
          </button>
        </div>
      )}
    </div>
  );
}
