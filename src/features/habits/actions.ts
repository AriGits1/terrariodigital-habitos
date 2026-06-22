"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";
import { computeVitals, dayAt } from "./gamification";
import { getVitalsData } from "./queries";

/**
 * Recomputes the biome vitals for a profile from its current habit history and
 * persists the snapshot. Called after any change that affects the biome.
 */
async function refreshBiome(profileId: string): Promise<void> {
  const { habits, logs } = await getVitalsData(profileId);
  const { growth, health } = computeVitals(habits, logs);

  await prisma.biomeState.upsert({
    where: { profileId },
    create: { profileId, growth, health },
    update: { growth, health },
  });
}

/**
 * Toggles today's completion for a habit. The habit must belong to the current
 * session's profile — prevents IDOR. Completing it grows/heals the biome;
 * un-completing it reverses that. This is the core gamification loop.
 */
export async function toggleHabitToday(habitId: string): Promise<void> {
  const profile = await requireProfile();

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { profileId: true },
  });
  if (!habit || habit.profileId !== profile.id) return;

  const today = dayAt(0);
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date: today } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({
      data: { habitId, date: today, completed: true },
    });
  }

  await refreshBiome(profile.id);
  revalidatePath("/");
  revalidatePath("/habitos");
}

/** Creates a new habit (RF-01) scoped to the current session profile. The
 *  caller cannot supply a foreign profileId. */
export async function addHabit(title: string, weight: number): Promise<void> {
  const profile = await requireProfile();

  const clean = title.trim();
  if (!clean) return;

  // Enforce a maximum of 5 active habits per profile
  const count = await prisma.habit.count({
    where: { profileId: profile.id, archived: false },
  });
  if (count >= 5) return;

  await prisma.habit.create({
    data: {
      profileId: profile.id,
      title: clean,
      weight: Math.max(1, Math.min(5, weight)),
    },
  });

  await refreshBiome(profile.id);
  revalidatePath("/");
  revalidatePath("/habitos");
}

/** Archives a habit (soft delete). The habit must belong to the current
 *  session's profile — prevents IDOR. */
export async function archiveHabit(habitId: string): Promise<void> {
  const profile = await requireProfile();

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { profileId: true },
  });
  if (!habit || habit.profileId !== profile.id) return;

  await prisma.habit.update({
    where: { id: habitId },
    data: { archived: true },
  });

  await refreshBiome(profile.id);
  revalidatePath("/");
  revalidatePath("/habitos");
}
