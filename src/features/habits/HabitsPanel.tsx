"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addHabit, archiveHabit, toggleHabitToday } from "./actions";

export interface HabitView {
  id: string;
  title: string;
  species: string | null;
  weight: number;
  doneToday: boolean;
}

type OptimisticAction =
  | { kind: "toggle"; id: string }
  | { kind: "add"; title: string; weight: number }
  | { kind: "archive"; id: string };

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
  }
}

export default function HabitsPanel({
  profileId,
  habits,
}: {
  profileId: string;
  habits: HabitView[];
}) {
  // Optimistic state makes the list respond instantly; the server revalidation
  // reconciles it afterwards, so it never feels stuck waiting on the network.
  const [optimisticHabits, applyOptimistic] = useOptimistic(habits, reduce);
  const [, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newWeight, setNewWeight] = useState(3);

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
      await addHabit(profileId, title, weight);
    });
  }

  const doneCount = optimisticHabits.filter((h) => h.doneToday).length;

  return (
    <aside className="pointer-events-auto flex max-h-[52vh] w-full flex-col gap-3 overflow-y-auto rounded-3xl bg-black/45 p-4 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:max-h-none md:w-80 md:rounded-2xl md:p-5">
      {/* Drag handle (mobile sheet affordance) */}
      <div className="mx-auto h-1 w-10 rounded-full bg-white/25 md:hidden" />
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Hábitos de hoy</h2>
        <span className="text-sm text-white/70">
          {doneCount}/{optimisticHabits.length}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {optimisticHabits.map((h) => (
          <li key={h.id} className="flex items-center gap-3">
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
              {h.doneToday ? "✓" : ""}
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
              ✕
            </button>
          </li>
        ))}
        {optimisticHabits.length === 0 && (
          <li className="text-sm text-white/50">
            Todavía no hay hábitos. Agregá el primero abajo.
          </li>
        )}
      </ul>

      <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Nuevo hábito…"
          className="rounded-lg bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:bg-white/20"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/60">Peso</label>
          <input
            type="range"
            min={1}
            max={5}
            value={newWeight}
            onChange={(e) => setNewWeight(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-4 text-sm">{newWeight}</span>
          <button
            type="button"
            onClick={create}
            disabled={!newTitle.trim()}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      </div>
    </aside>
  );
}
