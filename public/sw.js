// Terrario Digital — Service Worker
// Estrategia dual:
//   - Cache-First  → assets estáticos (JS, CSS, imágenes, fuentes, Three.js)
//   - Network-First → navegaciones de página (siempre frescas si hay red)
// Fallback offline: página /offline.html en vez de error del navegador.

const CACHE_VERSION = "terrario-v2";
const ASSET_CACHE   = `${CACHE_VERSION}-assets`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;

// Rutas de página que pre-cacheamos en el install para que el shell
// funcione inmediatamente aunque la red sea lenta.
const PRECACHE_PAGES = ["/", "/diario", "/analiticas", "/mindfulness", "/offline.html"];

// Extensiones que se tratan como assets estáticos (Cache-First).
const STATIC_EXTENSIONS = /\.(js|mjs|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp|glb|gltf)(\?.*)?$/;

// ── Message ────────────────────────────────────────────────────────────────
// When the client sends SKIP_WAITING the new SW takes over immediately,
// allowing the "update available" toast to trigger a clean reload.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) =>
        cache.addAll(
          PRECACHE_PAGES.map((url) => new Request(url, { cache: "reload" }))
        )
      )
      .catch(() => {
        // Non-fatal: if a precache URL fails (e.g. /diario needs auth)
        // the SW still installs — individual pages will be cached on visit.
      })
      .finally(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== ASSET_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET, cross-origin and Next.js internal requests.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // ── Strategy 1: Cache-First for static assets ─────────────────────────
  // JS chunks, CSS, images, fonts — these are content-addressed by Next.js
  // (filename includes hash), so a cached copy is always valid.
  if (STATIC_EXTENSIONS.test(url.pathname) || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch {
          // Static asset not in cache and no network — nothing to show.
          return new Response("Asset not available offline", { status: 503 });
        }
      })
    );
    return;
  }

  // ── Strategy 2: Network-First for page navigations ────────────────────
  // Try the network (always fresh); on failure serve the cached version of
  // that page or fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          // Cache a copy of successful navigation responses.
          if (response.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          // Network failed — serve cached page or offline fallback.
          const cached = await caches.match(request);
          if (cached) return cached;

          const offline = await caches.match("/offline.html");
          return (
            offline ??
            new Response("<h1>Sin conexión</h1>", {
              headers: { "Content-Type": "text/html" },
            })
          );
        })
    );
    return;
  }
});

// ── Web Push Notifications ──────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Terrario Digital", body: "Revisa tus hábitos!" };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
      data: {
        url: "/", 
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Si la app ya está abierta, enfocamos esa pestaña
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Si no, abrimos una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
