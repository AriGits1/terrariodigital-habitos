import { describe, it, expect } from "vitest";
import {
  updateEwma,
  suggestHabitDifficulty,
  nextWeight,
  getModuleOrder,
  isLowEngagement,
  MODULE_KEYS,
} from "./engine";

// ---------------------------------------------------------------------------
// updateEwma
// ---------------------------------------------------------------------------
describe("updateEwma", () => {
  it("cold-start: prev=null returns the value itself (no cold-start bias)", () => {
    expect(updateEwma(null, 0.5)).toBe(0.5);
  });

  it("cold-start: prev=undefined returns the value itself", () => {
    expect(updateEwma(undefined, 0.5)).toBe(0.5);
  });

  it("spec formula: updateEwma(0.6, 0.9, 0.3) ≈ 0.69", () => {
    expect(updateEwma(0.6, 0.9, 0.3)).toBeCloseTo(0.69, 10);
  });

  it("spec formula 2: updateEwma(0.5, 1.0, 0.3) ≈ 0.65", () => {
    expect(updateEwma(0.5, 1.0, 0.3)).toBeCloseTo(0.65, 10);
  });

  it("α=1 special case: result equals the new value", () => {
    expect(updateEwma(0.5, 1.0, 1)).toBe(1.0);
  });

  it("α=0 special case: result equals the previous value", () => {
    expect(updateEwma(0.5, 1.0, 0)).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// suggestHabitDifficulty
// ---------------------------------------------------------------------------
describe("suggestHabitDifficulty", () => {
  it("above LEVEL_UP_THRESHOLD (0.9) with weight < 5 → level-up", () => {
    expect(suggestHabitDifficulty(0.9, 3)).toBe("level-up");
  });

  it("exactly at LEVEL_UP_THRESHOLD (0.85) with weight < 5 → level-up (boundary inclusive)", () => {
    expect(suggestHabitDifficulty(0.85, 3)).toBe("level-up");
  });

  it("at LEVEL_UP_THRESHOLD but weight=5 (max) → hold", () => {
    expect(suggestHabitDifficulty(0.85, 5)).toBe("hold");
  });

  it("below EASE_THRESHOLD (0.2) with weight > 1 → ease", () => {
    expect(suggestHabitDifficulty(0.2, 3)).toBe("ease");
  });

  it("exactly at EASE_THRESHOLD (0.35) with weight > 1 → ease (boundary inclusive)", () => {
    expect(suggestHabitDifficulty(0.35, 3)).toBe("ease");
  });

  it("at EASE_THRESHOLD but weight=1 (min) → hold", () => {
    expect(suggestHabitDifficulty(0.35, 1)).toBe("hold");
  });

  it("mid-range (0.6) → hold (dead-zone interior)", () => {
    expect(suggestHabitDifficulty(0.6, 3)).toBe("hold");
  });
});

// ---------------------------------------------------------------------------
// nextWeight
// ---------------------------------------------------------------------------
describe("nextWeight", () => {
  it("level-up increments weight by 1", () => {
    expect(nextWeight("level-up", 3)).toBe(4);
  });

  it("level-up clamps at 5 (max weight)", () => {
    expect(nextWeight("level-up", 5)).toBe(5);
  });

  it("level-up clamps at 5 when already above would exceed max", () => {
    expect(nextWeight("level-up", 4)).toBe(5);
  });

  it("ease decrements weight by 1", () => {
    expect(nextWeight("ease", 3)).toBe(2);
  });

  it("ease clamps at 1 (min weight)", () => {
    expect(nextWeight("ease", 1)).toBe(1);
  });

  it("hold returns the same weight unchanged", () => {
    expect(nextWeight("hold", 3)).toBe(3);
  });

  it("hold returns the same weight at min boundary", () => {
    expect(nextWeight("hold", 1)).toBe(1);
  });

  it("hold returns the same weight at max boundary", () => {
    expect(nextWeight("hold", 5)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getModuleOrder
// ---------------------------------------------------------------------------
describe("getModuleOrder", () => {
  it("negative moodEwma (-0.4) → mindfulness, diario, analiticas", () => {
    expect(getModuleOrder(-0.4, {})).toEqual(["mindfulness", "diario", "analiticas"]);
  });

  it("positive moodEwma (0.7) → analiticas, diario, mindfulness", () => {
    expect(getModuleOrder(0.7, {})).toEqual(["analiticas", "diario", "mindfulness"]);
  });

  it("neutral mood with missing keys → canonical order (stable tie-break)", () => {
    // All engagement missing → all default to 0 → canonical MODULE_KEYS order
    const result = getModuleOrder(0.0, {});
    expect(result).toEqual([...MODULE_KEYS]);
  });

  it("output always has exactly 3 elements from MODULE_KEYS", () => {
    const result = getModuleOrder(0.0, {});
    expect(result).toHaveLength(3);
    for (const key of result) {
      expect(MODULE_KEYS).toContain(key);
    }
  });

  it("neutral mood with low engagement on one module → that module first", () => {
    // mindfulness has lowest engagement (0.1), others missing (0)
    // Actually: all missing → 0. Let's set mindfulness higher so diario goes first.
    const result = getModuleOrder(0.1, { mindfulness: 0.8, analiticas: 0.5 });
    // diario missing → 0 (lowest), then analiticas=0.5, then mindfulness=0.8
    expect(result[0]).toBe("diario");
    expect(result[1]).toBe("analiticas");
    expect(result[2]).toBe("mindfulness");
  });
});

// ---------------------------------------------------------------------------
// isLowEngagement
// ---------------------------------------------------------------------------
describe("isLowEngagement", () => {
  it("missing key → defaults to 0 → true (below LOW_ENGAGEMENT_THRESHOLD=0.3)", () => {
    expect(isLowEngagement({}, "diario")).toBe(true);
  });

  it("key at 0.5 → false (above threshold)", () => {
    expect(isLowEngagement({ diario: 0.5 }, "diario")).toBe(false);
  });

  it("key at 0.29 → true (below threshold)", () => {
    expect(isLowEngagement({ mindfulness: 0.29 }, "mindfulness")).toBe(true);
  });

  it("key exactly at threshold (0.3) → false (not strictly below)", () => {
    expect(isLowEngagement({ analiticas: 0.3 }, "analiticas")).toBe(false);
  });
});
