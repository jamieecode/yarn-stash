import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { buildQuery } from "../lib/queryString";
import type { Project, ProjectStatus, UpdateProjectInput } from "../types/api";

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

// 화면설계서 6-2 - 진행 중인 프로젝트가 있으면 백엔드가 그대로 재사용, 없으면 새로 생성 (기획서 설계 메모)
export function useStartOrResumeProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { patternId: string; yarnId?: string }) => api.post<Project>("/projects", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProjectMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateProjectInput) => api.patch<Project>(`/projects/${projectId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.delete<{ success: boolean }>(`/projects/${projectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}
