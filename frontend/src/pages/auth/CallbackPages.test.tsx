import { StrictMode, type ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { getToken, setToken } from "../../lib/apiClient";
import { createQueryClient } from "../../lib/queryClient";
import { AuthProvider } from "../../auth/AuthContext";
import { mockApi } from "../../test/mockApi";
import { GoogleCallbackPage } from "./GoogleCallbackPage";
import { KakaoCallbackPage } from "./KakaoCallbackPage";

const t = (key: string) => i18n.t(key);

function LocationStub() {
  const { pathname } = useLocation();
  return <p>현재 위치 {pathname}</p>;
}

// 두 콜백 화면은 호출하는 로그인 API와 문구만 다르다
describe.each([
  { name: "KakaoCallbackPage", Page: KakaoCallbackPage, provider: "kakao", ns: "kakaoCallback" },
  { name: "GoogleCallbackPage", Page: GoogleCallbackPage, provider: "google", ns: "googleCallback" },
] as { name: string; Page: ComponentType; provider: string; ns: string }[])("$name", ({ Page, provider, ns }) => {
  const path = `/auth/${provider}/callback`;
  const loginKey = `POST /auth/${provider}`;

  function renderPage(search: string) {
    // StrictMode는 effect를 두 번 실행한다 - 인가 코드는 한 번만 쓸 수 있어서 요청도 한 번만 나가야 한다
    return render(
      <StrictMode>
        <QueryClientProvider client={createQueryClient()}>
          <MemoryRouter initialEntries={[`${path}${search}`]}>
            <AuthProvider>
              <Routes>
                <Route path={path} element={<Page />} />
                <Route path="*" element={<LocationStub />} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </StrictMode>,
    );
  }

  it("인가 코드로 로그인을 한 번만 요청하고, 받은 토큰을 저장한 뒤 홈으로 간다", async () => {
    const api = mockApi({
      [loginKey]: () => ({ status: 200, body: { accessToken: "new-token", user: { id: "u-1", provider: provider.toUpperCase() } } }),
      "GET /auth/me": () => ({ status: 200, body: { id: "u-1" } }),
    });
    renderPage("?code=auth-code");

    expect(screen.getByText(t(`auth:${ns}.processing`))).toBeInTheDocument();
    expect(await screen.findByText("현재 위치 /home")).toBeInTheDocument();
    expect(api.bodiesOf(loginKey)).toEqual([{ code: "auth-code" }]);
    expect(getToken()).toBe("new-token");
  });

  it("게스트 토큰이 남아 있으면 로그인 요청에 함께 보내 서버가 게스트 데이터를 병합하게 한다", async () => {
    setToken("guest-token");
    const api = mockApi({
      [loginKey]: () => ({ status: 200, body: { accessToken: "new-token", user: { id: "u-1", provider: provider.toUpperCase() } } }),
      "GET /auth/me": () => ({ status: 200, body: { id: "u-1" } }),
    });
    renderPage("?code=auth-code");

    expect(await screen.findByText("현재 위치 /home")).toBeInTheDocument();
    const loginCall = api.fetch.mock.calls.find(([input, init]) => init?.method === "POST" && String(input).endsWith(`/auth/${provider}`));
    expect(loginCall?.[1]?.headers).toMatchObject({ Authorization: "Bearer guest-token" });
    expect(getToken()).toBe("new-token");
  });

  it("인가 코드가 없으면 요청하지 않고 실패 문구를 보여준다", async () => {
    const api = mockApi({});
    renderPage("?error=access_denied");

    expect(await screen.findByText(t(`auth:${ns}.failed`))).toBeInTheDocument();
    expect(api.fetch).not.toHaveBeenCalled();
  });

  it("로그인 요청이 실패하면 실패 문구를 보여주고 토큰을 바꾸지 않는다", async () => {
    setToken("guest-token");
    mockApi({
      [loginKey]: () => ({ status: 401, body: { message: "Unauthorized" } }),
      "GET /auth/me": () => ({ status: 200, body: { id: "guest", provider: "GUEST" } }),
    });
    renderPage("?code=expired-code");

    expect(await screen.findByText(t(`auth:${ns}.failed`))).toBeInTheDocument();
    expect(getToken()).toBe("guest-token");
  });
});
