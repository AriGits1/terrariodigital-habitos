// Pure adaptation engine — no DB, no React, no Next.js.
// Unit-tested in isolation via engine.test.ts.

// Recency-weighted smoothing constant. α≈0.3 → effective window ~6 interactions.
// Demo-tuning risk: real-use α=0.2 (~5-interaction window) barely moves during a
// short evaluator session. We ship a HIGHER default (0.3) so adaptation is visible
// in a brief demo, and expose it as an override-able parameter (see updateEwma's
// `alpha` arg + ADAPTATION_ALPHA constant) so a demo build can push it to 0.5
// WITHOUT touching call sites.
export const ADAPTATION_ALPHA = 0.3;

// Suggestion thresholds on the per-habit EWMA (0..1 weighted completion ratio).
export const LEVEL_UP_THRESHOLD = 0.85; // sustained near-perfect → propose harder
export const EASE_THRESHOLD = 0.35;     // sustained struggle    → propose easier
// Dead-zone = [EASE_THRESHOLD, LEVEL_UP_THRESHOLD]; inside it the suggestion is "hold".

export type DifficultySuggestion = "level-up" | "ease" | "hold";

/** Core EWMA step. `prev` defaults to `value` on first observation (no cold-start bias). */
export function updateEwma(
  prev: number | null | undefined,
  value: number,
  alpha: number = ADAPTATION_ALPHA,
): number {
  if (prev == null) return value;
  return alpha * value + (1 - alpha) * prev;
}

/** Per-habit completion signal: 1 when completed today, 0 otherwise. Thin wrapper for intent clarity. */
export function updateHabitEwma(prev: number | null | undefined, completed: boolean, alpha = ADAPTATION_ALPHA): number {
  return updateEwma(prev, completed ? 1 : 0, alpha);
}

/** Mood valence EWMA. `score` is the MoodEntry valence (-1..1). */
export function updateMoodEwma(prev: number | null | undefined, score: number, alpha = ADAPTATION_ALPHA): number {
  return updateEwma(prev, score, alpha);
}

/** Engagement EWMA per module key: 1 on an interaction with that module, decayed otherwise. */
export function updateEngagementEwma(prev: number | null | undefined, engaged: boolean, alpha = ADAPTATION_ALPHA): number {
  return updateEwma(prev, engaged ? 1 : 0, alpha);
}

/**
 * Difficulty suggestion with an explicit HOLD dead-zone (gradual change guardrail).
 * - ewmaScore ≥ LEVEL_UP_THRESHOLD AND currentWeight < 5 → "level-up"
 * - ewmaScore ≤ EASE_THRESHOLD     AND currentWeight > 1 → "ease"
 * - otherwise → "hold"  (covers the dead-zone AND weight already at the 1..5 edge)
 */
export function suggestHabitDifficulty(ewmaScore: number, currentWeight: number): DifficultySuggestion {
  if (ewmaScore >= LEVEL_UP_THRESHOLD && currentWeight < 5) return "level-up";
  if (ewmaScore <= EASE_THRESHOLD && currentWeight > 1) return "ease";
  return "hold";
}

/** New weight a "level-up"/"ease" suggestion proposes, clamped to the existing 1..5 range. */
export function nextWeight(suggestion: DifficultySuggestion, currentWeight: number): number {
  if (suggestion === "level-up") return Math.min(5, currentWeight + 1);
  if (suggestion === "ease") return Math.max(1, currentWeight - 1);
  return currentWeight;
}

export const MODULE_KEYS = ["diario", "analiticas", "mindfulness"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

// Mood-trend thresholds. REUSED from biomeForMood (biome/personalization.ts) so the
// whole product reads the same emotional state the same way: ≤ -0.2 is a negative
// trend, ≥ 0.25 is a positive trend, in-between is neutral.
export const MOOD_NEGATIVE_THRESHOLD = -0.2;
export const MOOD_POSITIVE_THRESHOLD = 0.25;
// Below this engagement EWMA a module is "neglected" and earns a gentle nudge / boost.
export const LOW_ENGAGEMENT_THRESHOLD = 0.3;

/**
 * Orders the home nav modules. MOOD is the PRIMARY driver (mirrors the spec's
 * Surface-2 policy); engagement EWMA is only a SECONDARY tiebreaker.
 *
 * Ordering policy:
 *   - moodEwma ≤ MOOD_NEGATIVE_THRESHOLD (negative): mindfulness, diario, analiticas
 *       → put breathing + reframe FIRST, defer progress/analytics.
 *   - moodEwma ≥ MOOD_POSITIVE_THRESHOLD (positive): analiticas, diario, mindfulness
 *       → celebrate progress FIRST.
 *   - neutral: engagement-based — LOWEST-engagement module first, as a re-engagement
 *       nudge (a neglected module is surfaced so the user rediscovers it). Ties fall
 *       back to canonical MODULE_KEYS order for determinism.
 *
 * Always returns the full MODULE_KEYS set, never partial, never invents a key.
 */
export function getModuleOrder(
  moodEwma: number,
  engagementEwma: Partial<Record<ModuleKey, number>>,
): ModuleKey[] {
  if (moodEwma <= MOOD_NEGATIVE_THRESHOLD) return ["mindfulness", "diario", "analiticas"];
  if (moodEwma >= MOOD_POSITIVE_THRESHOLD) return ["analiticas", "diario", "mindfulness"];
  // Neutral: ascending engagement (lowest first = re-engagement nudge), stable tie-break.
  return [...MODULE_KEYS].sort((a, b) => {
    const diff = (engagementEwma[a] ?? 0) - (engagementEwma[b] ?? 0);
    return diff !== 0 ? diff : MODULE_KEYS.indexOf(a) - MODULE_KEYS.indexOf(b);
  });
}

/** True when a module's engagement EWMA is below the low-engagement nudge threshold. */
export function isLowEngagement(engagementEwma: Partial<Record<ModuleKey, number>>, key: ModuleKey): boolean {
  return (engagementEwma[key] ?? 0) < LOW_ENGAGEMENT_THRESHOLD;
}
