import { prisma } from "@/lib/db";
import type { BiomeType } from "@/features/biome/biome-logic";
import { getVitalsData, getHabitsWithTodayStatus } from "@/features/habits/queries";
import { currentStreak } from "@/features/analytics/analytics";

export interface CohortMember {
  id: string;
  name: string;
  biomeType: BiomeType;
  growth: number;  // BiomeState.growth ?? 5
  health: number;  // BiomeState.health ?? 5
  streak: number;  // currentStreak over getVitalsData
}

export interface VisitData {
  name: string;
  biomeType: BiomeType;
  growth: number;
  health: number;
  habits: Awaited<ReturnType<typeof getHabitsWithTodayStatus>>;
}

export interface InboxItem {
  id: string;
  type: "water" | "kudos";
  message: string | null;
  read: boolean;
  claimed: boolean;   // water gestures: already credited to balance?
  createdAt: string;  // ISO
  fromName: string;   // joined via fromProfile.select.name
}

export interface Inbox {
  items: InboxItem[];
  unreadCount: number;
}

/** Opted-in members EXCEPT the viewer. N+1 streak accepted for small cohort. */
export async function listCohort(viewerId: string): Promise<CohortMember[]> {
  const members = await prisma.profile.findMany({
    where: { shareTerrarium: true, NOT: { id: viewerId } },
    select: {
      id: true,
      name: true,
      biomeType: true,
      biome: { select: { growth: true, health: true } },
    },
  });

  const results: CohortMember[] = [];
  for (const m of members) {
    const { habits, logs } = await getVitalsData(m.id);
    const streak = currentStreak(habits, logs);
    results.push({
      id: m.id,
      name: m.name,
      biomeType: m.biomeType as BiomeType,
      growth: m.biome?.growth ?? 5,
      health: m.biome?.health ?? 5,
      streak,
    });
  }
  return results;
}

/** S1 gate: findUnique WHERE { id, shareTerrarium:true }; null when not visitable. */
export async function getVisitData(targetProfileId: string): Promise<VisitData | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: targetProfileId, shareTerrarium: true },
    select: {
      name: true,
      biomeType: true,
      biome: { select: { growth: true, health: true } },
    },
  });

  if (!profile) return null;

  const habits = await getHabitsWithTodayStatus(targetProfileId);

  return {
    name: profile.name,
    biomeType: profile.biomeType as BiomeType,
    growth: profile.biome?.growth ?? 5,
    health: profile.biome?.health ?? 5,
    habits,
  };
}

/** Recipient feed, unread-first then newest. Reads use the SESSION profile id (S4). */
export async function getInbox(profileId: string): Promise<Inbox> {
  const [rows, unreadCount] = await Promise.all([
    prisma.encouragement.findMany({
      where: { toProfileId: profileId },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        message: true,
        read: true,
        claimed: true,
        createdAt: true,
        fromProfile: { select: { name: true } },
      },
    }),
    prisma.encouragement.count({ where: { toProfileId: profileId, read: false } }),
  ]);

  const items: InboxItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type as "water" | "kudos",
    message: r.message,
    read: r.read,
    claimed: r.claimed,
    createdAt: r.createdAt.toISOString(),
    fromName: r.fromProfile.name,
  }));

  return { items, unreadCount };
}
