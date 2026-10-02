import { ApiError } from "./apiClient";
import type { SearchResponse } from "../types/api";

type T = (key: string) => string;

// 검색 응답이 배열 → { items, ravelryUnavailable }로 바뀌었는데, 프론트(Vercel)가 백엔드(Render)보다 먼저 배포되는 일이 잦아
// 예전 배열 응답도 받아준다. 백엔드 배포가 확실히 끝난 뒤에는 지워도 됨
export function normalizeSearchResponse<R>(res: SearchResponse<R> | R[]): SearchResponse<R> {
  return Array.isArray(res) ? { items: res, ravelryUnavailable: false } : res;
}

// Ravelry 상세 조회 실패 문구 - 503(Ravelry 장애)은 번역된 안내로, 그 외(404/게스트 403 등)는 서버 메시지 그대로
export function ravelryErrorMessage(t: T, err: unknown): string {
  if (err instanceof ApiError && err.status === 503) return t("common:ravelry.detailUnavailable");
  return err instanceof Error ? err.message : String(err);
}
