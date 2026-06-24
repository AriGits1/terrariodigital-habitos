"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";
import { getCurrentProfile } from "@/features/auth/queries";
import type { ModuleKey } from "@/features/adaptation/engine";

export interface SettingsInput {
  name: string;
  biomeType: string;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  shareTerrarium?: boolean;
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
      shareTerrarium: data.shareTerrarium,
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

/** Completes the first-run onboarding flow (UC-05).
 *  Sets the display name, preferred biome and marks the profile as onboarded.
 *  Also creates (or resets) the initial BiomeState so the home page renders immediately.
 *
 *  Intentionally uses getCurrentProfile() instead of requireProfile() to avoid an
 *  infinite redirect loop: requireProfile() now redirects to /onboarding when the
 *  user is not yet onboarded, which is precisely the state we're in here.
 */
export async function completeOnboarding(
  name: string,
  biomeType: string,
): Promise<void> {
  // Resolve profile without the onboarded-gate guard.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const cleanName = name.trim() || "Explorador";

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      name: cleanName,
      biomeType,
      onboarded: true,
    },
  });

  // Seed an initial BiomeState so the 3D scene has data from day 1.
  await prisma.biomeState.upsert({
    where: { profileId: profile.id },
    create: { profileId: profile.id, type: biomeType, growth: 5, health: 80 },
    update: { type: biomeType },
  });

  // redirect() inside a Server Action is the correct Next.js pattern;
  // it throws a special error that Next.js intercepts as a navigation response.
  redirect("/");
}
