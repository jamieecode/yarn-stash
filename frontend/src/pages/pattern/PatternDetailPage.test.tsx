import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { setToken } from "../../lib/apiClient";
import { createQueryClient } from "../../lib/queryClient";
import { AuthProvider } from "../../auth/AuthContext";
import { ErrorToast } from "../../components/ui/ErrorToast";
import { mockApi } from "../../test/mockApi";
import type { DeleteEligibility, Pattern, PatternYarnMatch, Yarn } from "../../types/api";
import { PatternDetailPage } from "./PatternDetailPage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function LocationStub() {
  const { pathname } = useLocation();
  return <p>현재 위치 {pathname}</p>;
}

function renderPage() {
  // 소유자 여부는 /auth/me의 사용자 id(u-1)와 도안의 createdByUserId를 비교해 정한다
  setToken("token");
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/patterns/pat-1"]}>
        <AuthProvider>
          <Routes>
            <Route path="/patterns/:id" element={<PatternDetailPage />} />
            <Route path="*" element={<LocationStub />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
      <ErrorToast />
    </QueryClientProvider>,
  );
}

function pattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: "pat-1",
    createdByUserId: "u-2",
    name: "라글란 스웨터",
    designer: "김뜨개",
    craftType: "KNITTING",
    weightCategory: "DK",
    requiredMinM: 800,
    requiredMaxM: 1200,
    requiredUnit: "METRIC",
    gaugeStitches: 22,
    sourceUrl: "https://example.com/raglan",
    sourceType: "LINK",
    ravelryId: null,
    thumbnailUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    originalYarnCatalogId: null,
    originalYarnBrand: "산네스",
    originalYarnLine: "턴디",
    myBookmark: null,
    ...overrides,
  };
}

function yarn(id: string, brand: string, totalM: number, committedM: number): Yarn {
  return {
    id,
    userId: "u-1",
    catalogId: null,
    brand,
    lineName: null,
    colorName: null,
    fiber: null,
    weightCategory: "DK",
    needleSize: null,
    gaugeStitches: null,
    memo: null,
    consumed: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    batches: [],
    photos: [],
    totalM,
    committedM,
    availableM: totalM - committedM,
    usages: [],
  };
}

function match(y: Yarn, needsLotMixing = false): PatternYarnMatch {
  return { yarn: y, ratioPercent: 120, label: "SUFFICIENT", gaugeChip: null, sizeCoverage: null, needsLotMixing };
}

type Handler = Parameters<typeof mockApi>[0][string];

function mockPattern(p: Pattern, routes: Record<string, Handler> = {}) {
  return mockApi({
    "GET /auth/me": () => ({
      status: 200,
      body: { id: "u-1", provider: "KAKAO", providerId: "k-1", nickname: "뜨개인", createdAt: "2026-01-01T00:00:00.000Z" },
    }),
    "GET /patterns/pat-1": () => ({ status: 200, body: p }),
    "GET /patterns/pat-1/yarn-matches": () => ({ status: 200, body: [] }),
    ...routes,
  });
}

const deleteCheck = (body: DeleteEligibility) => () => ({ status: 200, body });
const bookmarkButton = () => screen.getByRole("button", { name: t("pattern:detail.bookmarkAria") });
const startButton = () => screen.getByRole("button", { name: t("pattern:detail.startProject") });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PatternDetailPage 정보·매칭", () => {
  it("도안 정보와 원본 실·링크를 보여준다", async () => {
    mockPattern(pattern());
    renderPage();

    expect(await screen.findByText("김뜨개")).toBeInTheDocument();
    expect(screen.getByText(t("pattern:card.requiredRange", { min: 800, max: 1200 }))).toBeInTheDocument();
    expect(screen.getByText(t("pattern:detail.originalYarnLabel", { name: "산네스 턴디" }))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t("pattern:detail.originalLinkLabel") })).toHaveAttribute("href", "https://example.com/raglan");
  });

  it("맞는 실을 쓸 수 있는 양·로트 혼합 안내와 함께 보여주고, 누르면 실 상세로 간다", async () => {
    mockPattern(pattern(), {
      "GET /patterns/pat-1/yarn-matches": () => ({
        status: 200,
        body: [match(yarn("yarn-1", "드롭스", 1500, 300), true), match(yarn("yarn-2", "로완", 1000, 0))],
      }),
    });
    renderPage();

    const drops = await screen.findByText("드롭스");
    // 다른 프로젝트가 잡고 있는 실만 보유량 대비 가용량을 보여준다
    expect(screen.getByText(t("pattern:detail.availableOfTotal", { available: 1200, total: 1500 }))).toBeInTheDocument();
    expect(screen.getAllByText(/쓸 수 있는 양/)).toHaveLength(1);
    expect(screen.getAllByText(t("pattern:detail.needsLotMixing"))).toHaveLength(1);

    await userEvent.click(drops);
    expect(await screen.findByText("현재 위치 /yarns/yarn-1")).toBeInTheDocument();
  });

  it("맞는 실이 없으면 안내를 보여준다", async () => {
    mockPattern(pattern());
    renderPage();

    expect(await screen.findByText(t("pattern:detail.matchesEmpty"))).toBeInTheDocument();
  });
});

describe("PatternDetailPage 수정·삭제 권한", () => {
  it("다른 사람이 등록한 도안에는 수정·삭제 버튼이 없고 삭제 가능 여부도 묻지 않는다", async () => {
    const api = mockPattern(pattern());
    renderPage();
    await screen.findByText("김뜨개");

    expect(screen.queryByRole("button", { name: t("pattern:detail.editAria") })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("pattern:detail.deleteAria") })).not.toBeInTheDocument();
    expect(api.bodiesOf("GET /patterns/pat-1/delete-check")).toHaveLength(0);
  });

  it("내 도안은 수정 화면으로 갈 수 있다", async () => {
    mockPattern(pattern({ createdByUserId: "u-1" }), { "GET /patterns/pat-1/delete-check": deleteCheck({ canDelete: true }) });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("pattern:detail.editAria") }));

    expect(await screen.findByText("현재 위치 /patterns/pat-1/edit")).toBeInTheDocument();
  });

  it("삭제할 수 있으면 확인 후 지우고 도안 목록으로 간다", async () => {
    mockPattern(pattern({ createdByUserId: "u-1" }), {
      "GET /patterns/pat-1/delete-check": deleteCheck({ canDelete: true }),
      "DELETE /patterns/pat-1": () => ({ status: 200, body: { success: true } }),
    });
    renderPage();
    const deleteButton = await screen.findByRole("button", { name: t("pattern:detail.deleteAria") });
    await waitFor(() => expect(deleteButton).toBeEnabled());

    await userEvent.click(deleteButton);
    const modal = screen.getByText(t("pattern:detail.deleteConfirmTitle")).parentElement!;
    await userEvent.click(within(modal).getByRole("button", { name: t("common:action.delete") }));

    expect(await screen.findByText("현재 위치 /patterns")).toBeInTheDocument();
  });

  it.each(["HAS_PROJECT", "BOOKMARKED_BY_OTHERS"] as const)("삭제할 수 없으면(%s) 버튼을 막고 이유를 보여준다", async (reason) => {
    mockPattern(pattern({ createdByUserId: "u-1" }), { "GET /patterns/pat-1/delete-check": deleteCheck({ canDelete: false, reason }) });
    renderPage();

    expect(await screen.findByText(t(`pattern:detail.deleteReason.${reason}`))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("pattern:detail.deleteAria") })).toBeDisabled();
  });

  it("삭제가 거부되면 사유를 토스트로 보여주고 화면에 남는다", async () => {
    mockPattern(pattern({ createdByUserId: "u-1" }), {
      "GET /patterns/pat-1/delete-check": deleteCheck({ canDelete: true }),
      "DELETE /patterns/pat-1": () => ({ status: 403, body: { message: "진행 중인 프로젝트가 있어 삭제할 수 없어요" } }),
    });
    renderPage();
    const deleteButton = await screen.findByRole("button", { name: t("pattern:detail.deleteAria") });
    await waitFor(() => expect(deleteButton).toBeEnabled());

    await userEvent.click(deleteButton);
    const modal = screen.getByText(t("pattern:detail.deleteConfirmTitle")).parentElement!;
    await userEvent.click(within(modal).getByRole("button", { name: t("common:action.delete") }));

    expect(await screen.findByRole("alert")).toHaveTextContent("진행 중인 프로젝트가 있어 삭제할 수 없어요");
    expect(screen.queryByText(/현재 위치/)).not.toBeInTheDocument();
  });
});

describe("PatternDetailPage 찜·메모", () => {
  it("찜하지 않은 도안은 찜을 추가하고, 메모 칸은 보이지 않는다", async () => {
    const api = mockPattern(pattern(), { "POST /patterns/pat-1/bookmark": () => ({ status: 201, body: {} }) });
    renderPage();
    await screen.findByText("김뜨개");

    expect(bookmarkButton()).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(t("pattern:detail.memoLabel"))).not.toBeInTheDocument();

    await userEvent.click(bookmarkButton());
    await waitFor(() => expect(api.bodiesOf("POST /patterns/pat-1/bookmark")).toHaveLength(1));
  });

  it("찜한 도안은 찜을 해제한다", async () => {
    const api = mockPattern(pattern({ myBookmark: { memo: null } }), { "DELETE /patterns/pat-1/bookmark": () => ({ status: 200, body: {} }) });
    renderPage();
    await screen.findByText("김뜨개");

    expect(bookmarkButton()).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(bookmarkButton());
    await waitFor(() => expect(api.bodiesOf("DELETE /patterns/pat-1/bookmark")).toHaveLength(1));
  });

  it("찜 메모는 바뀌었을 때만 입력을 마치면 저장한다 (메모가 없을 때 그냥 지나가도 저장하지 않음)", async () => {
    const api = mockPattern(pattern({ myBookmark: { memo: null } }), { "PATCH /patterns/pat-1/bookmark": () => ({ status: 200, body: {} }) });
    renderPage();
    const memo = await screen.findByPlaceholderText(t("pattern:detail.memoPlaceholder"));

    await userEvent.click(memo);
    await userEvent.tab();
    expect(api.bodiesOf("PATCH /patterns/pat-1/bookmark")).toEqual([]);

    await userEvent.type(memo, "5.5mm로 뜰 것");
    await userEvent.tab();
    await waitFor(() => expect(api.bodiesOf("PATCH /patterns/pat-1/bookmark")).toEqual([{ memo: "5.5mm로 뜰 것" }]));
  });
});

describe("PatternDetailPage 프로젝트 시작", () => {
  it("이 도안으로 진행 중인 프로젝트가 있으면 새로 만들지 않고 그 프로젝트로 간다", async () => {
    const api = mockPattern(pattern(), { "GET /projects": () => ({ status: 200, body: [{ id: "proj-7" }] }) });
    renderPage();
    await screen.findByText("김뜨개");

    await userEvent.click(startButton());

    expect(await screen.findByText("현재 위치 /projects/proj-7")).toBeInTheDocument();
    const projectsUrl = new URL(String(api.fetch.mock.calls.find(([input]) => String(input).includes("/projects?"))![0]));
    expect(projectsUrl.searchParams.get("patternId")).toBe("pat-1");
    expect(projectsUrl.searchParams.get("status")).toBe("IN_PROGRESS");
  });

  it("진행 중인 프로젝트가 없으면 프로젝트 시작 화면으로 간다", async () => {
    mockPattern(pattern(), { "GET /projects": () => ({ status: 200, body: [] }) });
    renderPage();
    await screen.findByText("김뜨개");

    await userEvent.click(startButton());

    expect(await screen.findByText("현재 위치 /patterns/pat-1/start-project")).toBeInTheDocument();
  });

  it("확인에 실패하면 사유를 토스트로 보여주고 다시 누를 수 있다", async () => {
    mockPattern(pattern(), { "GET /projects": () => ({ status: 500, body: { message: "잠시 후 다시 시도해주세요" } }) });
    renderPage();
    await screen.findByText("김뜨개");

    await userEvent.click(startButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("잠시 후 다시 시도해주세요");
    expect(startButton()).toBeEnabled();
  });
});
