"use client";

import { useState, useTransition } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import {
  submitDiaryEntry,
  submitMoodCard,
  type MoodResult,
} from "@/features/mood/actions";

const MOOD_CARDS = [
  { emoji: "😄", label: "Motivado", mood: "motivated", score: 0.7 },
  { emoji: "🙂", label: "Tranquilo", mood: "calm", score: 0.3 },
  { emoji: "😐", label: "Neutral", mood: "neutral", score: 0 },
  { emoji: "😟", label: "Ansioso", mood: "anxious", score: -0.4 },
  { emoji: "😢", label: "Triste", mood: "sad", score: -0.7 },
];

export default function VoiceDiary({ profileId }: { profileId: string }) {
  const { supported, listening, transcript, error, start, stop, reset } =
    useSpeechRecognition("es-ES");
  const [text, setText] = useState("");
  const [result, setResult] = useState<MoodResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(source: "voice" | "text") {
    const value = source === "voice" ? transcript : text;
    if (!value.trim()) return;
    startTransition(async () => {
      const res = await submitDiaryEntry(profileId, source, value);
      setResult(res);
      setText("");
      reset();
    });
  }

  function submitCard(mood: string, score: number) {
    startTransition(async () => {
      await submitMoodCard(profileId, mood, score);
      setResult({ mood, score, reply: "Gracias por registrar cómo te sentís. Tu terrario lo refleja." });
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white/5 p-6 text-white backdrop-blur-md">
      <div>
        <h2 className="text-xl font-semibold">Diario matutino</h2>
        <p className="text-sm text-white/60">
          Contame cómo amaneciste. Por voz, texto, o elegí una carta.
        </p>
      </div>

      {/* Voice input */}
      {supported ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={listening ? stop : start}
            disabled={isPending}
            aria-label={listening ? "Detener grabación" : "Grabar diario por voz"}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl transition-all ${
              listening
                ? "animate-pulse bg-red-500 shadow-lg shadow-red-500/40"
                : "bg-emerald-500 hover:bg-emerald-400"
            }`}
          >
            {listening ? "⏹" : "🎙️"}
          </button>
          <p className="text-xs text-white/50">
            {listening ? "Escuchando…" : "Tocá para hablar"}
          </p>
          {transcript && (
            <div className="w-full rounded-lg bg-black/30 p-3 text-sm">
              {transcript}
            </div>
          )}
          {transcript && !listening && (
            <button
              type="button"
              onClick={() => submit("voice")}
              disabled={isPending}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
            >
              Registrar
            </button>
          )}
          {error && (
            <p className="text-xs text-red-300">
              No pude acceder al micrófono ({error}). Usá el texto abajo.
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-amber-500/20 p-3 text-xs text-amber-100">
          Tu navegador no soporta dictado por voz. Usá el texto o las cartas.
        </p>
      )}

      {/* Text fallback (accessibility, RF-14) */}
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="…o escribilo acá"
          rows={3}
          className="resize-none rounded-lg bg-white/10 p-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/20"
        />
        <button
          type="button"
          onClick={() => submit("text")}
          disabled={isPending || !text.trim()}
          className="self-end rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
        >
          Registrar texto
        </button>
      </div>

      {/* Mood cards (non-verbal alternative) */}
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-white/50">
          O elegí una carta
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_CARDS.map((c) => (
            <button
              key={c.mood}
              type="button"
              onClick={() => submitCard(c.mood, c.score)}
              disabled={isPending}
              aria-label={c.label}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs text-white/60">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terapeuta reply */}
      {result && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-300">
            Terapeuta de Bienestar
          </p>
          <p className="mt-1 text-sm">{result.reply}</p>
        </div>
      )}
    </div>
  );
}
