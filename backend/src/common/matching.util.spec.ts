import {
  gaugeChip,
  needsLotMixing,
  totalMeters,
  yardageLabel,
  yardageRatioPercent,
  type BatchLike,
} from "./matching.util";

function batch(overrides: Partial<BatchLike> = {}): BatchLike {
  return { dyeLot: null, skeinCount: 1, lengthPerSkeinM: 100, ...overrides };
}

describe("matching.util", () => {
  describe("totalMeters", () => {
    it("sums skeinCount * lengthPerSkeinM across all batches", () => {
      const batches = [batch({ skeinCount: 2, lengthPerSkeinM: 100 }), batch({ skeinCount: 3, lengthPerSkeinM: 50 })];
      expect(totalMeters(batches)).toBe(350);
    });

    it("returns 0 for an empty batch list", () => {
      expect(totalMeters([])).toBe(0);
    });
  });

  describe("yardageRatioPercent", () => {
    it("computes the held-vs-required percentage", () => {
      expect(yardageRatioPercent(1300, 1000)).toBe(130);
    });

    it("returns 0 when requiredMinM is 0 or negative (avoids divide-by-zero)", () => {
      expect(yardageRatioPercent(500, 0)).toBe(0);
      expect(yardageRatioPercent(500, -10)).toBe(0);
    });
  });

  describe("yardageLabel", () => {
    it("labels 130% and above as AMPLE", () => {
      expect(yardageLabel(130)).toBe("AMPLE");
      expect(yardageLabel(200)).toBe("AMPLE");
    });

    it("labels 110% up to (but under) 130% as SUFFICIENT", () => {
      expect(yardageLabel(110)).toBe("SUFFICIENT");
      expect(yardageLabel(129.9)).toBe("SUFFICIENT");
    });

    it("labels 100% up to (but under) 110% as TIGHT", () => {
      expect(yardageLabel(100)).toBe("TIGHT");
      expect(yardageLabel(109.9)).toBe("TIGHT");
    });

    it("labels anything under 100% as INSUFFICIENT (never hidden)", () => {
      expect(yardageLabel(99.9)).toBe("INSUFFICIENT");
      expect(yardageLabel(0)).toBe("INSUFFICIENT");
    });
  });

  describe("gaugeChip", () => {
    it("returns null when either gauge is missing (informational only, not a hard filter)", () => {
      expect(gaugeChip(undefined, 18)).toBeNull();
      expect(gaugeChip(18, null)).toBeNull();
      expect(gaugeChip(undefined, undefined)).toBeNull();
    });

    it("returns MATCH when within +-1 stitch tolerance", () => {
      expect(gaugeChip(18, 18)).toBe("MATCH");
      expect(gaugeChip(18, 19)).toBe("MATCH");
      expect(gaugeChip(19, 18)).toBe("MATCH");
    });

    it("returns DIFFERENT when outside +-1 stitch tolerance", () => {
      expect(gaugeChip(18, 20)).toBe("DIFFERENT");
      expect(gaugeChip(22, 18)).toBe("DIFFERENT");
    });
  });

  describe("needsLotMixing", () => {
    it("returns false when the total is already short (that's INSUFFICIENT, not a lot-mixing issue)", () => {
      const batches = [batch({ skeinCount: 1, lengthPerSkeinM: 50 })];
      expect(needsLotMixing(batches, 100)).toBe(false);
    });

    it("returns false for an empty batch list", () => {
      expect(needsLotMixing([], 100)).toBe(false);
    });

    it("returns false when a single lot alone already covers the requirement", () => {
      const batches = [
        batch({ dyeLot: "A", skeinCount: 2, lengthPerSkeinM: 100 }),
        batch({ dyeLot: "B", skeinCount: 1, lengthPerSkeinM: 100 }),
      ];
      // total = 300, lot A alone = 200 >= 200 required
      expect(needsLotMixing(batches, 200)).toBe(false);
    });

    it("returns true when the total is enough but no single lot covers it alone", () => {
      const batches = [
        batch({ dyeLot: "A", skeinCount: 1, lengthPerSkeinM: 100 }),
        batch({ dyeLot: "B", skeinCount: 1, lengthPerSkeinM: 100 }),
      ];
      // total = 200, but each lot alone is only 100 < 200 required
      expect(needsLotMixing(batches, 200)).toBe(true);
    });

    it("treats batches without a dyeLot as a single combined group", () => {
      const batches = [
        batch({ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 100 }),
        batch({ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 100 }),
      ];
      // both null-lot batches combine into one group of 200, which covers the requirement
      expect(needsLotMixing(batches, 200)).toBe(false);
    });
  });
});
