import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { buildQuery } from "../lib/queryString";
import type {
  BatchInput,
  CreateYarnInput,
  UpdateYarnInput,
  Yarn,
  YarnBatch,
  YarnPatternMatch,
} from "../types/api";

interface YarnListParams {
  q?: string;
  weightCategory?: string;
  sort?: "RECENT" | "NAME";
  includeConsumed?: boolean;
}

export function useYarnsQuery(params: YarnListParams) {
  return useQuery({
    queryKey: ["yarns", params],
    queryFn: () => api.get<Yarn[]>(`/yarns${buildQuery(params)}`),
  });
}

export function useYarnQuery(yarnId: string | undefined) {
  return useQuery({
    queryKey: ["yarns", yarnId],
    queryFn: () => api.get<Yarn>(`/yarns/${yarnId}`),
    enabled: Boolean(yarnId),
  });
}

// 화면설계서 3번 "이 실로 뜰 수 있는 도안" 탭 - 소진 처리된 실은 백엔드가 빈 배열을 반환
export function useYarnPatternMatchesQuery(yarnId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["yarns", yarnId, "pattern-matches"],
    queryFn: () => api.get<YarnPatternMatch[]>(`/yarns/${yarnId}/pattern-matches`),
    enabled: Boolean(yarnId) && enabled,
  });
}

export function useCreateYarnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateYarnInput) => api.post<Yarn>("/yarns", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["yarns"] }),
  });
}

export function useUpdateYarnMutation(yarnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateYarnInput) => api.patch<Yarn>(`/yarns/${yarnId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["yarns"] }),
  });
}

export function useDeleteYarnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (yarnId: string) => api.delete<{ success: boolean }>(`/yarns/${yarnId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["yarns"] }),
  });
}

export function useAddBatchMutation(yarnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BatchInput) => api.post<YarnBatch>(`/yarns/${yarnId}/batches`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["yarns", yarnId] }),
  });
}

export function useUpdateBatchMutation(yarnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, dto }: { batchId: string; dto: Partial<BatchInput> }) =>
      api.patch<YarnBatch>(`/yarns/${yarnId}/batches/${batchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["yarns", yarnId] }),
  });
}

export function useRemoveBatchMutation(yarnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => api.delete<{ success: boolean }>(`/yarns/${yarnId}/batches/${batchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["yarns", yarnId] }),
  });
}
