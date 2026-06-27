import { describe, it, expect } from "vitest";
import {
  WATER_FULL,
  WATER_PER_GESTURE,
  WATER_PACKS,
  packById,
  caudal,
  applyWatering,
} from "./water-logic";

describe("water packs", () => {
  it("offers at least one purchasable pack", () => {
    expect(WATER_PACKS.length).toBeGreaterThan(0);
  });

  it("every pack costs seeds and yields water", () => {
    for (const p of WATER_PACKS) {
      expect(p.seeds).toBeGreaterThan(0);
      expect(p.water).toBeGreaterThan(0);
      expect(p.id).toBeTruthy();
    }
  });

  it("resolves a pack by id and rejects unknown ids", () => {
    const first = WATER_PACKS[0];
    expect(packById(first.id)).toEqual(first);
    expect(packById("nope")).toBeUndefined();
  });

  it("credits a fixed amount of water per received gesture", () => {
    expect(WATER_PER_GESTURE).toBeGreaterThan(0);
  });
});

describe("caudal", () => {
  it("is empty at zero water", () => {
    expect(caudal(0).level).toBe(0);
  });

  it("is full at WATER_FULL and clamps beyond it", () => {
    expect(caudal(WATER_FULL).level).toBe(1);
    expect(caudal(WATER_FULL * 3).level).toBe(1);
  });

  it("widens and flows faster as water rises", () => {
    const low = caudal(10);
    const high = caudal(90);
    expect(high.width).toBeGreaterThan(low.width);
    expect(high.flowSpeed).toBeGreaterThan(low.flowSpeed);
    expect(high.opacity).toBeGreaterThan(low.opacity);
  });

  it("never returns a negative level for negative input", () => {
    expect(caudal(-50).level).toBe(0);
  });
});

describe("applyWatering", () => {
  it("raises both growth and health", () => {
    const out = applyWatering({ growth: 20, health: 30 }, 10);
    expect(out.growth).toBeGreaterThan(20);
    expect(out.health).toBeGreaterThan(30);
  });

  it("clamps vitals at 100, never overflowing", () => {
    const out = applyWatering({ growth: 99, health: 99 }, 100);
    expect(out.growth).toBe(100);
    expect(out.health).toBe(100);
  });

  it("reports the water actually consumed", () => {
    expect(applyWatering({ growth: 10, health: 10 }, 25).waterUsed).toBe(25);
  });

  it("is a no-op for zero or negative water", () => {
    const base = { growth: 40, health: 50 };
    expect(applyWatering(base, 0)).toEqual({ growth: 40, health: 50, waterUsed: 0 });
    expect(applyWatering(base, -5)).toEqual({ growth: 40, health: 50, waterUsed: 0 });
  });
});
