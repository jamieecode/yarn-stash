import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import type { YarnCatalog, YarnCatalogSearchResult } from "../types/api";

// 화면설계서 2번 - 브랜드/라인명 자동완성. 로컬 우선 + Ravelry 폴백이 병합된 결과를 그대로 받는다
export function useYarnCatalogSearchQuery(query: string) {
  return useQuery({
    queryKey: ["yarn-catalog", "search", query],
    queryFn: () => api.get<YarnCatalogSearchResult[]>(`/yarn-catalog/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
  });
}

// Ravelry 검색 결과 클릭 시 로컬 YarnCatalog로 확정 캐싱 (기획서 2.1/2.9)
export function useResolveRavelryYarnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ravelryId: number) => api.post<YarnCatalog>(`/yarn-catalog/ravelry/${ravelryId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["yarn-catalog"] }),
  });
}
