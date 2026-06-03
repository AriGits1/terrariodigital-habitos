// Analytics — pure derivations over habit history and mood. No DB, no React.
// Reuses the same gamification primitives so the numbers shown here always
// agree with what drives the biome.

import {
  dayAt,
  dayScore,
  type HabitWeight,
  type LogRecord,
} from "../habits/gamification";

export interface DayPoint {
  date: Date;
  /** Weighted completion ratio 0..1 for that day. */
  score: number;
  /** Short weekday label, e.g. "lun". */
  label: string;
}

/** Weighted completion score for each of the last 7 days, oldest first. */
export function weeklyScores(
  habits: HabitWeight[],
  logs: LogRecord[],
  today: Date = new Date(),
): DayPoint[] {
  const points: DayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = dayAt(i, today);
    points.push({
      date: d,
      score: dayScore(habits, logs, d),
      label: d.toLocaleDateString("es-PE", { weekday: "short" }),
    });
  }
  return points;
}

/** Consecutive days (ending today) with at least one completed habit. */
export function currentStreak(
  habits: HabitWeight[],
  logs: LogRecord[],
  today: Date = new Date(),
): number {
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    if (dayScore(habits, logs, dayAt(i, today)) > 0) streak++;
    else break;
  }
  return streak;
}

/** Average weighted completion over the last `days` days, as a 0..100 percent. */
export function completionRate(
  habits: HabitWeight[],
  logs: LogRecord[],
  days: number,
  today: Date = new Date(),
): number {
  let sum = 0;
  for (let i = 0; i < days; i++) {
    sum += dayScore(habits, logs, dayAt(i, today));
  }
  return Math.round((sum / days) * 100);
}

export interface HabitStat {
  id: string;
  title: string;
  done: number;
  total: number;
}

/** Per-habit completion counts over the last `days` days. */
export function perHabitStats(
  habits: { id: string; title: string }[],
  logs: LogRecord[],
  days: number,
  today: Date = new Date(),
): HabitStat[] {
  return habits.map((h) => {
    let done = 0;
    for (let i = 0; i < days; i++) {
      const dayKey = dayAt(i, today).getTime();
      const hit = logs.some(
        (l) =>
          l.habitId === h.id &&
          l.completed &&
          new Date(l.date).setHours(0, 0, 0, 0) === dayKey,
      );
      if (hit) done++;
    }
    return { id: h.id, title: h.title, done, total: days };
  });
}
