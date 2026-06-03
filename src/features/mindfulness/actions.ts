"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/** Records a completed mindfulness session (UC-04). */
export async function saveMindfulnessSession(
  profileId: string,
  durationSec: number,
): Promise<void> {
  if (durationSec < 5) return; // ignore accidental taps
  await prisma.mindfulnessSession.create({
    data: { profileId, durationSec: Math.round(durationSec) },
  });
  revalidatePath("/mindfulness");
}
