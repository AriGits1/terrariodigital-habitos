// Pure lighting/color data for each phase of the day.
// Consumed by BiomeScene to drive dynamic illumination without React state.

import type { BiomeType } from "./biome-logic";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

/** Returns the current day phase based on the local hour (0-23). */
export function getCurrentPhase(hour: number): DayPhase {
  if (hour >= 5  && hour < 9)  return "dawn";
  if (hour >= 9  && hour < 18) return "day";
  if (hour >= 18 && hour < 21) return "dusk";
  return "night";
}

export interface PhaseColors {
  /** Canvas background / sky color. */
  sky: string;
  /** HemisphereLight sky color (top light). */
  hemiSky: string;
  /** HemisphereLight ground color (bounce light). */
  hemiGround: string;
  /** HemisphereLight intensity. */
  hemiIntensity: number;
  /** AmbientLight intensity. */
  ambientIntensity: number;
  /** DirectionalLight color (sun or moon). */
  sunColor: string;
  /** DirectionalLight intensity. */
  sunIntensity: number;
  /** DirectionalLight position [x,y,z]. */
  sunPosition: [number, number, number];
  /** Fog near/far distance. */
  fogNear: number;
  fogFar: number;
}

// Per-biome sky palettes so the night sky in a desert looks different from the forest.
const NIGHT_SKY: Record<BiomeType, string> = {
  forest: "#0a1628",
  desert: "#0d1a35",
  zen:    "#111827",
};

const DUSK_SKY: Record<BiomeType, string> = {
  forest: "#4a2060",
  desert: "#c2521a",
  zen:    "#6b3080",
};

const DAWN_SKY: Record<BiomeType, string> = {
  forest: "#f5a55a",
  desert: "#f8c56b",
  zen:    "#f0b8d8",
};

export function getPhaseColors(phase: DayPhase, biome: BiomeType): PhaseColors {
  switch (phase) {
    case "dawn":
      return {
        sky:            DAWN_SKY[biome],
        hemiSky:        "#f9c87a",
        hemiGround:     "#5a7c3a",
        hemiIntensity:  0.6,
        ambientIntensity: 0.35,
        sunColor:       "#ffcc77",
        sunIntensity:   0.8,
        sunPosition:    [8, 4, 6],
        fogNear: 22, fogFar: 50,
      };

    case "day":
      return {
        sky:            biome === "desert" ? "#f4d9a6" : biome === "zen" ? "#e9eef3" : "#bfe3c0",
        hemiSky:        "#87ceeb",
        hemiGround:     "#6fa856",
        hemiIntensity:  0.7,
        ambientIntensity: 0.4,
        sunColor:       "#fffde8",
        sunIntensity:   1.1,
        sunPosition:    [6, 12, 6],
        fogNear: 24, fogFar: 48,
      };

    case "dusk":
      return {
        sky:            DUSK_SKY[biome],
        hemiSky:        "#c2654a",
        hemiGround:     "#3a2a1a",
        hemiIntensity:  0.45,
        ambientIntensity: 0.25,
        sunColor:       "#ff7a3a",
        sunIntensity:   0.7,
        sunPosition:    [-8, 3, 6],
        fogNear: 18, fogFar: 40,
      };

    case "night":
      return {
        sky:            NIGHT_SKY[biome],
        hemiSky:        "#0a1a40",
        hemiGround:     "#0a0f0d",
        hemiIntensity:  0.15,
        ambientIntensity: 0.08,
        sunColor:       "#d0e8ff",  // moonlight — cool blueish white
        sunIntensity:   0.25,
        sunPosition:    [-6, 10, -4],
        fogNear: 16, fogFar: 36,
      };
  }
}
