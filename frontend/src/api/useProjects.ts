import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { buildQuery } from "../lib/queryString";
import type {
  AddProjectYarnInput,
  Project,
  ProjectStatus,
  UpdateProjectInput,
  UpdateProjectYarnInput,
} from "../types/api";

interface ProjectListParams {
  status?: ProjectStatus;
  patternId?: string;
}

export function useProjectsQuery(params: ProjectListParams = {}) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => api.get<Project[]>(`/projects${buildQuery(params)}`),
  });
}

export function useProjectQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
    enabled: Boolean(projectId),
  });
}

// 프로젝트 변경은 거의 전부 실 재고의 가용량(availableM)을 함께 바꾼다 - 시작하면 예약이 잡히고,
// 완료하면 사용량이 확정되고, 삭제하면 예약이 풀린다. 그래서 projects만 무효화하면 실 목록이
// "아직 다 남아있음"으로 보이는 유령 재고가 생긴다. 매칭 결과도 가용량 기준이라 patterns까지 같이 턴다
function useStockAffectingMutation<TVars, TData>(mutationFn: (vars: TVars) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["yarns"] });
      queryClient.invalidateQueries({ queryKey: ["patterns"] });
    },
  });
}

// 화면설계서 6-2 - 진행 중인 프로젝트가 있으면 백엔드가 그대로 재사용, 없으면 새로 생성 (기획서 설계 메모)
export function useStartOrResumeProjectMutation() {
  return useStockAffectingMutation((dto: { patternId: string; yarnId?: string }) => api.post<Project>("/projects", dto));
}

export function useUpdateProjectMutation(projectId: string) {
  return useStockAffectingMutation((dto: UpdateProjectInput) => api.patch<Project>(`/projects/${projectId}`, dto));
}

export function useDeleteProjectMutation() {
  return useStockAffectingMutation((projectId: string) => api.delete<{ success: boolean }>(`/projects/${projectId}`));
}

export function useAddProjectYarnMutation(projectId: string) {
  return useStockAffectingMutation((dto: AddProjectYarnInput) => api.post(`/projects/${projectId}/yarns`, dto));
}

export function useUpdateProjectYarnMutation(projectId: string) {
  return useStockAffectingMutation(({ yarnId, ...dto }: UpdateProjectYarnInput & { yarnId: string }) =>
    api.patch(`/projects/${projectId}/yarns/${yarnId}`, dto),
  );
}

export function useRemoveProjectYarnMutation(projectId: string) {
  return useStockAffectingMutation((yarnId: string) => api.delete(`/projects/${projectId}/yarns/${yarnId}`));
}
