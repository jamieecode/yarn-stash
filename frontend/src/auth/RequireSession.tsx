import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// 목록/등록/상세 등 세션이 필요한 라우트 그룹을 감싸는 가드 - 토큰이 없으면 시작 화면으로 되돌림
// (화면설계서 0-1 - 세션 없는 상태에서 딥링크로 바로 들어오는 경우까지 방어)
export function RequireSession() {
  const { hasSession, isLoading } = useAuth();

  if (isLoading) return null;
  if (!hasSession) return <Navigate to="/" replace />;
  return <Outlet />;
}
