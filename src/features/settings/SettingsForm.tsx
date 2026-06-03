"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/features/profile/actions";
import { BIOME_OPTIONS } from "@/features/biome/biome-options";
import type { BiomeType } from "@/features/biome/biome-logic";

export default function SettingsForm({
  profileId,
  initial,
}: {
  profileId: string;
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
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateSettings(profileId, {
        name,
        biomeType,
        voiceEnabled,
        hapticsEnabled,
      });
      setSaved(true);
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
        hint="Vibración guía en mindfulness"
        checked={hapticsEnabled}
        onChange={setHapticsEnabled}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-lg bg-emerald-500 px-5 py-2 font-medium text-black disabled:opacity-40"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
        {saved && <span className="text-sm text-emerald-300">✓ Guardado</span>}
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
