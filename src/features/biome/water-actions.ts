"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";
import { packById, applyWatering, WATER_PER_GESTURE } from "./water-logic";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Buy water with seeds. Seeds are spent, water is credited, atomically.
 */
export async function buyWater(packId: string): Promise<ActionResult> {
  try {
    const me = await requireProfile();

    const pack = packById(packId);
    if (!pack) return { success: false, error: "Paquete de agua no válido." };

    const db = await prisma.profile.findUnique({
      where: { id: me.id },
      select: { seeds: true },
    });
    if (!db) return { success: false, error: "Perfil no encontrado." };
    if (db.seeds < pack.seeds) {
      return { success: false, error: "No tienes suficientes semillas." };
    }

    await prisma.profile.update({
      where: { id: me.id },
      data: {
        seeds: { decrement: pack.seeds },
        water: { increment: pack.water },
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error buying water:", err);
    return { success: false, error: "Error al comprar agua." };
  }
}

/**
 * Claim a received "agua" gesture into the water balance. Idempotent: the
 * `claimed` flag and the WHERE filter prevent double-crediting.
 */
export async function claimWater(encouragementId: string): Promise<ActionResult> {
  try {
    const me = await requireProfile();

    // Scope to my own unclaimed water gestures only.
    const enc = await prisma.encouragement.findFirst({
      where: {
        id: encouragementId,
        toProfileId: me.id,
        type: "water",
        claimed: false,
      },
      select: { id: true },
    });
    if (!enc) {
      return { success: false, error: "Esta agua ya fue reclamada o no existe." };
    }

    await prisma.$transaction([
      prisma.encouragement.updateMany({
        where: { id: enc.id, toProfileId: me.id, claimed: false },
        data: { claimed: true, read: true },
      }),
      prisma.profile.update({
        where: { id: me.id },
        data: { water: { increment: WATER_PER_GESTURE } },
      }),
    ]);

    revalidatePath("/comunidad");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error claiming water:", err);
    return { success: false, error: "Error al reclamar el agua." };
  }
}

/**
 * Pour water onto the biome: spends `amount` water (capped at the balance) and
 * raises the cached biome growth/health via the pure applyWatering rules.
 */
export async function waterTheBiome(amount: number): Promise<ActionResult> {
  try {
    const me = await requireProfile();

    const profile = await prisma.profile.findUnique({
      where: { id: me.id },
      select: { water: true, biome: { select: { growth: true, health: true } } },
    });
    if (!profile) return { success: false, error: "Perfil no encontrado." };

    const toUse = Math.min(Math.max(0, Math.floor(amount)), profile.water);
    if (toUse <= 0) {
      return { success: false, error: "No tienes agua para regar." };
    }

    const current = {
      growth: profile.biome?.growth ?? 20,
      health: profile.biome?.health ?? 80,
    };
    const next = applyWatering(current, toUse);

    await prisma.$transaction([
      prisma.profile.update({
        where: { id: me.id },
        data: { water: { decrement: next.waterUsed } },
      }),
      prisma.biomeState.upsert({
        where: { profileId: me.id },
        update: { growth: next.growth, health: next.health },
        create: {
          profileId: me.id,
          growth: next.growth,
          health: next.health,
        },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error watering biome:", err);
    return { success: false, error: "Error al regar el bioma." };
  }
}
