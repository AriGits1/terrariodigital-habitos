"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";
import { computeVitals, dayAt } from "./gamification";
import { getVitalsData } from "./queries";
import { recomputeAdaptation } from "@/features/adaptation/state";
import { suggestHabitDifficulty, nextWeight } from "@/features/adaptation/engine";

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
    select: { profileId: true, weight: true },
  });
  if (!habit || habit.profileId !== profile.id) return;

  const today = dayAt(0);
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date: today } },
  });

  const profileDetails = await prisma.profile.findUnique({
    where: { id: profile.id },
    select: { currentStreak: true, lastActiveDate: true },
  });

  const seedsDelta = (habit.weight ?? 1) * 10;

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        seeds: {
          decrement: seedsDelta,
        },
      },
    });
    // Ensure seeds never drop below 0
    const updated = await prisma.profile.findUnique({
      where: { id: profile.id },
      select: { seeds: true },
    });
    if (updated && updated.seeds < 0) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { seeds: 0 },
      });
    }
  } else {
    await prisma.habitLog.create({
      data: { habitId, date: today, completed: true },
    });

    let newStreak = profileDetails?.currentStreak ?? 0;
    const lastActive = profileDetails?.lastActiveDate;

    if (lastActive) {
      const yesterday = dayAt(1);
      const diffTime = today.getTime() - lastActive.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // If diffDays === 0, streak remains the same
    } else {
      newStreak = 1;
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        seeds: {
          increment: seedsDelta,
        },
        currentStreak: newStreak,
        lastActiveDate: today,
      },
    });
  }

  await refreshBiome(profile.id);
  await recomputeAdaptation(profile.id, {
    kind: "habit",
    habitId,
    completed: !existing,
  });
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

/**
 * Accepts or rejects a difficulty suggestion for a habit (Surface 1 — mixed-initiative HCI).
 * On accept: reads current EWMA, computes nextWeight, writes Habit.weight, refreshes biome.
 * On reject: no-op. Habit.weight is NEVER written by recomputeAdaptation — only here.
 */
export async function applyDifficultySuggestion(
  habitId: string,
  accept: boolean,
): Promise<void> {
  const profile = await requireProfile();

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { profileId: true, weight: true },
  });
  if (!habit || habit.profileId !== profile.id) return;

  if (!accept) {
    // Si el usuario ignora la sugerencia, reseteamos el EWMA a un valor neutral (0.6)
    // para que la sugerencia desaparezca y no vuelva a molestar hasta que haya más datos.
    const state = await prisma.adaptationState.findUnique({
      where: { profileId: profile.id },
      select: { habitEwma: true },
    });
    
    if (state) {
      try {
        const parsed = JSON.parse(state.habitEwma);
        if (parsed && typeof parsed === "object") {
          parsed[habitId] = 0.6; // zona muerta (hold)
          await prisma.adaptationState.update({
            where: { profileId: profile.id },
            data: { habitEwma: JSON.stringify(parsed) }
          });
        }
      } catch {
        // ignore
      }
    }
    revalidatePath("/");
    revalidatePath("/habitos");
    return;
  }

  // Read AdaptationState to get the current habit EWMA
  const state = await prisma.adaptationState.findUnique({
    where: { profileId: profile.id },
    select: { habitEwma: true },
  });

  let habitEwmaValue = 0;
  if (state) {
    try {
      const parsed = JSON.parse(state.habitEwma);
      if (parsed && typeof parsed === "object" && typeof parsed[habitId] === "number") {
        habitEwmaValue = parsed[habitId];
      }
    } catch {
      // malformed JSON — use default
    }
  }

  const suggestion = suggestHabitDifficulty(habitEwmaValue, habit.weight);
  const newWeight = nextWeight(suggestion, habit.weight);

  await prisma.habit.update({
    where: { id: habitId },
    data: { weight: newWeight },
  });

  await refreshBiome(profile.id);
  revalidatePath("/");
  revalidatePath("/habitos");
}
