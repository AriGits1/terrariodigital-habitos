"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recomputeAdaptation } from "@/features/adaptation/state";
import { requireProfile } from "@/features/auth/guards";

/**
 * Records a completed mindfulness session (UC-04).
 *
 * Security: profileId param is ignored — the session-verified profile id is
 * derived from requireProfile() to prevent IDOR writes to other users' data.
 */
export async function saveMindfulnessSession(
  _callerProfileId: string,
  durationSec: number,
): Promise<void> {
  // Always derive profileId from the authenticated session; never trust the caller.
  const profile = await requireProfile();
  const profileId = profile.id;

  if (durationSec < 5) return; // ignore accidental taps
  await prisma.mindfulnessSession.create({
    data: { profileId, durationSec: Math.round(durationSec) },
  });
  await recomputeAdaptation(profileId, { kind: "engagement", module: "mindfulness" });
  revalidatePath("/mindfulness");
}
