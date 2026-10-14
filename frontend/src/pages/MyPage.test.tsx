import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../lib/i18n";
import { getToken, setToken } from "../lib/apiClient";
import { createQueryClient } from "../lib/queryClient";
import { AuthProvider } from "../auth/AuthContext";
import { ErrorToast } from "../components/ui/ErrorToast";
import { mockApi } from "../test/mockApi";
import type { AuthProvider as Provider, User } from "../types/api";
import { MyPage } from "./MyPage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function LocationStub() {
  const { pathname } = useLocation();
  return <p>현재 위치 {pathname}</p>;
}

function renderPage() {
  setToken("token");
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/my"]}>
        <AuthProvider>
          <Routes>
            <Route path="/my" element={<MyPage />} />
            <Route path="*" element={<LocationStub />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
      <ErrorToast />
    </QueryClientProvider>,
  );
}

function user(provider: Provider, nickname: string | null = null): User {
  return { id: "u-1", provider, providerId: null, nickname, createdAt: "2026-01-01T00:00:00.000Z" };
}

afterEach(async () => {
  // 언어 전환 테스트가 다른 테스트의 기대 문구(한국어)를 바꾸지 않게 되돌린다
  await i18n.changeLanguage("ko");
});

describe("MyPage", () => {
  it("게스트에게는 데이터 이관 안내와 카카오·구글 로그인 버튼을 보여주고, 로그아웃은 보여주지 않는다", async () => {
    mockApi({ "GET /auth/me": () => ({ status: 200, body: user("GUEST") }) });
    renderPage();

    expect(await screen.findByText(t("auth:myPage.guestUsing"))).toBeInTheDocument();
    expect(screen.getByText(t("auth:myPage.guestMergeNotice"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("auth:myPage.loginKakao") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("auth:myPage.loginGoogle") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("auth:myPage.logout") })).not.toBeInTheDocument();
  });

  it("로그인한 사용자에게는 닉네임과 로그인한 계정 종류를 보여준다", async () => {
    mockApi({ "GET /auth/me": () => ({ status: 200, body: user("GOOGLE", "뜨개인") }) });
    renderPage();

    expect(await screen.findByText("뜨개인")).toBeInTheDocument();
    expect(
      screen.getByText(t("auth:myPage.loggedInWith", { provider: t("auth:provider.GOOGLE") })),
    ).toBeInTheDocument();
  });

  it("닉네임이 없으면 이름 없음으로 표시한다", async () => {
    mockApi({ "GET /auth/me": () => ({ status: 200, body: user("KAKAO") }) });
    renderPage();

    expect(await screen.findByText(t("auth:myPage.nicknameEmpty"))).toBeInTheDocument();
  });

  it("닉네임을 앞뒤 공백을 뺀 값으로 저장하고 바뀐 닉네임을 보여준다", async () => {
    const api = mockApi({
      "GET /auth/me": () => ({ status: 200, body: user("KAKAO", "뜨개인") }),
      "PATCH /auth/me": (body) => ({ status: 200, body: { ...user("KAKAO"), ...(body as object) } }),
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("auth:myPage.nicknameEdit") }));
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("뜨개인");
    await userEvent.clear(input);
    await userEvent.type(input, "  코바늘러  ");
    await userEvent.click(screen.getByRole("button", { name: t("auth:myPage.nicknameSave") }));

    expect(await screen.findByText("코바늘러")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(api.bodiesOf("PATCH /auth/me")).toEqual([{ nickname: "코바늘러" }]);
  });

  it("닉네임을 비우면 저장할 수 없고, 취소하면 저장하지 않고 원래 닉네임으로 돌아간다", async () => {
    const api = mockApi({ "GET /auth/me": () => ({ status: 200, body: user("KAKAO", "뜨개인") }) });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("auth:myPage.nicknameEdit") }));
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "   ");
    expect(screen.getByRole("button", { name: t("auth:myPage.nicknameSave") })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: t("auth:myPage.nicknameCancel") }));

    expect(screen.getByText("뜨개인")).toBeInTheDocument();
    expect(api.bodiesOf("PATCH /auth/me")).toEqual([]);
  });

  it("닉네임 저장이 실패하면 입력 중인 값을 그대로 두고 오류 토스트를 띄운다", async () => {
    mockApi({
      "GET /auth/me": () => ({ status: 200, body: user("KAKAO", "뜨개인") }),
      "PATCH /auth/me": () => ({ status: 400, body: { message: "닉네임이 너무 깁니다" } }),
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("auth:myPage.nicknameEdit") }));
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "코바늘러");
    await userEvent.click(screen.getByRole("button", { name: t("auth:myPage.nicknameSave") }));

    expect(await screen.findByText("닉네임이 너무 깁니다")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("코바늘러");
    expect(screen.getByRole("button", { name: t("auth:myPage.nicknameSave") })).toBeEnabled();
  });

  it("로그아웃하면 토큰을 지우고 첫 화면으로 간다", async () => {
    mockApi({ "GET /auth/me": () => ({ status: 200, body: user("KAKAO", "뜨개인") }) });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("auth:myPage.logout") }));

    expect(await screen.findByText("현재 위치 /")).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it("언어 버튼으로 화면 언어를 바꾼다", async () => {
    mockApi({ "GET /auth/me": () => ({ status: 200, body: user("KAKAO", "뜨개인") }) });
    renderPage();

    expect(await screen.findByRole("heading", { name: i18n.t("auth:myPage.title", { lng: "ko" }) })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByRole("heading", { name: i18n.t("auth:myPage.title", { lng: "en" }) })).toBeInTheDocument();
    expect(i18n.language).toBe("en");
  });
});
