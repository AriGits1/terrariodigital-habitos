import { prisma } from "@/lib/db";

/** The most recent mood entries for a profile. */
export async function getRecentMoods(profileId: string, limit = 7) {
  return prisma.moodEntry.findMany({
    where: { profileId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

/**
 * Returns true if the user already submitted a mood card (source === "card")
 * today. Voice and text diary entries are NOT counted — those can be registered
 * multiple times per day.
 */
export async function hasSubmittedCardToday(profileId: string): Promise<boolean> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const entry = await prisma.moodEntry.findFirst({
    where: {
      profileId,
      source: "card",
      date: { gte: start, lte: end },
    },
    select: { id: true },
  });

  return entry !== null;
}

/** Average mood valence over the most recent `limit` entries (0 if none). */
export async function getAverageMoodScore(
  profileId: string,
  limit = 7,
): Promise<number> {
  const entries = await prisma.moodEntry.findMany({
    where: { profileId, score: { not: null } },
    orderBy: { date: "desc" },
    take: limit,
    select: { score: true },
  });
  if (entries.length === 0) return 0;
  const sum = entries.reduce((s, e) => s + (e.score ?? 0), 0);
  return sum / entries.length;
}
