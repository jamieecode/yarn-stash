import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "./lib/i18n";
import { getToken, setToken } from "./lib/apiClient";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";

function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const loginHeading = () => ({ name: i18n.t("auth:loginPage.title") });

afterEach(() => {
  vi.unstubAllGlobals();
});

// 라우팅/세션 가드 스모크 테스트 - 각 화면의 세부 동작이 아니라 앱이 뜨고 올바른 화면으로 가는지만 본다
describe("App", () => {
  it("세션이 없으면 시작 화면을 보여준다", () => {
    renderApp("/");
    expect(screen.getByRole("heading", loginHeading())).toBeInTheDocument();
  });

  it("세션 없이 보호된 화면으로 딥링크하면 시작 화면으로 돌려보낸다", () => {
    renderApp("/yarns");
    expect(screen.getByRole("heading", loginHeading())).toBeInTheDocument();
  });

  it("토큰이 만료돼 /auth/me가 401이면 세션을 정리하고 시작 화면으로 돌려보낸다", async () => {
    setToken("expired");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })),
    );

    renderApp("/yarns");

    expect(await screen.findByRole("heading", loginHeading())).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});
