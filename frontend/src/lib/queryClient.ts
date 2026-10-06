import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiClient";
import { showErrorToast } from "./errorToast";
import i18n from "./i18n";

declare module "@tanstack/react-query" {
  interface Register {
    // errorToast: false - 화면이 실패 문구를 직접 보여주는 mutation은 전역 토스트를 띄우지 않는다
    mutationMeta: { errorToast?: boolean };
  }
}

// 요청 실패 안내 문구 - ApiError는 서버 message(또는 번역된 상태 코드 안내)를 그대로, fetch 자체가 실패한 경우(TypeError)는 네트워크 안내로
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return i18n.t("common:error.network");
}

export function createQueryClient() {
  return new QueryClient({
    // 저장/삭제 실패를 화면마다 처리하지 않아도 사용자가 알 수 있도록 한곳에서 토스트로 알린다
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.errorToast === false) return;
        showErrorToast(apiErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        // 4xx(권한/없음/요청 한도 초과)는 다시 보내도 결과가 같거나 한도만 더 깎으므로 네트워크/5xx만 한 번 재시도
        retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
