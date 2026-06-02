import type { MetadataRoute } from "next";

// Web App Manifest — makes the app installable on mobile (add to home screen)
// and launchable full-screen, like a native app. Next serves this at
// /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Terrario Digital de Hábitos y Bienestar",
    short_name: "Terrario",
    description:
      "Tus hábitos diarios construyen un ecosistema 3D vivo. Diario por voz, agentes de IA y gamificación.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f3d2e",
    theme_color: "#0f3d2e",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
