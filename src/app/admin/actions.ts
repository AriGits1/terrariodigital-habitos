"use server";

import { requireAdmin } from "@/features/auth/guards";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import webpush from "web-push";

export async function addSeedsAction(userId: string, amount: number) {
  await requireAdmin();
  
  await prisma.profile.update({
    where: { id: userId },
    data: { seeds: { increment: amount } },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function setStreakAction(userId: string, streak: number) {
  await requireAdmin();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.profile.update({
    where: { id: userId },
    data: { 
      currentStreak: streak,
      lastActiveDate: today // Ensure it counts as active today so it doesn't decay tomorrow immediately
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function sendPushAction(userId: string, title: string, body: string) {
  await requireAdmin();
  
  const subscription = await prisma.pushSubscription.findFirst({
    where: { profileId: userId },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return { error: "El usuario no tiene una suscripción Push activa." };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { error: "Llaves VAPID no configuradas en el servidor." };
  }

  webpush.setVapidDetails(
    "mailto:soporte@terrariodigital.com",
    vapidPublicKey,
    vapidPrivateKey
  );

  const pushSub = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSub,
      JSON.stringify({ title, body })
    );
    return { success: true };
  } catch (error) {
    console.error("Web Push Error:", error);
    return { error: "Fallo al enviar la notificación push." };
  }
}
