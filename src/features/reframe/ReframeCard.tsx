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

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white/5 p-6 text-white">
      <div>
        <h2 className="text-xl font-semibold">Reencuadre cognitivo</h2>
        <p className="text-sm text-white/60">
          Escribí un pensamiento que te pesa. Te ayudo a mirarlo distinto.
        </p>
      </div>

      <textarea
        value={thought}
        onChange={(e) => setThought(e.target.value)}
        placeholder="Ej: «Nunca voy a terminar la tesis»"
        rows={3}
        className="resize-none rounded-lg bg-white/10 p-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/20"
      />
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !thought.trim()}
        className="self-start rounded-lg bg-emerald-500 px-5 py-2 font-medium text-black disabled:opacity-40"
      >
        {isPending ? "Pensando…" : "Reencuadrar"}
      </button>

      {result && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-300">
            Otra perspectiva
          </p>
          <p className="mt-2 text-sm leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
}
