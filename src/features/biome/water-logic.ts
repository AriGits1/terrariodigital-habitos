// Pure water economy — no DB, no React. Maps the user's water balance into
// river render parameters and into biome vitality gains. Kept separate so the
// rules are unit-testable and the server actions stay thin wrappers.

import { clamp } from "./biome-logic";

/** Water balance that renders a full-caudal river. */
export const WATER_FULL = 100;

/** Water credited when the user claims one received "agua" gesture. */
export const WATER_PER_GESTURE = 10;

/** How much one unit of water raises each vital when watering the biome. */
export const GROWTH_PER_WATER = 0.8;
export const HEALTH_PER_WATER = 1.2;

export interface WaterPack {
  id: string;
  label: string;
  /** Seed cost. */
  seeds: number;
  /** Water granted. */
  water: number;
  emoji: string;
}

/** Buyable water bundles in the Tienda (seeds -> water). */
export const WATER_PACKS: WaterPack[] = [
  { id: "drop", label: "Gota", seeds: 20, water: 10, emoji: "💧" },
  { id: "stream", label: "Arroyo", seeds: 90, water: 50, emoji: "🌊" },
  { id: "flood", label: "Crecida", seeds: 160, water: 100, emoji: "🏞️" },
];

export function packById(id: string): WaterPack | undefined {
  return WATER_PACKS.find((p) => p.id === id);
}

export interface Caudal {
  /** 0..1 fill level of the river. */
  level: number;
  /** River width in world units. */
  width: number;
  /** Flow animation speed. */
  flowSpeed: number;
  /** Surface opacity. */
  opacity: number;
}

/** River visual parameters scaled by the current water balance. */
export function caudal(water: number): Caudal {
  const level = clamp(water, 0, WATER_FULL) / WATER_FULL;
  return {
    level,
    width: 1.2 + level * 4.0,
    flowSpeed: 0.15 + level * 0.85,
    opacity: 0.45 + level * 0.4,
  };
}

export interface Vitals {
  growth: number;
  health: number;
}

export interface WateringResult extends Vitals {
  /** Water actually consumed by this watering. */
  waterUsed: number;
}

/**
 * Pour `waterToUse` units onto the biome, raising growth and health (clamped to
 * [5, 100]). Negative or zero water is a no-op. Excess past 100 is spent, not
 * banked — keep the contract simple.
 */
export function applyWatering(vitals: Vitals, waterToUse: number): WateringResult {
  const w = Math.max(0, Math.floor(waterToUse));
  const growth = Math.round(clamp(vitals.growth + w * GROWTH_PER_WATER, 5, 100));
  const health = Math.round(clamp(vitals.health + w * HEALTH_PER_WATER, 5, 100));
  return { growth, health, waterUsed: w };
}
