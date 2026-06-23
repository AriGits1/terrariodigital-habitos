"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";
import type { ModuleKey } from "@/features/adaptation/engine";

export interface SettingsInput {
  name: string;
  biomeType: string;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  adaptationOverrides?: {
    moduleOrder?: ModuleKey[] | null; // null = clear override
    difficultyOff?: boolean;
  };
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

  if (data.adaptationOverrides) {
    await prisma.adaptationState.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        moduleOrderOverride:
          data.adaptationOverrides.moduleOrder
            ? JSON.stringify(data.adaptationOverrides.moduleOrder)
            : null,
        difficultyOverride: data.adaptationOverrides.difficultyOff ?? false,
      },
      update: {
        ...(data.adaptationOverrides.moduleOrder !== undefined && {
          moduleOrderOverride: data.adaptationOverrides.moduleOrder
            ? JSON.stringify(data.adaptationOverrides.moduleOrder)
            : null,
        }),
        ...(data.adaptationOverrides.difficultyOff !== undefined && {
          difficultyOverride: data.adaptationOverrides.difficultyOff,
        }),
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/configuracion");
}
