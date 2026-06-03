"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

/**
 * Completes onboarding (UC-05). Creates the profile on first run, or updates
 * the existing one, then sends the user into the terrarium.
 */
export async function completeOnboarding(
  name: string,
  biomeType: string,
): Promise<void> {
  const clean = name.trim() || "Invitado";
  const existing = await prisma.profile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    await prisma.profile.update({
      where: { id: existing.id },
      data: { name: clean, biomeType, onboarded: true },
    });
    await prisma.biomeState.upsert({
      where: { profileId: existing.id },
      create: { profileId: existing.id, type: biomeType },
      update: { type: biomeType },
    });
  } else {
    await prisma.profile.create({
      data: {
        name: clean,
        biomeType,
        onboarded: true,
        biome: { create: { type: biomeType } },
      },
    });
  }

  revalidatePath("/");
  redirect("/");
}

export interface SettingsInput {
  name: string;
  biomeType: string;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
}

/** Updates profile settings (RF-17). */
export async function updateSettings(
  profileId: string,
  data: SettingsInput,
): Promise<void> {
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      name: data.name.trim() || "Invitado",
      biomeType: data.biomeType,
      voiceEnabled: data.voiceEnabled,
      hapticsEnabled: data.hapticsEnabled,
    },
  });
  await prisma.biomeState.update({
    where: { profileId },
    data: { type: data.biomeType },
  });
  revalidatePath("/");
  revalidatePath("/configuracion");
}
