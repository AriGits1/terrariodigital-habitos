"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";

/**
 * Send an encouragement to another opted-in profile.
 * S3: fromProfileId derived from session — never from client input.
 * S4: toProfileId is re-validated as opted-in before writing.
 */
export async function sendEncouragement(
  toProfileId: string,
  type: "water" | "kudos",
  message?: string,
): Promise<void> {
  const me = await requireProfile(); // S3 — session-derived id

  // Self-send no-op guard
  if (toProfileId === me.id) return;

  // S4 — re-validate target is opted-in
  const target = await prisma.profile.findUnique({
    where: { id: toProfileId, shareTerrarium: true },
    select: { id: true },
  });
  if (!target) {
    // S4 — reject non-members so the client surfaces the failure instead of a false success
    throw new Error("Esta persona no está recibiendo aliento ahora.");
  }

  await prisma.encouragement.create({
    data: {
      fromProfileId: me.id,
      toProfileId,
      type,
      message: message?.trim() || null,
    },
  });

  revalidatePath(`/comunidad/${toProfileId}`);
}

/**
 * Mark one received encouragement as read.
 * Scoped via updateMany WHERE toProfileId = session profile — prevents foreign writes.
 */
export async function markEncouragementRead(id: string): Promise<void> {
  const me = await requireProfile();

  // updateMany so a mismatched id silently affects 0 rows instead of throwing
  await prisma.encouragement.updateMany({
    where: { id, toProfileId: me.id },
    data: { read: true },
  });

  revalidatePath("/comunidad");
}
