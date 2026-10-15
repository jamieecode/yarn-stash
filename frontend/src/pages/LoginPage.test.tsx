import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../lib/i18n";
import { getToken } from "../lib/apiClient";
import { createQueryClient } from "../lib/queryClient";
import { AuthProvider } from "../auth/AuthContext";
import { mockApi } from "../test/mockApi";
import { LoginPage } from "./LoginPage";

const t = (key: string) => i18n.t(key);

function LocationStub() {
  const { pathname } = useLocation();
  return <p>현재 위치 {pathname}</p>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LocationStub />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// jsdom은 다른 주소로 이동하지 못하므로 window.location을 바꿔 끼워 이동하려던 주소만 받아 둔다
function stubLocation() {
  const location = { href: "" };
  vi.stubGlobal("location", location);
  return location;
}

describe("LoginPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("게스트로 시작하면 받은 토큰을 저장하고 홈으로 간다", async () => {
    const api = mockApi({
      "POST /auth/guest": () => ({ status: 201, body: { accessToken: "guest-token", user: { id: "g-1", provider: "GUEST" } } }),
      "GET /auth/me": () => ({ status: 200, body: { id: "g-1", provider: "GUEST" } }),
    });
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: t("auth:loginPage.guestStart") }));

    expect(await screen.findByText("현재 위치 /home")).toBeInTheDocument();
    expect(api.bodiesOf("POST /auth/guest")).toHaveLength(1);
    expect(getToken()).toBe("guest-token");
  });

  it("게스트 시작 요청이 진행 중이면 버튼을 막아 두 번 요청하지 않는다", async () => {
    let respond!: () => void;
    const api = mockApi({
      "POST /auth/guest": () =>
        new Promise((resolve) => {
          respond = () => resolve({ status: 201, body: { accessToken: "guest-token", user: { id: "g-1", provider: "GUEST" } } });
        }),
      "GET /auth/me": () => ({ status: 200, body: { id: "g-1", provider: "GUEST" } }),
    });
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: t("auth:loginPage.guestStart") }));
    const pending = screen.getByRole("button", { name: t("auth:loginPage.guestStarting") });
    expect(pending).toBeDisabled();
    await userEvent.click(pending);

    respond();
    expect(await screen.findByText("현재 위치 /home")).toBeInTheDocument();
    expect(api.bodiesOf("POST /auth/guest")).toHaveLength(1);
  });

  it("게스트 시작이 실패하면 화면에 남아 안내 문구를 보여주고 다시 누를 수 있다", async () => {
    mockApi({
      "POST /auth/guest": () => ({ status: 500, body: { message: "Internal server error" } }),
    });
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: t("auth:loginPage.guestStart") }));

    expect(await screen.findByText(t("auth:loginPage.guestError"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("auth:loginPage.guestStart") })).toBeEnabled();
    expect(screen.queryByText(/현재 위치/)).not.toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it("카카오 로그인은 닉네임 동의를 함께 요청하는 카카오 인가 주소로 이동한다", async () => {
    const api = mockApi({});
    const location = stubLocation();
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: t("auth:loginPage.loginKakao") }));

    const url = new URL(location.href);
    expect(`${url.origin}${url.pathname}`).toBe("https://kauth.kakao.com/oauth/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: import.meta.env.VITE_KAKAO_CLIENT_ID ?? "",
      redirect_uri: import.meta.env.VITE_KAKAO_REDIRECT_URI ?? "",
      response_type: "code",
      scope: "profile_nickname",
    });
    expect(api.fetch).not.toHaveBeenCalled();
  });

  it("구글 로그인은 openid·email·profile 스코프로 구글 인가 주소로 이동한다", async () => {
    const api = mockApi({});
    const location = stubLocation();
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: t("auth:loginPage.loginGoogle") }));

    const url = new URL(location.href);
    expect(`${url.origin}${url.pathname}`).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? "",
      response_type: "code",
      scope: "openid email profile",
    });
    expect(api.fetch).not.toHaveBeenCalled();
  });
});
