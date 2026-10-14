import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { mockApi } from "../../test/mockApi";
import type { Pattern, Project, ProjectYarnUsage, Yarn } from "../../types/api";
import { ProjectListPage } from "./ProjectListPage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function LocationStub() {
  const { pathname } = useLocation();
  return <p>현재 위치 {pathname}</p>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/projects"]}>
        <Routes>
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="*" element={<LocationStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// 카드에는 실 이름(브랜드·라인명)만 쓰므로 나머지 필드는 채우지 않는다
function usage(id: string, brand: string, lineName: string | null): ProjectYarnUsage {
  return { id, yarn: { id: `yarn-${id}`, brand, lineName } as Yarn } as ProjectYarnUsage;
}

function project(id: string, name: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    userId: "u-1",
    patternId: `pat-${id}`,
    status: "IN_PROGRESS",
    currentRow: 0,
    memo: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-03-15T00:00:00.000Z",
    pattern: { id: `pat-${id}`, name } as Pattern,
    yarnUsages: [],
    photos: [],
    ...overrides,
  };
}

describe("ProjectListPage", () => {
  it("카드에 도안명·상태·연결된 실·단수를 보여주고, 누르면 프로젝트 상세로 간다", async () => {
    mockApi({
      "GET /projects": () => ({
        status: 200,
        body: [
          project("p-1", "라글란 스웨터", {
            currentRow: 12,
            yarnUsages: [usage("u-1", "산네스", "턴디"), usage("u-2", "드롭스", null), usage("u-3", "로완", null)],
          }),
          project("p-2", "양말", { status: "ON_HOLD", currentRow: 1, yarnUsages: [usage("u-4", "드롭스", "플러피")] }),
        ],
      }),
    });
    renderPage();

    const raglan = await screen.findByRole("button", { name: /라글란 스웨터/ });
    expect(within(raglan).getByText(t("enums:projectStatus.IN_PROGRESS"))).toBeInTheDocument();
    // 배색 프로젝트는 첫 실만 쓰고 나머지는 개수로 접는다
    expect(
      within(raglan).getByText(
        `${t("project:list.yarnMoreCount", { name: "산네스 턴디", count: 2 })} · ${t("project:list.rowCount", { count: 12 })}`,
      ),
    ).toBeInTheDocument();
    expect(within(raglan).getByText(new Date("2026-03-15T00:00:00.000Z").toLocaleDateString("ko"))).toBeInTheDocument();

    const socks = screen.getByRole("button", { name: /양말/ });
    expect(within(socks).getByText(t("enums:projectStatus.ON_HOLD"))).toBeInTheDocument();
    expect(within(socks).getByText(`드롭스 플러피 · ${t("project:list.rowCount", { count: 1 })}`)).toBeInTheDocument();

    await userEvent.click(raglan);
    expect(await screen.findByText("현재 위치 /projects/p-1")).toBeInTheDocument();
  });

  it("연결된 실이 없으면 실 미연결로 표시한다", async () => {
    mockApi({ "GET /projects": () => ({ status: 200, body: [project("p-1", "라글란 스웨터", { currentRow: 3 })] }) });
    renderPage();

    expect(
      await screen.findByText(`${t("project:list.yarnUnlinked")} · ${t("project:list.rowCount", { count: 3 })}`),
    ).toBeInTheDocument();
  });

  it("상태 칩을 누르면 그 상태로 다시 불러오고, 전체를 누르면 상태 조건을 뺀다", async () => {
    const api = mockApi({
      "GET /projects": (_body, url) => {
        const status = url.searchParams.get("status");
        return {
          status: 200,
          body: status === "COMPLETED" ? [project("p-2", "완성한 목도리", { status: "COMPLETED" })] : [project("p-1", "라글란 스웨터")],
        };
      },
    });
    renderPage();

    expect(await screen.findByText("라글란 스웨터")).toBeInTheDocument();
    expect(new URL(String(api.fetch.mock.calls[0][0])).searchParams.has("status")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: t("enums:projectStatus.COMPLETED") }));
    expect(await screen.findByText("완성한 목도리")).toBeInTheDocument();
    expect(screen.queryByText("라글란 스웨터")).not.toBeInTheDocument();
    expect(new URL(String(api.fetch.mock.calls[1][0])).searchParams.get("status")).toBe("COMPLETED");

    await userEvent.click(screen.getByRole("button", { name: t("project:list.filterAll") }));
    expect(await screen.findByText("라글란 스웨터")).toBeInTheDocument();
    expect(screen.queryByText("완성한 목도리")).not.toBeInTheDocument();
  });

  it("프로젝트가 없으면 빈 목록 안내를 보여준다", async () => {
    mockApi({ "GET /projects": () => ({ status: 200, body: [] }) });
    renderPage();

    expect(await screen.findByText(t("project:list.emptyMessage"))).toBeInTheDocument();
  });
});
