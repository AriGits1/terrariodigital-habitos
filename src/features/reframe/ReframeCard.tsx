"use client";

import { useState, useTransition } from "react";
import { reframeThought } from "./actions";

export default function ReframeCard() {
  const [thought, setThought] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!thought.trim()) return;
    startTransition(async () => {
      const r = await reframeThought(thought);
      setResult(r);
    });
  }

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl bg-white/5 text-white backdrop-blur-md transition-all">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 rounded-2xl"
        >
          <span className="text-sm font-semibold text-white/90">Terapia de Bolsillo</span>
          <span className="text-xs text-white/50">▼</span>
        </button>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Terapia de Bolsillo</h2>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Escribe ese pensamiento que te genera estrés y te ayudaré a verlo con otra perspectiva.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-white/40 hover:text-white shrink-0"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="Ej: «No sirvo para esto...»"
              rows={3}
              className="resize-none rounded-lg bg-white/10 p-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/20"
            />
            <button
              type="button"
              onClick={submit}
              disabled={isPending || !thought.trim()}
              className="self-end rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-black disabled:opacity-40"
            >
              {isPending ? "Analizando…" : "Buscar otra perspectiva"}
            </button>
          </div>

          {result && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 mt-2">
              <p className="text-[10px] uppercase tracking-wide text-emerald-300">
                Terapeuta de Bienestar
              </p>
              <p className="mt-1 text-sm leading-relaxed">{result}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
