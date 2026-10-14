import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../lib/i18n";
import { setToken } from "../lib/apiClient";
import { createQueryClient } from "../lib/queryClient";
import { AuthProvider } from "../auth/AuthContext";
import { mockApi } from "../test/mockApi";
import type { DashboardSummary, User } from "../types/api";
import { HomePage } from "./HomePage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function LocationStub() {
  const { pathname } = useLocation();
  return <p>현재 위치 {pathname}</p>;
}

function renderPage() {
  // 머리말의 닉네임은 /auth/me에서 온다
  setToken("token");
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/home"]}>
        <AuthProvider>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="*" element={<LocationStub />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function user(nickname: string | null): User {
  return { id: "u-1", provider: "KAKAO", providerId: "k-1", nickname, createdAt: "2026-01-01T00:00:00.000Z" };
}

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    stash: { yarnCount: 3, skeinCount: 7, totalM: 2400, committedM: 600, availableM: 1800, totalG: 350 },
    weightDistribution: [{ weightCategory: "DK", yarnCount: 3, totalM: 2400, availableM: 1800 }],
    projects: { IN_PROGRESS: 2, ON_HOLD: 1, COMPLETED: 4 },
    bookmarkCount: 5,
    readyToKnit: {
      count: 1,
      samples: [
        {
          id: "pat-1",
          name: "라글란 스웨터",
          designer: null,
          thumbnailUrl: null,
          craftType: "KNITTING",
          weightCategory: "DK",
          requiredMinM: 800,
          yarn: { id: "yarn-1", brand: "산네스", lineName: "턴디", availableM: 1000 },
        },
      ],
    },
    ...overrides,
  };
}

function mockHome(dashboard: DashboardSummary, nickname: string | null = "뜨개인") {
  return mockApi({
    "GET /auth/me": () => ({ status: 200, body: user(nickname) }),
    "GET /dashboard": () => ({ status: 200, body: dashboard }),
  });
}

describe("HomePage", () => {
  it("닉네임 머리말과 쓸 수 있는 양·총 보유량·타래 수·프로젝트 사용 비율을 보여주고, 요약 카드를 누르면 실 목록으로 간다", async () => {
    mockHome(summary());
    renderPage();

    expect(await screen.findByRole("heading", { name: t("dashboard:home.headerNickname", { nickname: "뜨개인" }) })).toBeInTheDocument();
    const card = screen.getByRole("button", { name: new RegExp(t("dashboard:home.summaryTitle")) });
    expect(within(card).getByText("1,800")).toBeInTheDocument();
    expect(within(card).getByText(t("dashboard:home.summaryTotalOwned", { meters: "2,400" }))).toBeInTheDocument();
    expect(within(card).getByText(t("dashboard:home.summaryYarnAndSkeins", { count: 3, skeins: "7" }))).toBeInTheDocument();
    expect(within(card).getByText(t("dashboard:home.summaryCommittedShare", { percent: 25 }))).toBeInTheDocument();

    await userEvent.click(card);
    expect(await screen.findByText("현재 위치 /yarns")).toBeInTheDocument();
  });

  it("닉네임이 없으면 기본 머리말을, 프로젝트에 쓰는 양이 없으면 사용 비율을 빼고 보여준다", async () => {
    mockHome(
      summary({ stash: { yarnCount: 1, skeinCount: 2, totalM: 400, committedM: 0, availableM: 400, totalG: 100 } }),
      null,
    );
    renderPage();

    expect(await screen.findByText(t("dashboard:home.summaryTitle"))).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: t("dashboard:home.headerDefault") })).toBeInTheDocument();
    expect(screen.queryByText(t("dashboard:home.summaryCommittedShare", { percent: 0 }))).not.toBeInTheDocument();
  });

  it("실이 하나도 없으면 통계 대신 실 등록 안내를 보여준다", async () => {
    mockHome(
      summary({
        stash: { yarnCount: 0, skeinCount: 0, totalM: 0, committedM: 0, availableM: 0, totalG: 0 },
        weightDistribution: [],
        readyToKnit: { count: 0, samples: [] },
      }),
    );
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("dashboard:home.emptyCta") }));

    expect(await screen.findByText("현재 위치 /yarns/new")).toBeInTheDocument();
  });

  it("바로 뜰 수 있는 도안을 보여주고, 누르면 도안 상세로 간다", async () => {
    mockHome(summary());
    renderPage();

    expect(await screen.findByText(t("dashboard:home.readyCount", { count: 1 }))).toBeInTheDocument();
    const sample = screen.getByRole("button", { name: /라글란 스웨터/ });
    expect(within(sample).getByText(/산네스 턴디/)).toBeInTheDocument();
    expect(within(sample).getByText(new RegExp(t("dashboard:home.readyRequiredMeters", { meters: "800" })))).toBeInTheDocument();

    await userEvent.click(sample);
    expect(await screen.findByText("현재 위치 /patterns/pat-1")).toBeInTheDocument();
  });

  it("바로 뜰 수 있는 도안이 없으면 안내 문구를 보여준다", async () => {
    mockHome(summary({ readyToKnit: { count: 0, samples: [] } }));
    renderPage();

    expect(await screen.findByText(t("dashboard:home.readyEmpty"))).toBeInTheDocument();
  });

  it("상태별 프로젝트 수와 찜한 도안 수를 보여주고, 찜 타일을 누르면 도안 목록으로 간다", async () => {
    mockHome(summary());
    renderPage();

    expect(await screen.findByRole("button", { name: `2 ${t("enums:projectStatus.IN_PROGRESS")}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `1 ${t("enums:projectStatus.ON_HOLD")}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `4 ${t("enums:projectStatus.COMPLETED")}` })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: `5 ${t("dashboard:home.tileBookmarked")}` }));
    expect(await screen.findByText("현재 위치 /patterns")).toBeInTheDocument();
  });

  it("프로젝트 타일을 누르면 프로젝트 목록으로 간다", async () => {
    mockHome(summary());
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: `2 ${t("enums:projectStatus.IN_PROGRESS")}` }));

    expect(await screen.findByText("현재 위치 /projects")).toBeInTheDocument();
  });
});
