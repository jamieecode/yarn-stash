import { describe, expect, it } from "vitest";
import { displayLength, displayWeight } from "./units";

describe("displayWeight/displayLength", () => {
  it("METRIC은 저장값 그대로", () => {
    expect(displayWeight(100, "METRIC")).toEqual({ value: 100, label: "g" });
    expect(displayLength(200, "METRIC")).toEqual({ value: 200, label: "m" });
  });

  it("IMPERIAL은 oz/yd로 바꿔 소수 첫째 자리까지", () => {
    expect(displayWeight(100, "IMPERIAL")).toEqual({ value: 3.5, label: "oz" });
    expect(displayLength(200, "IMPERIAL")).toEqual({ value: 218.7, label: "yd" });
  });
});
