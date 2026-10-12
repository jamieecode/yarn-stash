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

// 단수 카운터는 뜨면서 연달아 누르는 버튼이라, 저장을 기다렸다가 화면을 바꾸면 그 사이에 누른 만큼 같은 값을 또 보내 단수가 사라진다.
// 그래서 누르는 즉시 캐시 값을 바꾸고(다음 탭은 바뀐 값에서 계산), 저장 요청은 scope로 순서대로 보내 늦게 도착한 옛 값이 덮어쓰지 않게 한다.
// 다시 불러오기는 마지막 요청이 끝났을 때 한 번만 - 중간에 불러오면 아직 저장 안 된 값이 옛 값으로 되돌아가 보인다
// 단수는 재고와 무관해서 yarns/patterns는 건드리지 않는다
export function useProjectRowCounter(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["projects", projectId];
  const mutationKey = ["projects", projectId, "currentRow"];
  const mutation = useMutation({
    mutationKey,
    mutationFn: (currentRow: number) => api.patch<Project>(`/projects/${projectId}`, { currentRow }),
    scope: { id: `project-row-${projectId}` },
    onSettled: () => {
      // 실패했을 때도 서버 값으로 맞춘다 (실패 사유는 전역 오류 토스트)
      if (queryClient.isMutating({ mutationKey }) === 1) queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return (currentRow: number) => {
    // 진행 중인 다시 불러오기가 낙관적으로 바꾼 값을 덮어쓰지 않게 먼저 취소한다
    queryClient.cancelQueries({ queryKey, exact: true });
    queryClient.setQueryData<Project>(queryKey, (project) => project && { ...project, currentRow });
    mutation.mutate(currentRow);
  };
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
