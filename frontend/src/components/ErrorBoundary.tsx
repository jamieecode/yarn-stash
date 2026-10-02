import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface BoundaryProps {
  // 값이 바뀌면 에러 상태를 풀어준다 - 다른 화면으로 이동했는데 계속 에러 화면이 남아 있으면 안 되므로 경로를 넘김
  resetKey: string;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
  resetKey: string;
}

// React 에러 바운더리는 아직 클래스 컴포넌트로만 만들 수 있다
class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  // key로 리셋하면 경로가 바뀔 때마다 하위 트리 전체가 다시 마운트되므로, 에러 상태만 풀어준다
  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): Partial<BoundaryState> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) return <ErrorFallback onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-text">{t("errorBoundary.title")}</p>
      <p className="text-xs text-muted">{t("errorBoundary.description")}</p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={onRetry}
          className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          {t("errorBoundary.retry")}
        </button>
        {/* 상태가 꼬였을 수 있으니 SPA 내 이동이 아니라 새로 로드 */}
        <a href="/home" className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-text no-underline">
          {t("errorBoundary.goHome")}
        </a>
      </div>
    </div>
  );
}

// 렌더링 중 예외가 나도 앱 전체가 빈 화면이 되지 않도록 화면 단위로 감싼다
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
}
