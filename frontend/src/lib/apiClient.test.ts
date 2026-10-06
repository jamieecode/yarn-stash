import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "./i18n";
import { api, ApiError, setToken } from "./apiClient";

function mockFetch(status: number, body?: unknown) {
  const fn = vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api", () => {
  it("토큰이 있으면 Authorization 헤더를, 본문이 있으면 Content-Type을 붙인다", async () => {
    setToken("abc");
    const fetch = mockFetch(200, { ok: true });

    await expect(api.post("/yarns", { name: "실" })).resolves.toEqual({ ok: true });

    const [, init] = fetch.mock.calls[0];
    expect(init.headers).toEqual({ "Content-Type": "application/json", Authorization: "Bearer abc" });
    expect(init.body).toBe(JSON.stringify({ name: "실" }));
  });

  it("204는 undefined", async () => {
    mockFetch(204);
    await expect(api.delete("/yarns/1")).resolves.toBeUndefined();
  });

  it("429는 서버 문구 대신 번역된 안내", async () => {
    mockFetch(429, { message: "ThrottlerException" });
    await expect(api.get("/yarns")).rejects.toMatchObject({
      status: 429,
      message: i18n.t("common:error.tooManyRequests"),
    });
  });

  it("그 외 오류는 서버 message를, 없으면 상태 코드 안내를 쓴다", async () => {
    mockFetch(400, { message: "이름을 입력해 주세요" });
    await expect(api.get("/yarns")).rejects.toEqual(new ApiError(400, "이름을 입력해 주세요"));

    mockFetch(500);
    await expect(api.get("/yarns")).rejects.toMatchObject({
      status: 500,
      message: i18n.t("common:error.requestFailed", { status: 500 }),
    });
  });
});
