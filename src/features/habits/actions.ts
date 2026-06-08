"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
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
 * Toggles today's completion for a habit. Completing it grows/heals the biome;
 * un-completing it reverses that. This is the core gamification loop.
 */
export async function toggleHabitToday(habitId: string): Promise<void> {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { profileId: true },
  });
  if (!habit) return;

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

  await refreshBiome(habit.profileId);
  revalidatePath("/");
  revalidatePath("/habitos");
}

/** Creates a new habit (RF-01) and refreshes the biome. */
export async function addHabit(
  profileId: string,
  title: string,
  weight: number,
): Promise<void> {
  const clean = title.trim();
  if (!clean) return;

  // Enforce a maximum of 5 active habits per profile
  const count = await prisma.habit.count({
    where: { profileId, archived: false },
  });
  if (count >= 5) return;

  await prisma.habit.create({
    data: {
      profileId,
      title: clean,
      weight: Math.max(1, Math.min(5, weight)),
    },
  });

  await refreshBiome(profileId);
  revalidatePath("/");
  revalidatePath("/habitos");
}

/** Archives a habit (soft delete) and refreshes the biome. */
export async function archiveHabit(habitId: string): Promise<void> {
  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: { archived: true },
    select: { profileId: true },
  });

  await refreshBiome(habit.profileId);
  revalidatePath("/");
  revalidatePath("/habitos");
}
