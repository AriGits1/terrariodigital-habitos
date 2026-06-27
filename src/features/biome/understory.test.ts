import { describe, it, expect } from "vitest";
import {
  understoryCount,
  generateUnderstory,
  UNDERSTORY_BASE,
  UNDERSTORY_MAX,
  TERRAIN_RADIUS,
} from "./biome-logic";

describe("understoryCount", () => {
  it("keeps a non-empty floor even at zero growth", () => {
    expect(understoryCount(0)).toBe(UNDERSTORY_BASE);
  });

  it("reaches the dense cap at full growth", () => {
    expect(understoryCount(100)).toBe(UNDERSTORY_MAX);
  });

  it("grows monotonically with growth", () => {
    expect(understoryCount(50)).toBeGreaterThan(understoryCount(0));
    expect(understoryCount(100)).toBeGreaterThan(understoryCount(50));
  });

  it("clamps out-of-range growth", () => {
    expect(understoryCount(-20)).toBe(UNDERSTORY_BASE);
    expect(understoryCount(999)).toBe(UNDERSTORY_MAX);
  });
});

describe("generateUnderstory", () => {
  it("produces exactly understoryCount placements", () => {
    const plants = generateUnderstory(40, 80);
    expect(plants).toHaveLength(understoryCount(40));
  });

  it("only spawns ground-cover kinds, never main trees", () => {
    const plants = generateUnderstory(100, 80);
    const kinds = new Set(plants.map((p) => p.kind));
    expect(kinds.has("main")).toBe(false);
    for (const p of plants) {
      expect(["grass", "bush", "smallFlower"]).toContain(p.kind);
    }
  });

  it("is deterministic for the same inputs", () => {
    expect(generateUnderstory(60, 70)).toEqual(generateUnderstory(60, 70));
  });

  it("places every plant inside the terrain radius", () => {
    const plants = generateUnderstory(100, 80);
    for (const p of plants) {
      const dist = Math.sqrt(p.x * p.x + p.z * p.z);
      expect(dist).toBeLessThanOrEqual(TERRAIN_RADIUS);
    }
  });

  it("propagates health onto the placements", () => {
    const plants = generateUnderstory(50, 33);
    for (const p of plants) {
      expect(p.health).toBe(33);
    }
  });
});
