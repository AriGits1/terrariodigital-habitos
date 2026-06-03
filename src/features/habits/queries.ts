import { prisma } from "@/lib/db";
import { dayAt } from "./gamification";

/** All active habits for a profile, each flagged with today's completion. */
export async function getHabitsWithTodayStatus(profileId: string) {
  const today = dayAt(0);
  const habits = await prisma.habit.findMany({
    where: { profileId, archived: false },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { date: today, completed: true },
        take: 1,
      },
    },
  });

  return habits.map((h) => ({
    id: h.id,
    title: h.title,
    species: h.species,
    weight: h.weight,
    periodicity: h.periodicity,
    doneToday: h.logs.length > 0,
  }));
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
