"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";

export interface SettingsInput {
  name: string;
  biomeType: string;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
}

/** Updates profile settings (RF-17). Resolves the target profile from the
 *  current session — caller cannot supply a foreign profileId. */
export async function updateSettings(data: SettingsInput): Promise<void> {
  const profile = await requireProfile();

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      name: data.name.trim() || "Invitado",
      biomeType: data.biomeType,
      voiceEnabled: data.voiceEnabled,
      hapticsEnabled: data.hapticsEnabled,
    },
  });
  await prisma.biomeState.update({
    where: { profileId: profile.id },
    data: { type: data.biomeType },
  });
  revalidatePath("/");
  revalidatePath("/configuracion");
}
