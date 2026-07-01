"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

// Types

interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string | null;
  pad?: number;
  tightBounds?: boolean;
}

//  Steps

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a tu Terrario Digital! 🌿",
    description:
      "Este es tu ecosistema vivo: cada hábito que completes hace crecer la flora. Si los abandonas, el bioma decae. Vamos a hacer un tour rápido para que conozcas qué hace cada parte.",
    target: null,
  },
  {
    id: "biome",
    title: "🌲 Tu Bioma 3D",
    description:
      "El terreno 3D que ves detrás es tu bioma vivo. Sus árboles, flores o cactus crecen cuando completas hábitos y se marchitan si los abandonas. Puedes orbitar la cámara arrastrando con el mouse o el dedo.",
    target: null,
  },
  {
    id: "stats",
    title: "📊 Tus estadísticas",
    description:
      "Estas tarjetas muestran el tipo de bioma, el % de crecimiento, la salud y tu racha de días consecutivos 🔥. Mantener la racha activa es el corazón del juego.",
    target: "stats",
    pad: 12,
    tightBounds: true,
  },
  {
    id: "nav",
    title: "🧭 Navegación principal",
    description:
      "Estos botones te llevan a las distintas secciones:\n• 🤖 Coach — tu asistente de IA: sugiere hábitos, analiza tu progreso y te guía en ejercicios de respiración\n• 🎤 Diario — registra tu estado de ánimo con voz o texto\n• 🏪 Tienda — compra decoraciones y agua con tus semillas",
    target: "nav",
    pad: 10,
    tightBounds: true,
  },
  {
    id: "habits",
    title: "✅ Panel de Hábitos",
    description:
      "Aquí está tu lista de hábitos del día. Marca cada uno al completarlo: ganarás semillas 🌱 automáticamente y el bioma crecerá. Puedes agregar hasta 5 hábitos activos y cerrar el panel con la ✕.",
    target: "habits",
    pad: 12,
    tightBounds: true,
  },
  {
    id: "coach",
    title: "🤖 Coach — tu asistente principal",
    description:
      "El botón Coach está en la barra de navegación superior, siempre visible. Abre un chat con IA que conoce tus hábitos actuales y te da sugerencias concretas. Puede agregar o eliminar hábitos por ti y guiarte en respiración guiada.",
    target: "coach",
    pad: 10,
  },
  {
    id: "seeds",
    title: "🌱 Semillas — tu moneda del juego",
    description:
      "Las semillas las ganas marcando hábitos como completados — no se compran. Úsalas en la Tienda para comprar decoraciones para tu bioma o agua 💧 para regar el río.\n\nEl botón 💧 Regar aparece debajo de las tarjetas de stats cuando tienes agua disponible.",
    target: "settings",
    pad: 14,
  },
  {
    id: "diary",
    title: "🎤 Diario de Ánimo",
    description:
      "Desde la sección Diario puedes registrar cómo te sientes usando voz, texto o tarjetas de ánimo. La IA analiza tu estado emocional y adapta el tipo de bioma con el tiempo (bosque, desierto o zen).",
    target: "nav",
    pad: 10,
    tightBounds: true,
  },
  {
    id: "done",
    title: "¡Listo para empezar! 🚀",
    description:
      "Ya conoces todo lo básico. Empieza agregando tu primer hábito en el panel, o explora el bioma rotando la cámara. Puedes volver a ver este tutorial con el botón ❓ junto al ⚙️ de configuración.",
    target: null,
  },
];

const STORAGE_KEY = "terrario_tour_done_v1";
const PAD_DEFAULT = 12;

function getElementRect(el: Element, tight: boolean): SpotRect | null {
  if (!tight) {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }

  const children = Array.from(el.children).filter((c) => {
    const r = c.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (!children.length) {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }

  let top = Infinity, left = Infinity, bottom = -Infinity, right = -Infinity;
  for (const child of children) {
    const r = child.getBoundingClientRect();
    top    = Math.min(top,    r.top);
    left   = Math.min(left,   r.left);
    bottom = Math.max(bottom, r.bottom);
    right  = Math.max(right,  r.right);
  }
  return { top, left, width: right - left, height: bottom - top };
}

// Spotlight SVG

function SpotlightOverlay({
  rect,
  pad,
  vw,
  vh,
}: {
  rect: SpotRect | null;
  pad: number;
  vw: number;
  vh: number;
}) {
  if (!rect) {
    // Full dark, no hole
    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={vw}
        height={vh}
        style={{ display: "block" }}
      >
        <rect width={vw} height={vh} fill="rgba(0,0,0,0.82)" />
      </svg>
    );
  }

  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const r = 14; // border-radius of the hole

  // SVG path: outer rect with a rounded-rect hole (clip-rule evenodd)
  const holePath = `
    M ${x + r} ${y}
    H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r}
    V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h}
    H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r}
    V ${y + r} Q ${x} ${y} ${x + r} ${y} Z
  `;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={vw}
      height={vh}
      style={{ display: "block" }}
    >
      <defs>
        {/* Soft glow filter for the highlight ring */}
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark overlay with hole */}
      <path
        fillRule="evenodd"
        d={`M 0 0 H ${vw} V ${vh} H 0 Z ${holePath}`}
        fill="rgba(0,0,0,0.80)"
      />

      {/* Glowing border ring around the highlighted element */}
      <rect
        x={x - 2}
        y={y - 2}
        width={w + 4}
        height={h + 4}
        rx={r + 2}
        ry={r + 2}
        fill="none"
        stroke="rgba(52,211,153,0.7)"
        strokeWidth="2.5"
        filter="url(#glow)"
      />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TourOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState<SpotRect | null>(null);
  const [vw, setVw] = useState(1440);
  const [vh, setVh] = useState(900);

  // Read viewport size
  useLayoutEffect(() => {
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    const handler = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Show on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {/* localStorage blocked */}
  }, []);

  // Recompute spotlight rect when step or visibility changes
  useEffect(() => {
    if (!visible) return;
    const current = STEPS[step];
    if (!current.target) {
      setSpotRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (!el) { setSpotRect(null); return; }
    const rect = getElementRect(el, current.tightBounds ?? false);
    setSpotRect(rect);
  }, [step, visible, vw, vh]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {/* ignore */}
    setVisible(false);
  }, []);

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }
  function prev() { if (step > 0) setStep((s) => s - 1); }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const pad = current.pad ?? PAD_DEFAULT;

  return (
    <div className="fixed inset-0 z-[9000]">
      {/* ── Spotlight SVG (behind card, above biome) ── */}
      <div className="absolute inset-0 pointer-events-auto">
        <SpotlightOverlay
          rect={spotRect}
          pad={pad}
          vw={vw}
          vh={vh}
        />
      </div>

      {/* ── Centered card (always middle of screen) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
        <div
          key={step}
          className="pointer-events-auto w-full max-w-sm animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="relative rounded-2xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 max-h-[85vh] overflow-y-auto">

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition"
              aria-label="Cerrar tutorial"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Progress dots */}
            <div className="mb-4 flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-emerald-400"
                      : i < step
                      ? "w-1.5 bg-emerald-600"
                      : "w-1.5 bg-white/20"
                  }`}
                  aria-label={`Ir al paso ${i + 1}`}
                />
              ))}
            </div>

            {/* Content */}
            <h3 className="mb-2 text-base font-semibold text-white leading-tight">
              {current.title}
            </h3>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
              {current.description}
            </p>

            {/* Navigation */}
            <div className="mt-5 flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/20 hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
              )}
              <button
                onClick={next}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isLast
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {isLast ? "¡Empezar! 🌿" : (<>Siguiente <ChevronRight className="h-4 w-4" /></>)}
              </button>
            </div>

            {/* Skip */}
            {!isLast && (
              <button
                onClick={dismiss}
                className="mt-3 w-full text-center text-xs text-white/30 hover:text-white/50 transition"
              >
                Saltar tutorial
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
