"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAgents } from "@/features/agents";
import { getAverageMoodScore } from "./queries";
import { biomeForMood } from "./personalization";

export interface MoodResult {
  mood: string;
  score: number;
  /** Terapeuta reply shown back to the user. */
  reply: string;
}

/**
 * Re-applies the continuous personalization: reads the recent mood average and
 * morphs the biome type to match. Keeps Profile and BiomeState in sync.
 */
async function adaptBiomeToMood(profileId: string): Promise<void> {
  const avg = await getAverageMoodScore(profileId);
  const type = biomeForMood(avg);

  await prisma.profile.update({
    where: { id: profileId },
    data: { biomeType: type },
  });
  await prisma.biomeState.upsert({
    where: { profileId },
    create: { profileId, type },
    update: { type },
  });
}

/**
 * Submits a diary entry captured by voice or text. The Terapeuta agent infers
 * the mood and replies; the biome then adapts to the running emotional average.
 */
export async function submitDiaryEntry(
  profileId: string,
  source: "voice" | "text",
  rawText: string,
): Promise<MoodResult | null> {
  const clean = rawText.trim();
  if (!clean) return null;

  const inference = await getAgents().inferMood(clean);

  await prisma.moodEntry.create({
    data: {
      profileId,
      source,
      rawText: clean,
      mood: inference.mood,
      score: inference.score,
    },
  });

  await adaptBiomeToMood(profileId);
  revalidatePath("/");
  revalidatePath("/diario");

  return { mood: inference.mood, score: inference.score, reply: inference.reply };
}

/**
 * Submits a mood via a card tap — the accessible, non-verbal alternative to the
 * voice diary (RF-14). No LLM inference needed; the card already carries mood.
 */
export async function submitMoodCard(
  profileId: string,
  mood: string,
  score: number,
): Promise<void> {
  await prisma.moodEntry.create({
    data: { profileId, source: "card", mood, score },
  });

  await adaptBiomeToMood(profileId);
  revalidatePath("/");
  revalidatePath("/diario");
}
