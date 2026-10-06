import { useEffect, useSyncExternalStore } from "react";
import { dismissErrorToast, getErrorToast, subscribeErrorToast } from "../../lib/errorToast";

const VISIBLE_MS = 4000;

// 저장/삭제 실패 안내 - 하단 탭바 위에 잠깐 띄웠다가 사라진다 (새 오류가 오면 바로 교체)
export function ErrorToast() {
  const toast = useSyncExternalStore(subscribeErrorToast, getErrorToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissErrorToast(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <p
        role="alert"
        onClick={() => dismissErrorToast(toast.id)}
        className="pointer-events-auto max-w-sm rounded-lg bg-text px-4 py-2.5 text-center text-sm text-bg shadow-lg"
      >
        {toast.message}
      </p>
    </div>
  );
}
