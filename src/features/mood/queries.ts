import { prisma } from "@/lib/db";

/** The most recent mood entries for a profile. */
export async function getRecentMoods(profileId: string, limit = 7) {
  return prisma.moodEntry.findMany({
    where: { profileId },
    orderBy: { date: "desc" },
    take: limit,
  });
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
