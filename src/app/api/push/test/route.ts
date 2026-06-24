import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProfile } from "@/features/auth/guards";
import webpush from "web-push";

// Configurar llaves de web-push desde las variables de entorno
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:soporte@terrariodigital.com", // Puedes poner un mail genérico
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST() {
  try {
    const profile = await requireProfile();

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "VAPID keys not configured" },
        { status: 500 }
      );
    }

    // Buscar la suscripción más reciente del perfil actual
    const subscription = await prisma.pushSubscription.findFirst({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No hay ninguna suscripción activa para este usuario" },
        { status: 404 }
      );
    }

    // Enviar notificación a través de web-push
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const payload = JSON.stringify({
      title: "Terrario Digital",
      body: "¡Tus plantas necesitan atención! Registra tus hábitos hoy. 🌱",
    });

    await webpush.sendNotification(pushSubscription, payload);

    return NextResponse.json({ success: true, message: "Notificación enviada" });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: "Error interno al enviar la notificación" },
      { status: 500 }
    );
  }
}
