import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { buildQuery } from "../lib/queryString";
import type {
  CreatePatternInput,
  DeleteEligibility,
  Pattern,
  PatternSearchResult,
  PatternYarnMatch,
  RavelryPatternDetail,
  UpdatePatternInput,
} from "../types/api";

interface PatternListParams {
  craftType?: string;
  weightCategory?: string;
  bookmarked?: boolean;
}

export function usePatternsQuery(params: PatternListParams) {
  return useQuery({
    queryKey: ["patterns", params],
    queryFn: () => api.get<Pattern[]>(`/patterns${buildQuery(params)}`),
  });
}

// 화면설계서 5번 - 로컬 우선 + Ravelry 병합 검색
export function usePatternSearchQuery(query: string) {
  return useQuery({
    queryKey: ["patterns", "search", query],
    queryFn: () => api.get<PatternSearchResult[]>(`/patterns/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
  });
}

export function usePatternQuery(patternId: string | undefined) {
  return useQuery({
    queryKey: ["patterns", patternId],
    queryFn: () => api.get<Pattern>(`/patterns/${patternId}`),
    enabled: Boolean(patternId),
  });
}

// 화면설계서 6번(내가 가진 실 중 맞는 것)
export function usePatternYarnMatchesQuery(patternId: string | undefined) {
  return useQuery({
    queryKey: ["patterns", patternId, "yarn-matches"],
    queryFn: () => api.get<PatternYarnMatch[]>(`/patterns/${patternId}/yarn-matches`),
    enabled: Boolean(patternId),
  });
}

export function useBookmarkCountQuery(patternId: string | undefined, excludeSelf: boolean) {
  return useQuery({
    queryKey: ["patterns", patternId, "bookmark-count", excludeSelf],
    queryFn: () => api.get<{ count: number }>(`/patterns/${patternId}/bookmark-count?excludeSelf=${excludeSelf}`),
    enabled: Boolean(patternId),
  });
}

// 화면설계서 6번 - 휴지통 아이콘 활성화 여부 사전 확인
export function useDeleteCheckQuery(patternId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["patterns", patternId, "delete-check"],
    queryFn: () => api.get<DeleteEligibility>(`/patterns/${patternId}/delete-check`),
    enabled: Boolean(patternId) && enabled,
  });
}

// Ravelry 검색 결과 클릭 시 등록 폼 자동 채움용 상세 조회 (DB 쓰기 없음)
export function useRavelryPatternDetailQuery(ravelryId: number | undefined) {
  return useQuery({
    queryKey: ["patterns", "ravelry", ravelryId],
    queryFn: () => api.get<RavelryPatternDetail>(`/patterns/ravelry/${ravelryId}`),
    enabled: ravelryId !== undefined,
  });
}

export function useCreatePatternMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePatternInput) => api.post<Pattern>("/patterns", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patterns"] }),
  });
}

export function useUpdatePatternMutation(patternId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePatternInput) => api.patch<Pattern>(`/patterns/${patternId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patterns"] }),
  });
}

export function useDeletePatternMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patternId: string) => api.delete<{ success: boolean }>(`/patterns/${patternId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patterns"] }),
  });
}

// 찜 상태는 목록/상세/찜필터 여러 쿼리에 걸쳐 있어 부분 키 매칭이 까다로우므로,
// 찜 토글 시엔 patterns 전체 캐시를 한 번에 무효화한다 (데이터 규모상 비용도 작음)
function invalidateAllPatterns(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["patterns"] });
}

export function useAddBookmarkMutation(patternId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/patterns/${patternId}/bookmark`),
    onSuccess: () => invalidateAllPatterns(queryClient),
  });
}

export function useRemoveBookmarkMutation(patternId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/patterns/${patternId}/bookmark`),
    onSuccess: () => invalidateAllPatterns(queryClient),
  });
}

export function useUpdateBookmarkMemoMutation(patternId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memo: string) => api.patch(`/patterns/${patternId}/bookmark`, { memo }),
    onSuccess: () => invalidateAllPatterns(queryClient),
  });
}
