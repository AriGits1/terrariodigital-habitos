"use client";

import { useEffect, useState } from "react";

/**
 * Registers /sw.js and handles the SW lifecycle:
 * - On first install: silent (the app just becomes installable).
 * - On update (new SW waiting): shows a toast so the user can refresh.
 */
export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // A new SW is already waiting (e.g. user has a tab open for a while).
        if (reg.waiting) {
          setUpdateReady(true);
        }

        // A new SW finished installing while this page is open.
        reg.addEventListener("updatefound", () => {
          const incoming = reg.installing;
          if (!incoming) return;
          incoming.addEventListener("statechange", () => {
            if (incoming.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        // Non-fatal — the app works without the SW.
      });
  }, []);

  function applyUpdate() {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
    setUpdateReady(false);
    window.location.reload();
  }

  if (!updateReady) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-xl shadow-emerald-500/30"
    >
      <span>Nueva versión disponible</span>
      <button
        onClick={applyUpdate}
        className="rounded-full bg-black/15 px-3 py-1 text-xs hover:bg-black/25 transition"
      >
        Actualizar
      </button>
    </div>
  );
}
