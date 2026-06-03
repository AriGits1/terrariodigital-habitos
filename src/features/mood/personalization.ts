// Personalización continua — pure mapping from emotional state to biome type.
// The biome morphs to mirror the user's recent mood, so the environment adapts
// continuously instead of being a fixed choice.

import type { BiomeType } from "../biome/biome-logic";

/**
 * Maps an average mood valence (-1..1) to a biome type:
 * - sustained positive  -> lush forest
 * - neutral / balanced   -> calm zen garden
 * - sustained negative   -> harsher desert
 *
 * Hysteresis is intentionally simple here; the averaging window (handled by the
 * caller) is what makes the adaptation "continuous" rather than jumpy.
 */
export function biomeForMood(avgScore: number): BiomeType {
  if (avgScore >= 0.25) return "forest";
  if (avgScore <= -0.2) return "desert";
  return "zen";
}
