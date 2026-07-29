import { Outlet } from "react-router-dom";

// 등록/상세/수정 화면 전용 레이아웃 - 탭바를 숨기고 각 페이지의 TopBar 뒤로가기로만 복귀 (화면설계서 0-2)
export function PlainLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Outlet />
    </div>
  );
}
