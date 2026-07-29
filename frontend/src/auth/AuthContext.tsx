import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, clearToken, getToken, setToken as persistToken } from "../lib/apiClient";
import type { AuthResponse, User } from "../types/api";

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID as string | undefined;
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI as string | undefined;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI as string | undefined;

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /** 게스트든 로그인이든, 유효한 세션 토큰이 있는지 - 화면설계서 0-1 "세션 토큰이 이미 있는 기기" 판별용 */
  hasSession: boolean;
  isGuest: boolean;
  loginAsGuest: () => Promise<void>;
  completeKakaoLogin: (code: string) => Promise<void>;
  completeGoogleLogin: (code: string) => Promise<void>;
  redirectToKakao: () => void;
  redirectToGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(getToken());

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => api.get<User>("/auth/me"),
    enabled: Boolean(token),
    retry: false,
  });

  // 토큰이 만료/손상됐으면 /auth/me가 401을 던짐 - 그대로 두면 로딩만 계속되므로 세션을 정리
  useEffect(() => {
    if (meQuery.isError) logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meQuery.isError]);

  function applySession(res: AuthResponse) {
    persistToken(res.accessToken);
    setTokenState(res.accessToken);
  }

  // 게스트로 시작하기 - 서버가 익명 User를 만들고 JWT를 발급 (기획서 2.9)
  async function loginAsGuest() {
    const res = await api.post<AuthResponse>("/auth/guest");
    applySession(res);
  }

  // 콜백 시점에 localStorage에 남아있는 기존 게스트 토큰이 Authorization 헤더로 함께 전송되어
  // 백엔드가 자동으로 게스트 데이터를 병합한다 (기획서 2.9 "게스트 → 계정 전환 시 데이터 병합")
  async function completeKakaoLogin(code: string) {
    const res = await api.post<AuthResponse>("/auth/kakao", { code });
    applySession(res);
  }

  async function completeGoogleLogin(code: string) {
    const res = await api.post<AuthResponse>("/auth/google", { code });
    applySession(res);
  }

  function redirectToKakao() {
    const url = new URL("https://kauth.kakao.com/oauth/authorize");
    url.searchParams.set("client_id", KAKAO_CLIENT_ID ?? "");
    url.searchParams.set("redirect_uri", KAKAO_REDIRECT_URI ?? "");
    url.searchParams.set("response_type", "code");
    window.location.href = url.toString();
  }

  function redirectToGoogle() {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID ?? "");
    url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI ?? "");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    window.location.href = url.toString();
  }

  function logout() {
    clearToken();
    setTokenState(null);
    queryClient.clear();
  }

  const user = meQuery.data ?? null;

  const value: AuthContextValue = {
    user,
    isLoading: Boolean(token) && meQuery.isLoading,
    hasSession: Boolean(token),
    isGuest: user?.provider === "GUEST",
    loginAsGuest,
    completeKakaoLogin,
    completeGoogleLogin,
    redirectToKakao,
    redirectToGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있어요");
  return ctx;
}
