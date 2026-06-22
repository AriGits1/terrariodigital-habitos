"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/features/profile/actions";
import { BIOME_OPTIONS } from "@/features/biome/biome-options";
import type { BiomeType } from "@/features/biome/biome-logic";

export default function SettingsForm({
  initial,
}: {
  initial: {
    name: string;
    biomeType: BiomeType;
    voiceEnabled: boolean;
    hapticsEnabled: boolean;
  };
}) {
  const [name, setName] = useState(initial.name);
  const [biomeType, setBiomeType] = useState<BiomeType>(initial.biomeType);
  const [voiceEnabled, setVoiceEnabled] = useState(initial.voiceEnabled);
  const [hapticsEnabled, setHapticsEnabled] = useState(initial.hapticsEnabled);
  const [showToast, setShowToast] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateSettings({
        name,
        biomeType,
        voiceEnabled,
        hapticsEnabled,
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white/5 p-6 text-white">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-white/70">Nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg bg-white/10 px-3 py-2 outline-none focus:bg-white/20"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-white/70">Bioma preferido</span>
        <div className="flex gap-2">
          {BIOME_OPTIONS.map((o) => (
            <button
              key={o.type}
              type="button"
              onClick={() => setBiomeType(o.type)}
              className={`flex-1 rounded-xl border-2 p-3 text-center transition-colors ${
                biomeType === o.type
                  ? "border-emerald-400 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <span className="block text-2xl">{o.emoji}</span>
              <span className="text-xs text-white/60">{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Toggle
        label="Diario por voz"
        hint="Entrada multimodal con micrófono"
        checked={voiceEnabled}
        onChange={setVoiceEnabled}
      />
      <Toggle
        label="Retroalimentación háptica"
        hint="Vibración guía en respiración"
        checked={hapticsEnabled}
        onChange={setHapticsEnabled}
      />

      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-emerald-500 px-8 py-2.5 font-medium text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
        >
          Guardar
        </button>
      </div>

      <div 
        className={`fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-black shadow-xl transition-all duration-500 ease-in-out ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        Configuración guardada
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between text-left"
    >
      <span>
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-white/40">{hint}</span>
      </span>
      <span
        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
          checked ? "bg-emerald-500" : "bg-white/20"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}
