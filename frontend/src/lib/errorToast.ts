// 저장/삭제 실패를 화면 아래 토스트로 알리기 위한 아주 작은 전역 상태 - React 밖(QueryClient의 MutationCache)에서도 띄울 수 있어야 해서 컨텍스트 대신 모듈 변수로 둔다
export interface ErrorToast {
  id: number;
  message: string;
}

let current: ErrorToast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function showErrorToast(message: string) {
  current = { id: nextId++, message };
  emit();
}

export function dismissErrorToast(id: number) {
  if (current?.id !== id) return;
  current = null;
  emit();
}

export function subscribeErrorToast(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getErrorToast() {
  return current;
}
