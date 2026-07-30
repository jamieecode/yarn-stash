import { toGrams, toMeters } from "./units.util";

describe("units.util", () => {
  describe("toGrams", () => {
    it("returns the value unchanged for METRIC input", () => {
      expect(toGrams(100, "METRIC")).toBe(100);
    });

    it("converts ounces to grams for IMPERIAL input", () => {
      expect(toGrams(1, "IMPERIAL")).toBe(28.4);
    });

    it("rounds the converted value to 1 decimal place", () => {
      expect(toGrams(3.5, "IMPERIAL")).toBe(99.2);
    });
  });

  describe("toMeters", () => {
    it("returns the value unchanged for METRIC input", () => {
      expect(toMeters(400, "METRIC")).toBe(400);
    });

    it("converts yards to meters for IMPERIAL input", () => {
      expect(toMeters(100, "IMPERIAL")).toBe(91.4);
    });

    it("rounds the converted value to 1 decimal place", () => {
      expect(toMeters(1, "IMPERIAL")).toBe(0.9);
    });
  });
});
