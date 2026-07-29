import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LoginPage } from "./LoginPage";

// 화면설계서 0-1 - 세션 토큰이 이미 있는 기기는 이 화면을 건너뛰고 바로 메인으로 진입
export function IndexGate() {
  const { hasSession, isLoading } = useAuth();

  if (isLoading) return null;
  if (hasSession) return <Navigate to="/yarns" replace />;
  return <LoginPage />;
}
