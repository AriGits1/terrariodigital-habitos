import type { BiomeType } from "./biome-logic";

export interface BiomeOption {
  type: BiomeType;
  label: string;
  emoji: string;
  desc: string;
}

/** Selectable biomes, shared by onboarding and settings. */
export const BIOME_OPTIONS: BiomeOption[] = [
  { type: "forest", label: "Bosque", emoji: "🌲", desc: "Frondoso y vital" },
  { type: "desert", label: "Desierto", emoji: "🏜️", desc: "Resiliente y sereno" },
  { type: "zen", label: "Jardín Zen", emoji: "🪷", desc: "Calmo y equilibrado" },
];
