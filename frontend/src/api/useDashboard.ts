import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import type { DashboardSummary } from "../types/api";

// 홈 집계. 실·도안·프로젝트 거의 전부에서 파생되는 값이라 개별 뮤테이션마다 무효화를 걸지 않고,
// staleTime 기본값(0) + 마운트 시 refetch에 맡긴다 - 홈은 별도 라우트라 진입할 때마다 새로 읽힌다
export function useDashboardQuery() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/dashboard"),
  });
}
