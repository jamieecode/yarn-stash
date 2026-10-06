import { describe, expect, it } from "vitest";
import i18n from "./i18n";
import { ApiError } from "./apiClient";
import { getErrorToast } from "./errorToast";
import { apiErrorMessage, createQueryClient } from "./queryClient";

function runMutation(error: unknown, meta?: { errorToast?: boolean }) {
  const queryClient = createQueryClient();
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: () => Promise.reject(error),
    meta,
  });
  return mutation.execute(undefined).catch(() => {});
}

describe("apiErrorMessage", () => {
  it("ApiError는 서버 message를 그대로, 그 외(fetch 실패)는 네트워크 안내", () => {
    expect(apiErrorMessage(new ApiError(403, "이 도안으로 진행한 프로젝트가 있어 삭제할 수 없어요"))).toBe(
      "이 도안으로 진행한 프로젝트가 있어 삭제할 수 없어요",
    );
    expect(apiErrorMessage(new TypeError("Failed to fetch"))).toBe(i18n.t("common:error.network"));
  });
});

describe("createQueryClient", () => {
  it("mutation이 실패하면 오류 토스트를 띄운다", async () => {
    await runMutation(new ApiError(403, "다른 분들이 찜한 도안이라 삭제할 수 없어요"));
    expect(getErrorToast()?.message).toBe("다른 분들이 찜한 도안이라 삭제할 수 없어요");
  });

  it("meta.errorToast가 false면 토스트를 띄우지 않는다", async () => {
    await runMutation(new ApiError(500, "Internal server error"), { errorToast: false });
    expect(getErrorToast()).toBeNull();
  });

  it("쿼리는 4xx면 재시도하지 않고, 네트워크/5xx는 한 번만 재시도한다", () => {
    const retry = createQueryClient().getDefaultOptions().queries!.retry as (count: number, error: unknown) => boolean;
    expect(retry(0, new ApiError(404, "없음"))).toBe(false);
    expect(retry(0, new ApiError(429, "한도"))).toBe(false);
    expect(retry(0, new ApiError(503, "장애"))).toBe(true);
    expect(retry(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(retry(1, new TypeError("Failed to fetch"))).toBe(false);
  });
});
