import { prisma } from "@/lib/db";
import { dayAt } from "@/features/habits/gamification";

/** Habits, recent logs (30 days) and recent moods for the analytics screen. */
export async function getAnalyticsData(profileId: string) {
  const since = dayAt(29);

  const habits = await prisma.habit.findMany({
    where: { profileId, archived: false },
    select: { id: true, title: true, weight: true },
    orderBy: { createdAt: "asc" },
  });

  const logs = await prisma.habitLog.findMany({
    where: { habit: { profileId }, date: { gte: since } },
    select: { habitId: true, date: true, completed: true },
  });

  const moods = await prisma.moodEntry.findMany({
    where: { profileId },
    orderBy: { date: "desc" },
    take: 7,
    select: { mood: true, score: true, date: true },
  });

  return { habits, logs, moods: moods.reverse() };
}
