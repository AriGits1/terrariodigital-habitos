// Gamification engine — pure logic. Turns habit completion history into the
// biome's growth (cumulative effort) and health (recent consistency).
//
// No DB, no React: takes plain data in, returns numbers out. This is the
// module the project claims as "Gamificación", so it is intentionally explicit
// and explainable.

import { clamp } from "../biome/biome-logic";

export interface HabitWeight {
  id: string;
  weight: number;
}

export interface LogRecord {
  habitId: string;
  /** Calendar day at midnight. */
  date: Date;
  completed: boolean;
}

/** Midnight of `daysAgo` days before `from` (defaults to today). */
export function dayAt(daysAgo: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

/**
 * Weighted completion ratio (0..1) for a single day: the sum of weights of
 * habits completed that day over the total weight of all active habits.
 */
export function dayScore(
  habits: HabitWeight[],
  logs: LogRecord[],
  day: Date,
): number {
  const totalWeight = habits.reduce((s, h) => s + h.weight, 0);
  if (totalWeight === 0) return 0;

  const dayKey = day.getTime();
  const completedWeight = habits.reduce((sum, h) => {
    const done = logs.some(
      (l) =>
        l.habitId === h.id &&
        l.completed &&
        new Date(l.date).setHours(0, 0, 0, 0) === dayKey,
    );
    return done ? sum + h.weight : sum;
  }, 0);

  return completedWeight / totalWeight;
}

/** Average day score across the last `days` days (including today). */
function averageScore(
  habits: HabitWeight[],
  logs: LogRecord[],
  days: number,
  today: Date,
): number {
  let sum = 0;
  for (let i = 0; i < days; i++) {
    sum += dayScore(habits, logs, dayAt(i, today));
  }
  return sum / days;
}

export interface BiomeVitals {
  growth: number;
  health: number;
}

/**
 * Computes biome vitals from habit history.
 * - health: short-term consistency (last 3 days) — drops fast when you stop.
 * - growth: medium-term effort (last 7 days) — accumulates more slowly.
 *
 * Both are clamped to [5, 100] so the biome is never fully dead nor maxed by
 * a single day.
 */
export function computeVitals(
  habits: HabitWeight[],
  logs: LogRecord[],
  today: Date = new Date(),
): BiomeVitals {
  const health = clamp(Math.round(averageScore(habits, logs, 3, today) * 100), 5, 100);
  const growth = clamp(Math.round(averageScore(habits, logs, 7, today) * 100), 5, 100);
  return { growth, health };
}
