"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";
import { DECORATIONS_CONFIG } from "./decorations-config";

/**
 * Places a decoration in the user's biome, deducting the corresponding seed cost.
 */
export async function placeDecoration(type: string, x: number, z: number): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await requireProfile();

    const config = DECORATIONS_CONFIG[type];
    if (!config) {
      return { success: false, error: "Elemento decorativo no válido." };
    }

    // Fetch fresh profile seeds count to be sure
    const dbProfile = await prisma.profile.findUnique({
      where: { id: profile.id },
      select: { seeds: true },
    });

    if (!dbProfile) {
      return { success: false, error: "Perfil no encontrado." };
    }

    if (dbProfile.seeds < config.cost) {
      return { success: false, error: "No tienes suficientes semillas." };
    }

    // Deduct seeds and create decoration in a transaction
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: profile.id },
        data: {
          seeds: {
            decrement: config.cost,
          },
        },
      }),
      prisma.biomeDecoration.create({
        data: {
          profileId: profile.id,
          type,
          x,
          z,
        },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error placing decoration:", err);
    return { success: false, error: "Error al colocar la decoración." };
  }
}

/**
 * Removes a decoration and refunds the full seed cost to the user's profile.
 */
export async function deleteDecoration(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await requireProfile();

    // Find the decoration and ensure ownership
    const decoration = await prisma.biomeDecoration.findUnique({
      where: { id },
      select: { id: true, type: true, profileId: true },
    });

    if (!decoration) {
      return { success: false, error: "Decoración no encontrada." };
    }

    if (decoration.profileId !== profile.id) {
      return { success: false, error: "No tienes permiso para eliminar esta decoración." };
    }

    const config = DECORATIONS_CONFIG[decoration.type];
    const refund = config ? config.cost : 0;

    // Refund seeds and delete decoration in a transaction
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: profile.id },
        data: {
          seeds: {
            increment: refund,
          },
        },
      }),
      prisma.biomeDecoration.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error deleting decoration:", err);
    return { success: false, error: "Error al eliminar la decoración." };
  }
}
