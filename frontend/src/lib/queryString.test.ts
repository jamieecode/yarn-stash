import { describe, expect, it } from "vitest";
import { buildQuery } from "./queryString";

describe("buildQuery", () => {
  it("값이 없으면 빈 문자열", () => {
    expect(buildQuery({})).toBe("");
    expect(buildQuery({ q: undefined, weight: "" })).toBe("");
  });

  it("undefined/빈 문자열은 빼고 숫자·불리언은 문자열로", () => {
    expect(buildQuery({ q: "울", weight: undefined, limit: 20, owned: false })).toBe(
      "?q=%EC%9A%B8&limit=20&owned=false",
    );
  });
});
