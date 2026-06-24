// Biome decay — lazy, on-page-load mechanism that replaces a server-side cron job.
//
// Strategy: The BiomeState in the DB is a cached snapshot refreshed every time the
// user toggles a habit. If the user disappears for several days, that snapshot goes
// stale. This module fixes it by recomputing growth/health from the full habit
// history every time the home page is rendered — but only when the snapshot is from
// a previous calendar day, so rapid page refreshes don't trigger redundant DB writes.

import { prisma } from "@/lib/db";
import { computeVitals } from "./gamification";
import { getVitalsData } from "./queries";

export interface BiomeVitalsSnapshot {
  growth: number;
  health: number;
}

/**
 * Lazy biome decay: silently recomputes growth/health from habit history
 * and persists the updated snapshot whenever the stored one is outdated
 * (i.e. last written before today's midnight).
 *
 * Returns the up-to-date vitals so the caller can use them directly —
 * no extra DB read required.
 *
 * @param profileId  - Profile to update.
 * @param biomeState - The existing cached BiomeState (with updatedAt). If null,
 *                     a fresh computation is always performed.
 */
export async function maybeDecayBiome(
  profileId: string,
  biomeState: { updatedAt: Date; growth: number; health: number } | null,
): Promise<BiomeVitalsSnapshot> {
  // Fast path: snapshot was already refreshed today — no DB writes needed.
  if (biomeState) {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const lastUpdateMidnight = new Date(biomeState.updatedAt);
    lastUpdateMidnight.setHours(0, 0, 0, 0);

    if (lastUpdateMidnight >= todayMidnight) {
      return { growth: biomeState.growth, health: biomeState.health };
    }
  }

  // Slow path: snapshot is stale (or missing) — recompute from full history.
  const { habits, logs } = await getVitalsData(profileId);
  const { growth, health } = computeVitals(habits, logs);

  await prisma.biomeState.upsert({
    where: { profileId },
    create: { profileId, growth, health },
    update: { growth, health },
  });

  return { growth, health };
}
