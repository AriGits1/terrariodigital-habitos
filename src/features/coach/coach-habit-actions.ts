"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";

/**
 * Agrega un hábito desde el Coach. Respeta el límite de 5 hábitos activos.
 * Retorna el hábito creado o null si ya se alcanzó el límite.
 */
export async function coachAddHabit(
  title: string,
  weight: number,
): Promise<{ success: boolean; error?: string }> {
  const profile = await requireProfile();
  const clean = title.trim();
  if (!clean) return { success: false, error: "El título no puede estar vacío." };

  const count = await prisma.habit.count({
    where: { profileId: profile.id, archived: false },
  });
  if (count >= 5) {
    return {
      success: false,
      error: "Ya tienes 5 hábitos activos (límite máximo). Elimina uno antes de agregar.",
    };
  }

  await prisma.habit.create({
    data: {
      profileId: profile.id,
      title: clean,
      weight: Math.max(1, Math.min(5, weight)),
    },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * Archiva (elimina suavemente) un hábito desde el Coach.
 * Verifica que el hábito pertenezca al perfil en sesión (anti-IDOR).
 */
export async function coachArchiveHabit(
  habitId: string,
): Promise<{ success: boolean; error?: string }> {
  const profile = await requireProfile();

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { profileId: true, title: true },
  });

  if (!habit) return { success: false, error: "Hábito no encontrado." };
  if (habit.profileId !== profile.id) {
    return { success: false, error: "No tienes permiso para eliminar ese hábito." };
  }

  await prisma.habit.update({
    where: { id: habitId },
    data: { archived: true },
  });

  revalidatePath("/");
  return { success: true };
}
