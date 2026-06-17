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

/** What kind of flora grows in each biome. */
export type MainPlantKind = "tree" | "cactus" | "flower";

export function plantKind(type: BiomeType): MainPlantKind {
  if (type === "desert") return "cactus";
  if (type === "zen") return "flower";
  return "tree";
}

export type VegetationKind = "main" | "grass" | "bush" | "smallFlower" | "rock";

/** Distinct petal colors for the zen garden's flowers. */
const FLOWER_PALETTE = [
  "#e8638f", // pink
  "#f4b740", // amber
  "#d65bd1", // magenta
  "#ff6f5e", // coral
  "#f3f0ea", // white
  "#9b7bff", // violet
];

export function flowerColor(i: number): string {
  return FLOWER_PALETTE[i % FLOWER_PALETTE.length];
}

/**
 * Ground / terrain base color per biome type. Greens for forest and zen (the
 * floor lighter than its flora for contrast), sand for the desert.
 */
export function groundColor(type: BiomeType): string {
  switch (type) {
    case "desert":
      return "#e3c178"; // warm sand
    case "zen":
      return "#a6cf8c"; // pale green — lighter than the forest floor
    case "forest":
    default:
      return "#6fa856"; // light grass green — lighter than the darker trees
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
  id: string;
  kind: VegetationKind;
  x: number;
  z: number;
  scale: number;
  lean: number;
  habitId?: string;
  habitTitle?: string;
  dayIndex: number;
  health: number;
}

/** Check if a candidate position is too close to any existing placement. */
function isTooClose(
  x: number,
  z: number,
  placements: PlantPlacement[],
  minDist: number,
): boolean {
  for (const p of placements) {
    const dx = p.x - x;
    const dz = p.z - z;
    if (dx * dx + dz * dz < minDist * minDist) return true;
  }
  return false;
}

/**
 * Generates a position within the circular terrain at a random angle and
 * distance, retrying up to `maxAttempts` times to satisfy the minimum spacing.
 * Returns null if no valid spot is found.
 */
function findPosition(
  rand: () => number,
  radius: number,
  minDist: number,
  innerRadius: number,
  placements: PlantPlacement[],
  maxAttempts = 10,
): { x: number; z: number } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const angle = rand() * Math.PI * 2;
    const dist = innerRadius + Math.sqrt(rand()) * (radius - innerRadius);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (!isTooClose(x, z, placements, minDist)) {
      return { x, z };
    }
  }
  return null;
}

/**
 * Free-placement plant layout based on the full week of habit history.
 * Plants are scattered randomly across the entire circular terrain with
 * minimum spacing constraints:
 *   - Main trees/plants: 2.8 units minimum between each other
 *   - Secondary flora (grass, bush, flowers): 0.9 units minimum
 * The terrain radius is 11 units (larger than before) to accommodate more vegetation.
 */
export function generateBiomeVegetation(
  daysData: { dayIndex: number; habits: { id: string; title: string; weight: number; status: "completed" | "pending" | "failed" }[] }[]
): PlantPlacement[] {
  const placements: PlantPlacement[] = [];
  let seed = 1337;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const TERRAIN_RADIUS = 11;   // larger terrain so vegetation fits comfortably
  const INNER_RADIUS = 1.2;    // keep a small clear zone at center
  const MAIN_MIN_DIST = 2.8;   // min distance between main trees/plants
  const DECO_MIN_DIST = 0.9;   // min distance between secondary flora

  for (const day of daysData) {
    for (const h of day.habits) {
      if (h.status === "completed") {
        // Find a spot for the main plant
        const pos = findPosition(rand, TERRAIN_RADIUS, MAIN_MIN_DIST, INNER_RADIUS, placements);
        if (pos) {
          const finalScale = (0.6 + rand() * 0.4) + (h.weight * 0.15);
          placements.push({
            id: `main-${h.id}-${day.dayIndex}`,
            kind: "main",
            x: pos.x,
            z: pos.z,
            scale: finalScale,
            lean: (rand() - 0.5) * 0.15,
            habitId: h.id,
            habitTitle: h.title,
            dayIndex: day.dayIndex,
            health: 100,
          });

          // Spawn secondary flora scattered around its own spot
          const extraFlora = h.weight * 2;
          for (let i = 0; i < extraFlora; i++) {
            const decoPos = findPosition(rand, TERRAIN_RADIUS, DECO_MIN_DIST, INNER_RADIUS, placements);
            if (!decoPos) continue;

            const r = rand();
            let kind: VegetationKind = "grass";
            if (r > 0.8) kind = "bush";
            else if (r > 0.6) kind = "smallFlower";
            else if (r > 0.5) kind = "rock";

            placements.push({
              id: `deco-${day.dayIndex}-${h.id}-${i}`,
              kind,
              x: decoPos.x,
              z: decoPos.z,
              scale: 0.4 + rand() * 0.6,
              lean: (rand() - 0.5) * 0.3,
              dayIndex: day.dayIndex,
              health: 100,
            });
          }
        }
      } else if (h.status === "pending") {
        const pos = findPosition(rand, TERRAIN_RADIUS, MAIN_MIN_DIST, INNER_RADIUS, placements);
        if (pos) {
          placements.push({
            id: `main-${h.id}-${day.dayIndex}`,
            kind: "main",
            x: pos.x,
            z: pos.z,
            scale: 0.6 + rand() * 0.4,
            lean: (rand() - 0.5) * 0.15,
            habitId: h.id,
            habitTitle: h.title,
            dayIndex: day.dayIndex,
            health: 80,
          });
        }
      } else {
        // Failed — withered, fallen
        const pos = findPosition(rand, TERRAIN_RADIUS, MAIN_MIN_DIST, INNER_RADIUS, placements);
        if (pos) {
          placements.push({
            id: `main-${h.id}-${day.dayIndex}`,
            kind: "main",
            x: pos.x,
            z: pos.z,
            scale: 0.5 + rand() * 0.3,
            lean: (Math.PI / 2.5) * (rand() > 0.5 ? 1 : -1),
            habitId: h.id,
            habitTitle: h.title,
            dayIndex: day.dayIndex,
            health: 15,
          });
        }
      }
    }
  }

  return placements;
}
