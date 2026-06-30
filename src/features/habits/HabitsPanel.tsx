"use client";

import { useOptimistic, useState, useTransition, type TransitionStartFunction } from "react";
import Link from "next/link";
import { addHabit, archiveHabit, toggleHabitToday, applyDifficultySuggestion } from "./actions";
import type { DifficultySuggestion } from "@/features/adaptation/engine";
import { Check, X, Plus, Leaf } from "lucide-react";

export interface HabitView {
  id: string;
  title: string;
  species: string | null;
  weight: number;
  doneToday: boolean;
  weeklyLogs?: string[];
  createdAt?: string;
  suggestion?: DifficultySuggestion;
  suggestionReason?: string | null;
}

type OptimisticAction =
  | { kind: "toggle"; id: string }
  | { kind: "add"; title: string; weight: number }
  | { kind: "archive"; id: string }
  | { kind: "dismiss_suggestion"; id: string };

function reduce(state: HabitView[], action: OptimisticAction): HabitView[] {
  switch (action.kind) {
    case "toggle":
      return state.map((h) =>
        h.id === action.id ? { ...h, doneToday: !h.doneToday } : h,
      );
    case "add":
      return [
        ...state,
        {
          id: `temp-${Date.now()}`,
          title: action.title.trim(),
          species: null,
          weight: action.weight,
          doneToday: false,
        },
      ];
    case "archive":
      return state.filter((h) => h.id !== action.id);
    case "dismiss_suggestion":
      return state.map((h) =>
        h.id === action.id ? { ...h, suggestion: undefined } : h,
      );
  }
}

export default function HabitsPanel({
  habits,
}: {
  habits: HabitView[];
}) {
  const [optimisticHabits, applyOptimistic] = useOptimistic(habits, reduce);
  const [, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newWeight, setNewWeight] = useState(3);
  const [isOpen, setIsOpen] = useState(true);

  function toggle(id: string) {
    startTransition(async () => {
      applyOptimistic({ kind: "toggle", id });
      await toggleHabitToday(id);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      applyOptimistic({ kind: "archive", id });
      await archiveHabit(id);
    });
  }

  function create() {
    if (!newTitle.trim()) return;
    const title = newTitle;
    const weight = newWeight;
    setNewTitle("");
    setNewWeight(3);
    startTransition(async () => {
      applyOptimistic({ kind: "add", title, weight });
      await addHabit(title, weight);
    });
  }

  const doneCount = optimisticHabits.filter((h) => h.doneToday).length;
  const atLimit = optimisticHabits.length >= 5;

  // ── Collapsed chip ─────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/60 px-4 py-2.5 text-sm font-medium text-white shadow-xl ring-1 ring-white/10 backdrop-blur-xl hover:bg-black/75 transition-all"
        aria-label="Abrir panel de hábitos"
      >
        <Leaf className="h-4 w-4 text-emerald-400" />
        Hábitos
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
          {doneCount}/{optimisticHabits.length}
        </span>
      </button>
    );
  }

  // Full panel
  return (
    <aside data-tour="habits" className="pointer-events-auto flex max-h-[52vh] w-full flex-col gap-3 overflow-y-auto rounded-3xl bg-black/45 p-4 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:max-h-none md:w-80 md:rounded-2xl md:p-5">
      {/* Drag handle (mobile sheet affordance) */}
      <div className="mx-auto h-1 w-10 rounded-full bg-white/25 md:hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hábitos de hoy</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">
            {doneCount}/{optimisticHabits.length}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition"
            aria-label="Cerrar panel de hábitos"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Habit list */}
      <ul className="flex flex-col gap-2">
        {optimisticHabits.map((h) => (
          <li key={h.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggle(h.id)}
                aria-pressed={h.doneToday}
                aria-label={`Marcar "${h.title}" como ${h.doneToday ? "pendiente" : "completado"}`}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  h.doneToday
                    ? "border-emerald-400 bg-emerald-400 text-black"
                    : "border-white/40 bg-transparent"
                }`}
              >
                {h.doneToday ? <Check className="h-4 w-4 stroke-[3]" /> : null}
              </button>
              <span
                className={`flex-1 text-sm ${h.doneToday ? "text-white/60 line-through" : ""}`}
              >
                {h.title}
              </span>
              <span className="text-xs text-white/40" title={`Peso ${h.weight}`}>
                {"●".repeat(h.weight)}
              </span>
              <button
                type="button"
                onClick={() => remove(h.id)}
                aria-label={`Archivar "${h.title}"`}
                className="text-white/30 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {(h.suggestion === "level-up" || h.suggestion === "ease") && (
              <SuggestionChip
                habitId={h.id}
                suggestion={h.suggestion}
                reason={h.suggestionReason ?? null}
                startTransition={startTransition}
                onDismiss={() => {
                  startTransition(() => {
                    applyOptimistic({ kind: "dismiss_suggestion", id: h.id });
                  });
                }}
              />
            )}
          </li>
        ))}
        {optimisticHabits.length === 0 && (
          <li className="text-sm text-white/50">
            Todavía no hay hábitos. Agrega el primero abajo.
          </li>
        )}
      </ul>

      {/* Add habit form */}
      <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !atLimit && create()}
          placeholder={atLimit ? "Límite de 5 hábitos alcanzado" : "Nuevo hábito…"}
          disabled={atLimit}
          className={`rounded-lg bg-white/10 px-3 py-2 text-sm outline-none transition-all focus:bg-white/20 ${
            atLimit
              ? "cursor-not-allowed opacity-50 placeholder:text-red-300/70"
              : "placeholder:text-white/40"
          }`}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/60">Peso</label>
          <input
            type="range"
            min={1}
            max={5}
            value={newWeight}
            onChange={(e) => setNewWeight(Number(e.target.value))}
            disabled={atLimit}
            className={`flex-1 ${atLimit ? "cursor-not-allowed opacity-50" : ""}`}
          />
          <span className="w-4 text-sm">{newWeight}</span>
          <button
            type="button"
            onClick={create}
            disabled={atLimit || !newTitle.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Agregar hábito"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Coach link */}
      <div className="mt-4 flex justify-end">
        <Link
          data-tour="coach"
          href="?coach=true"
          scroll={false}
          className="flex items-center justify-center rounded-full bg-blue-600/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-colors hover:bg-blue-500"
        >
          Hablar con Coach
        </Link>
      </div>
    </aside>
  );
}

// ── SuggestionChip ─────────────────────────────────────────────────────────

function SuggestionChip({
  habitId,
  suggestion,
  reason,
  startTransition,
  onDismiss,
}: {
  habitId: string;
  suggestion: "level-up" | "ease";
  reason: string | null;
  startTransition: TransitionStartFunction;
  onDismiss: () => void;
}) {
  const label = suggestion === "level-up" ? "Subir dificultad" : "Bajar dificultad";

  function handleAccept() {
    startTransition(async () => {
      await applyDifficultySuggestion(habitId, true);
    });
  }

  function handleReject() {
    onDismiss();
    startTransition(async () => {
      await applyDifficultySuggestion(habitId, false);
    });
  }

  return (
    <div className="ml-10 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-300/90 font-medium">{label}</span>
        <button
          type="button"
          onClick={handleAccept}
          className="rounded bg-emerald-500/30 px-2 py-0.5 text-xs text-emerald-300 hover:bg-emerald-500/50 transition-colors"
          aria-label={`Aceptar sugerencia: ${label}`}
        >
          Aceptar
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/60 hover:bg-white/20 transition-colors"
          aria-label="Rechazar sugerencia"
        >
          Ignorar
        </button>
      </div>
      {reason && (
        <details className="text-xs text-white/50">
          <summary className="cursor-pointer hover:text-white/70 list-none underline decoration-dotted">
            ¿por qué veo esto?
          </summary>
          <p className="mt-1 text-white/60 leading-snug">{reason}</p>
        </details>
      )}
    </div>
  );
}
