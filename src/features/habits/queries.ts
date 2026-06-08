import { prisma } from "@/lib/db";
import { dayAt } from "./gamification";

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
