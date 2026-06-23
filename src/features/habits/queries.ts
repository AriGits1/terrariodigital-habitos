import { prisma } from "@/lib/db";
import { dayAt } from "./gamification";
import { suggestHabitDifficulty } from "@/features/adaptation/engine";
import type { DifficultySuggestion } from "@/features/adaptation/engine";

/** All active habits for a profile, including today's status and the last 7 days of logs. */
export async function getHabitsWithTodayStatus(profileId: string) {
  const today = dayAt(0);
  const sevenDaysAgo = dayAt(6);

  const habits = await prisma.habit.findMany({
    where: { profileId, archived: false },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { date: { gte: sevenDaysAgo }, completed: true },
        orderBy: { date: "desc" },
      },
    },
  });

  return habits.map((h) => {
    // Check if there is a log with date === today
    const doneToday = h.logs.some((l) => l.date.getTime() === today.getTime());
    return {
      id: h.id,
      title: h.title,
      species: h.species,
      weight: h.weight,
      periodicity: h.periodicity,
      createdAt: h.createdAt.toISOString(),
      doneToday,
      weeklyLogs: h.logs.map((l) => l.date.toISOString()),
    };
  });
}

/**
 * Returns difficulty suggestions for all active habits of a profile.
 * One DB read (AdaptationState), then pure engine computation per habit.
 * If difficultyOverride is true, all suggestions are forced to "hold".
 */
export async function getHabitSuggestions(
  profileId: string,
): Promise<Map<string, { suggestion: DifficultySuggestion; reason: string | null }>> {
  const [state, habits] = await Promise.all([
    prisma.adaptationState.findUnique({ where: { profileId } }),
    prisma.habit.findMany({ where: { profileId, archived: false }, select: { id: true, weight: true } }),
  ]);

  let habitEwma: Record<string, number> = {};
  let difficultyOverride = false;

  if (state) {
    difficultyOverride = state.difficultyOverride;
    try {
      const parsed = JSON.parse(state.habitEwma);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "number" && Number.isFinite(v)) habitEwma[k] = v;
        }
      }
    } catch {
      // malformed JSON — treat as empty
    }
  }

  const LEVEL_UP_REASON =
    "Llevas varias semanas completando este hábito con consistencia; quizá quieras subir un poco la exigencia.";
  const EASE_REASON =
    "Notamos que este hábito te viene costando últimamente; puedes bajarle la dificultad sin culpa.";

  const result = new Map<string, { suggestion: DifficultySuggestion; reason: string | null }>();
  for (const habit of habits) {
    const ewma = habitEwma[habit.id] ?? 0;
    const suggestion: DifficultySuggestion = difficultyOverride
      ? "hold"
      : suggestHabitDifficulty(ewma, habit.weight);
    const reason =
      suggestion === "level-up"
        ? LEVEL_UP_REASON
        : suggestion === "ease"
          ? EASE_REASON
          : null;
    result.set(habit.id, { suggestion, reason });
  }
  return result;
}

/**
 * Minimal data needed by the gamification engine: habit weights plus the last
 * 7 days of completion logs.
 */
export async function getVitalsData(profileId: string) {
  const since = dayAt(6);
  const habits = await prisma.habit.findMany({
    where: { profileId, archived: false },
    select: { id: true, weight: true },
  });
  const logs = await prisma.habitLog.findMany({
    where: { habit: { profileId }, date: { gte: since } },
    select: { habitId: true, date: true, completed: true },
  });
  return { habits, logs };
}
