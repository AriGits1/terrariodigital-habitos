import { describe, it, expect } from "vitest";
import { buildKudosFallback } from "../../agents/stub";
import type { BiomeType } from "../../biome/biome-logic";

const BIOME_TYPES: BiomeType[] = ["forest", "desert", "zen"];

describe("buildKudosFallback", () => {
  it("returns a non-empty string for all BiomeType values", () => {
    for (const biomeType of BIOME_TYPES) {
      const result = buildKudosFallback("Alice", biomeType);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("includes the recipientName when name is non-empty", () => {
    for (const biomeType of BIOME_TYPES) {
      const result = buildKudosFallback("Alice", biomeType);
      expect(result.toLowerCase()).toContain("alice");
    }
  });

  it("returns a different string per BiomeType (varies by biome)", () => {
    const results = BIOME_TYPES.map((bt) => buildKudosFallback("Alice", bt));
    // Not all three should be identical
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("does not throw when recipientName is an empty string", () => {
    for (const biomeType of BIOME_TYPES) {
      expect(() => buildKudosFallback("", biomeType)).not.toThrow();
      const result = buildKudosFallback("", biomeType);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("does not throw when recipientName is whitespace-only", () => {
    for (const biomeType of BIOME_TYPES) {
      expect(() => buildKudosFallback("   ", biomeType)).not.toThrow();
      const result = buildKudosFallback("   ", biomeType);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
