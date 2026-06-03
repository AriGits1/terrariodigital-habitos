// Pure presentational logic for the 3D biome. No React, no Three.js — just
// maps the domain state (growth/health/type) into render parameters. Kept
// separate so it can be unit-tested and reasoned about independently.

export type BiomeType = "forest" | "desert" | "zen";

export const MAX_PLANTS = 24;

/** Clamp a number into [min, max]. */
export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Number of plants to render. Scales with `growth` (0-100) but always keeps at
 * least a couple so the scene is never empty.
 */
export function plantCount(growth: number): number {
  const g = clamp(growth) / 100;
  return Math.max(3, Math.round(g * MAX_PLANTS));
}

/** Vitality 0..1 derived from health — drives color and droop. */
export function vitality(health: number): number {
  return clamp(health) / 100;
}

/** Ground / terrain base color per biome type. */
export function groundColor(type: BiomeType): string {
  switch (type) {
    case "desert":
      return "#d9b380";
    case "zen":
      return "#cdd7c6";
    case "forest":
    default:
      return "#3f6b3a";
  }
}

/** Sky/background color per biome type. */
export function skyColor(type: BiomeType): string {
  switch (type) {
    case "desert":
      return "#f4d9a6";
    case "zen":
      return "#e9eef3";
    case "forest":
    default:
      return "#bfe3c0";
  }
}

/**
 * Foliage color interpolated between a withered brown (low health) and a lush
 * tone appropriate to the biome (high health).
 */
export function foliageColor(type: BiomeType, health: number): string {
  const v = vitality(health);
  const withered = { r: 0x8a, g: 0x6d, b: 0x3a }; // dry brown
  const lush =
    type === "desert"
      ? { r: 0x6f, g: 0x9e, b: 0x57 } // muted sage
      : type === "zen"
        ? { r: 0x7d, g: 0xb3, b: 0x8a } // soft jade
        : { r: 0x2e, g: 0xa0, b: 0x44 }; // vivid forest green

  const lerp = (a: number, b: number) => Math.round(a + (b - a) * v);
  const r = lerp(withered.r, lush.r);
  const g = lerp(withered.g, lush.g);
  const b = lerp(withered.b, lush.b);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export interface PlantPlacement {
  x: number;
  z: number;
  scale: number;
  /** Lean angle (radians) — withered plants droop more. */
  lean: number;
}

/**
 * Deterministic plant layout. Uses a small seeded PRNG so positions stay stable
 * across re-renders and reloads (no jitter), while still looking organic.
 */
export function plantLayout(count: number, health: number): PlantPlacement[] {
  const v = vitality(health);
  const placements: PlantPlacement[] = [];
  let seed = 1337;
  const rand = () => {
    // Mulberry32 PRNG — deterministic given the seed.
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const radius = 6;
  for (let i = 0; i < count; i++) {
    // Spread plants on a disc using rejection-free polar sampling.
    const angle = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand()) * radius;
    placements.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      scale: 0.6 + rand() * 0.8,
      // Healthy plants stand upright; withered ones lean up to ~0.4 rad.
      lean: (1 - v) * (rand() * 0.4),
    });
  }
  return placements;
}
