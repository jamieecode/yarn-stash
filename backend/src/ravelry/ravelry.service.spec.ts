import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RavelryService, RavelryUnavailableError } from "./ravelry.service";

describe("RavelryService", () => {
  let fetchSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  function createService(env: Record<string, string | undefined> = { RAVELRY_API_KEY: "key", RAVELRY_API_SECRET: "secret" }) {
    return new RavelryService({ get: (k: string) => env[k] } as unknown as ConfigService);
  }

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch");
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("실패 처리 (404만 null, 나머지는 로그 후 RavelryUnavailableError)", () => {
    it("401/403은 크리덴셜 문제로 error 로그를 남기고, 검색어는 로그에 포함하지 않는다", async () => {
      fetchSpy.mockResolvedValue(new Response("", { status: 401 }));

      await expect(createService().searchPatterns("비밀 검색어")).rejects.toBeInstanceOf(RavelryUnavailableError);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain("401 (/patterns/search.json)");
      expect(errorSpy.mock.calls[0][0]).not.toContain("query");
    });

    it("429와 5xx는 warn으로 남긴다", async () => {
      fetchSpy.mockResolvedValueOnce(new Response("", { status: 429 }));
      fetchSpy.mockResolvedValueOnce(new Response("", { status: 503 }));
      const service = createService();

      await expect(service.searchYarns("merino")).rejects.toBeInstanceOf(RavelryUnavailableError);
      await expect(service.searchYarns("merino")).rejects.toBeInstanceOf(RavelryUnavailableError);

      expect(warnSpy.mock.calls.map((c) => c[0])).toEqual([
        expect.stringContaining("429"),
        expect.stringContaining("503"),
      ]);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("상세 조회 404는 정상 케이스라 로그를 남기지 않는다", async () => {
      fetchSpy.mockResolvedValue(new Response("", { status: 404 }));

      await expect(createService().getPatternDetail(123)).resolves.toBeNull();

      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("네트워크 오류/타임아웃은 원인과 함께 warn으로 남긴다", async () => {
      fetchSpy.mockRejectedValueOnce(new TypeError("fetch failed"));
      fetchSpy.mockRejectedValueOnce(Object.assign(new Error("aborted"), { name: "TimeoutError" }));
      const service = createService();

      await expect(service.getYarnDetail(1)).rejects.toBeInstanceOf(RavelryUnavailableError);
      await expect(service.getYarnDetail(2)).rejects.toBeInstanceOf(RavelryUnavailableError);

      expect(warnSpy.mock.calls[0][0]).toContain("fetch failed");
      expect(warnSpy.mock.calls[1][0]).toContain("타임아웃");
    });

    it("RavelryUnavailableError는 503으로 응답된다 (상세 조회 엔드포인트에서 그대로 전파)", () => {
      expect(new RavelryUnavailableError().getStatus()).toBe(503);
    });

    it("200인데 본문이 JSON이 아니면 장애로 취급한다", async () => {
      fetchSpy.mockResolvedValue(new Response("<html>maintenance</html>", { status: 200 }));

      await expect(createService().searchPatterns("sweater")).rejects.toBeInstanceOf(RavelryUnavailableError);
      expect(warnSpy.mock.calls[0][0]).toContain("파싱 실패");
    });

    it("성공 응답은 로그 없이 그대로 매핑한다", async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ patterns: [{ id: 7, name: "Sweater", designer: { name: "Kim" } }] }), { status: 200 }),
      );

      await expect(createService().searchPatterns("sweater")).resolves.toEqual([
        { ravelryId: 7, name: "Sweater", designer: "Kim", thumbnailUrl: undefined },
      ]);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe("onModuleInit", () => {
    it("크리덴셜이 없으면 기동 시 한 번 경고하고, 호출 자체를 하지 않는다", async () => {
      const service = createService({});
      service.onModuleInit();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      await expect(service.searchPatterns("sweater")).resolves.toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("크리덴셜이 있으면 경고하지 않는다", () => {
      createService().onModuleInit();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
