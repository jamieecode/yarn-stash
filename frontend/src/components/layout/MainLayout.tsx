import { Outlet } from "react-router-dom";
import { BottomTabBar } from "./BottomTabBar";

// 목록형 화면(실/도안/프로젝트/마이 탭) 전용 레이아웃 - 하단 탭바 표시
export function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1 overflow-y-auto pb-2">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
