import { describe, expect, it } from "vitest";
import i18n from "./i18n";
import { ApiError } from "./apiClient";
import { normalizeSearchResponse, ravelryErrorMessage } from "./ravelry";

describe("normalizeSearchResponse", () => {
  it("예전 배열 응답을 새 형태로 감싼다", () => {
    expect(normalizeSearchResponse([1, 2])).toEqual({ items: [1, 2], ravelryUnavailable: false });
  });

  it("새 형태는 그대로 둔다", () => {
    const res = { items: [1], ravelryUnavailable: true };
    expect(normalizeSearchResponse(res)).toBe(res);
  });
});

describe("ravelryErrorMessage", () => {
  const t = (key: string) => i18n.t(key);

  it("503은 번역된 장애 안내", () => {
    expect(ravelryErrorMessage(t, new ApiError(503, "server"))).toBe(i18n.t("common:ravelry.detailUnavailable"));
  });

  it("그 외 오류는 서버 메시지 그대로", () => {
    expect(ravelryErrorMessage(t, new ApiError(404, "없는 실이에요"))).toBe("없는 실이에요");
    expect(ravelryErrorMessage(t, "boom")).toBe("boom");
  });
});
