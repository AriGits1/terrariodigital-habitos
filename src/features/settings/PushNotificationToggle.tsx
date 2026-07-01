"use client";

import { useState, useEffect } from "react";

export default function PushNotificationToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) setSubscribed(true);
    } catch (e) {
      console.error(e);
    }
  }

  // Base64 to Uint8Array helper
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handleSubscribe() {
    if (!vapidPublicKey) {
      alert("La clave pública VAPID no está configurada.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Tu navegador no soporta notificaciones Web Push.");
      return;
    }

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "granted") {
        const registration = await navigator.serviceWorker.ready;
        
        // Si hay una suscripción antigua "pegada" con otra llave, puede causar AbortError.
        // Intentamos obtenerla y desuscribirla primero.
        let sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }

        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });

        if (res.ok) {
          setSubscribed(true);
          alert("¡Notificaciones activadas!");
        } else {
          alert("Error al guardar suscripción en el servidor.");
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.name === 'AbortError') {
         alert("Error del servicio push (AbortError). Esto puede ocurrir si estás en modo Incógnito, si tu navegador bloquea notificaciones push, o si la llave VAPID es inválida. Intenta en modo normal.");
      } else {
         alert("Ocurrió un error al intentar suscribirse: " + error.message);
      }
    }
    setLoading(false);
  }

  async function handleTest() {
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      if (res.ok) {
        alert("Notificación de prueba enviada.");
      } else {
        alert("Error al enviar notificación de prueba.");
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (permission === "denied") {
    return (
      <div className="mt-6 rounded-2xl border border-white/5 bg-zinc-800/50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-white">Notificaciones Push</h3>
        <p className="text-xs text-rose-400">Has bloqueado las notificaciones en este navegador.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/5 bg-zinc-800/50 p-5">
      <h3 className="mb-2 text-sm font-semibold text-white">Notificaciones y Recordatorios</h3>
      <p className="mb-4 text-xs text-zinc-400 leading-relaxed">
        Recibe recordatorios amigables si olvidas registrar tus hábitos para que tu bioma no decaiga.
      </p>

      {subscribed ? (
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-center text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
            Suscrito
          </div>
          <button
            onClick={handleTest}
            className="rounded-xl bg-zinc-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-600 transition"
          >
            Probar Notificación
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="rounded-xl bg-emerald-600/80 px-6 py-2.5 text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
        >
          {loading ? "Activando…" : "Activar notificaciones"}
        </button>
      )}
    </div>
  );
}
