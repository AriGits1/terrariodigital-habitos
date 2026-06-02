"use client";

import { useEffect } from "react";

/** Registers the service worker so the app is installable as a PWA. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app works without it.
      });
    }
  }, []);
  return null;
}
