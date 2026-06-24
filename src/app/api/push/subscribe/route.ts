import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";

export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Suscripción inválida" },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;

    // Verificar si ya existe el endpoint para evitar duplicados exactos
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint }
    });

    if (!existing) {
      // Guardar la nueva suscripción para el usuario actual
      await prisma.pushSubscription.create({
        data: {
          profileId: profile.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
