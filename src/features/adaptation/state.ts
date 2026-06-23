import { prisma } from "@/lib/db";
import {
  updateHabitEwma,
  updateMoodEwma,
  updateEngagementEwma,
  getModuleOrder,
  isLowEngagement,
  MODULE_KEYS,
  MOOD_NEGATIVE_THRESHOLD,
  MOOD_POSITIVE_THRESHOLD,
  LOW_ENGAGEMENT_THRESHOLD,
} from "./engine";
import type { ModuleKey } from "./engine";

// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------

export interface AdaptationModel {
  habitEwma: Record<string, number>;
  moodEwma: number;
  engagementEwma: Partial<Record<ModuleKey, number>>;
  adaptationReason: string | null;
  moduleOrderOverride: ModuleKey[] | null;
  difficultyOverride: boolean;
}

// ---------------------------------------------------------------------------
// Hand-rolled codec (no zod — see design Detail 2 / D4)
// ---------------------------------------------------------------------------

/** Safe JSON→Record<string,number>: drops non-finite values, returns {} on parse failure. */
function parseNumberMap(raw: string): Record<string, number> {
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

const EMPTY_MODEL: AdaptationModel = {
  habitEwma: {},
  moodEwma: 0,
  engagementEwma: {},
  adaptationReason: null,
  moduleOrderOverride: null,
  difficultyOverride: false,
};

/** Maps a Prisma AdaptationState row → AdaptationModel. */
function parseAdaptationState(row: {
  habitEwma: string;
  moodEwma: number;
  engagementEwma: string;
  adaptationReason: string | null;
  moduleOrderOverride: string | null;
  difficultyOverride: boolean;
}): AdaptationModel {
  let moduleOrderOverride: ModuleKey[] | null = null;
  if (row.moduleOrderOverride) {
    try {
      const parsed = JSON.parse(row.moduleOrderOverride);
      if (
        Array.isArray(parsed) &&
        parsed.every((k) => MODULE_KEYS.includes(k as ModuleKey))
      ) {
        moduleOrderOverride = parsed as ModuleKey[];
      }
    } catch {
      // malformed override — treat as null (engine takes over)
    }
  }

  return {
    habitEwma: parseNumberMap(row.habitEwma),
    moodEwma: row.moodEwma,
    engagementEwma: parseNumberMap(row.engagementEwma) as Partial<Record<ModuleKey, number>>,
    adaptationReason: row.adaptationReason,
    moduleOrderOverride,
    difficultyOverride: row.difficultyOverride,
  };
}

/** Serializes the two JSON-text map fields. */
function serializeMaps(model: AdaptationModel): {
  habitEwma: string;
  engagementEwma: string;
} {
  return {
    habitEwma: JSON.stringify(model.habitEwma),
    engagementEwma: JSON.stringify(model.engagementEwma),
  };
}

// ---------------------------------------------------------------------------
// Transparency string (Detail 8)
// ---------------------------------------------------------------------------

/** Produces a plain-Spanish human-readable reason string (never raw EWMA values). */
export function buildReason(model: AdaptationModel): string {
  if (model.moodEwma <= MOOD_NEGATIVE_THRESHOLD)
    return "Tus registros de ánimo recientes muestran una racha difícil, así que priorizamos respiración y diario para acompañarte.";
  if (model.moodEwma >= MOOD_POSITIVE_THRESHOLD)
    return "Tus registros de ánimo recientes muestran una tendencia positiva, así que mostramos primero tu progreso.";
  return "Ordenamos tus secciones según lo que venís usando últimamente para que tengas a mano lo más relevante.";
}

// ---------------------------------------------------------------------------
// Signal type
// ---------------------------------------------------------------------------

export type Signal =
  | { kind: "habit"; habitId: string; completed: boolean }
  | { kind: "mood"; score: number }
  | { kind: "engagement"; module: ModuleKey };

// ---------------------------------------------------------------------------
// Core recompute (read-merge-write)
// ---------------------------------------------------------------------------

/**
 * Reads the current AdaptationState for a profile, applies one signal to the
 * matching EWMA channel, updates the transparency reason, and upserts the row.
 * Called after each of the four signal-capture chokepoints.
 */
export async function recomputeAdaptation(profileId: string, signal: Signal): Promise<void> {
  const row = await prisma.adaptationState.findUnique({ where: { profileId } });
  const model = row ? parseAdaptationState(row) : { ...EMPTY_MODEL, habitEwma: {}, engagementEwma: {} };

  if (signal.kind === "habit") {
    model.habitEwma[signal.habitId] = updateHabitEwma(
      model.habitEwma[signal.habitId],
      signal.completed,
    );
  }
  if (signal.kind === "mood") {
    model.moodEwma = updateMoodEwma(model.moodEwma, signal.score);
  }
  if (signal.kind === "engagement") {
    model.engagementEwma[signal.module] = updateEngagementEwma(
      model.engagementEwma[signal.module],
      true,
    );
  }

  model.adaptationReason = buildReason(model);

  const maps = serializeMaps(model);
  await prisma.adaptationState.upsert({
    where: { profileId },
    create: {
      profileId,
      ...maps,
      moodEwma: model.moodEwma,
      adaptationReason: model.adaptationReason,
    },
    update: {
      ...maps,
      moodEwma: model.moodEwma,
      adaptationReason: model.adaptationReason,
    },
  });
}

// ---------------------------------------------------------------------------
// Surface 2 reads
// ---------------------------------------------------------------------------

/**
 * Returns the adaptive module order for the home nav.
 * Override wins over the engine; falls back to canonical MODULE_KEYS when no row exists.
 */
export async function getAdaptiveModuleOrder(profileId: string): Promise<ModuleKey[]> {
  const row = await prisma.adaptationState.findUnique({ where: { profileId } });
  if (!row) return [...MODULE_KEYS];
  const model = parseAdaptationState(row);
  if (model.moduleOrderOverride) return model.moduleOrderOverride;
  return getModuleOrder(model.moodEwma, model.engagementEwma);
}

/**
 * Returns module order AND which modules have low engagement, in a single DB read.
 * Used by the home page to render the nav with nudge indicators.
 */
export async function getAdaptiveHomeData(profileId: string): Promise<{
  moduleOrder: ModuleKey[];
  lowEngagement: Set<ModuleKey>;
  adaptationReason: string | null;
}> {
  const row = await prisma.adaptationState.findUnique({ where: { profileId } });
  if (!row) {
    // First visit: no engagement data yet — return empty low-engagement set so
    // no nudge dots appear before the user has had a chance to interact.
    return {
      moduleOrder: [...MODULE_KEYS],
      lowEngagement: new Set<ModuleKey>(),
      adaptationReason: null,
    };
  }
  const model = parseAdaptationState(row);
  const moduleOrder = model.moduleOrderOverride
    ? model.moduleOrderOverride
    : getModuleOrder(model.moodEwma, model.engagementEwma);

  const lowEngagement = new Set<ModuleKey>(
    MODULE_KEYS.filter((k) => isLowEngagement(model.engagementEwma, k)),
  );

  return { moduleOrder, lowEngagement, adaptationReason: model.adaptationReason };
}

// Re-export for use in queries and other modules
export { LOW_ENGAGEMENT_THRESHOLD };
