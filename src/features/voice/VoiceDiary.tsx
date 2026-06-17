"use client";

import { useState, useTransition } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import {
  submitDiaryEntry,
  submitMoodCard,
  type MoodResult,
} from "@/features/mood/actions";

import { Mic, Square, Smile, Heart, Meh, AlertCircle, Frown } from "lucide-react";

const MOOD_CARDS = [
  { icon: Smile, label: "Motivado", mood: "motivated", score: 0.7 },
  { icon: Heart, label: "Tranquilo", mood: "calm", score: 0.3 },
  { icon: Meh, label: "Neutral", mood: "neutral", score: 0 },
  { icon: AlertCircle, label: "Ansioso", mood: "anxious", score: -0.4 },
  { icon: Frown, label: "Triste", mood: "sad", score: -0.7 },
];

export default function VoiceDiary({ profileId, cardLockedToday }: { profileId: string; cardLockedToday?: boolean }) {
  const { supported, listening, transcript, error, start, stop, reset } =
    useSpeechRecognition("es-ES");
  const [text, setText] = useState("");
  const [result, setResult] = useState<MoodResult | null>(null);
  const [cardSubmittedThisSession, setCardSubmittedThisSession] = useState(false);
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
      setCardSubmittedThisSession(true);
      setResult({ mood, score, reply: "Gracias por registrar cómo te sentís. Tu terrario lo refleja." });
    });
  }

  // Cards are restricted to 1 per day; voice and text have no daily limit.
  const cardsLocked = cardLockedToday || cardSubmittedThisSession;

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white/5 p-6 text-white backdrop-blur-md">
      <div>
        <h2 className="text-xl font-semibold">Diario matutino</h2>
        <p className="text-sm text-white/60">
          Cuéntame cómo amaneciste. Por voz, texto, o elige una carta.
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
            {listening ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-8 w-8" />}
          </button>
          <p className="text-xs text-white/50">
            {listening ? "Escuchando…" : "Toca para hablar"}
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
              No pude acceder al micrófono ({error}). Usa el texto de abajo.
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-amber-500/20 p-3 text-xs text-amber-100">
          Tu navegador no soporta dictado por voz. Usa el texto o las cartas.
        </p>
      )}

      {/* Text fallback (accessibility, RF-14) */}
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={false}
          placeholder="…o escríbelo aquí"
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
          O elige una carta
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_CARDS.map((c) => (
            <button
              key={c.mood}
              type="button"
              onClick={() => submitCard(c.mood, c.score)}
              disabled={isPending || cardsLocked}
              aria-label={c.label}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
            >
              <c.icon className="h-6 w-6" />
              <span className="text-xs text-white/60">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terapeuta reply or already done message */}
      {result ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-300">
            Terapeuta de Bienestar
          </p>
          <p className="mt-1 text-sm">{result.reply}</p>
        </div>
      ) : null}
      {cardsLocked && !result ? (
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-center">
          <p className="text-sm text-white/80">
            Ya elegiste tu carta de hoy. ¡Vuelve mañana para elegir otra!
          </p>
        </div>
      ) : null}
    </div>
  );
}
