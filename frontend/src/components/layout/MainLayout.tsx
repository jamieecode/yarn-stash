import { Outlet } from "react-router-dom";
import { BottomTabBar } from "./BottomTabBar";
import { ErrorBoundary } from "../ErrorBoundary";

// 목록형 화면(실/도안/프로젝트/마이 탭) 전용 레이아웃 - 하단 탭바 표시
export function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1 overflow-y-auto pb-2">
        {/* 탭바는 바운더리 밖에 둬서 화면이 에러가 나도 다른 탭으로 빠져나갈 수 있게 함 */}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      <BottomTabBar />
    </div>
  );
}
