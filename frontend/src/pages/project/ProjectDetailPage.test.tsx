import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { ErrorToast } from "../../components/ui/ErrorToast";
import { mockApi } from "../../test/mockApi";
import type { Pattern, PatternYarnMatch, Project, ProjectYarnUsage, Yarn } from "../../types/api";
import { ProjectDetailPage } from "./ProjectDetailPage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/projects/proj-1"]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects" element={<p>프로젝트 목록</p>} />
        </Routes>
      </MemoryRouter>
      <ErrorToast />
    </QueryClientProvider>,
  );
}

const PATTERN: Pattern = {
  id: "pat-1",
  createdByUserId: "u-1",
  name: "라글란 스웨터",
  designer: null,
  craftType: "KNITTING",
  weightCategory: "DK",
  requiredMinM: 800,
  requiredMaxM: null,
  requiredUnit: "METRIC",
  gaugeStitches: null,
  sourceUrl: null,
  sourceType: "USER",
  ravelryId: null,
  thumbnailUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  originalYarnCatalogId: null,
  originalYarnBrand: null,
  originalYarnLine: null,
};

function yarn(id: string, brand: string, totalM: number, availableM: number): Yarn {
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
    committedM: totalM - availableM,
    availableM,
    usages: [],
  };
}

function usage(y: Yarn, reservedM: number, usedM: number | null = null): ProjectYarnUsage {
  return {
    id: `usage-${y.id}`,
    projectId: "proj-1",
    yarnId: y.id,
    reservedM,
    usedM,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    yarn: y,
  };
}

// 실 1000m 중 이 프로젝트가 200m를 예약해 둔 상태 (availableM은 예약분이 이미 빠진 값)
const SANNES = yarn("yarn-1", "산네스", 1000, 800);

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    userId: "u-1",
    patternId: "pat-1",
    status: "IN_PROGRESS",
    currentRow: 5,
    memo: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    pattern: PATTERN,
    yarnUsages: [usage(SANNES, 200)],
    photos: [],
    ...overrides,
  };
}

type Handler = Parameters<typeof mockApi>[0][string];

function mockProject(p: Project, routes: Record<string, Handler> = {}) {
  return mockApi({
    "GET /projects/proj-1": () => ({ status: 200, body: p }),
    "PATCH /projects/proj-1": () => ({ status: 200, body: p }),
    ...routes,
  });
}

// 확인 모달은 제목의 부모 요소 - 모달 버튼 이름이 화면의 다른 버튼과 겹쳐서(삭제·초기화) 그 안에서 찾는다
const modalOf = (titleKey: string) => screen.getByText(t(titleKey)).parentElement!;

const statusButton = (status: Project["status"]) => screen.getByRole("button", { name: t(`enums:projectStatus.${status}`) });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProjectDetailPage 단수 카운터", () => {
  it.each([
    ["project:detail.rowIncreaseAria", 6],
    ["project:detail.rowDecreaseAria", 4],
  ])("%s 버튼은 현재 단수(5)에서 하나 바꿔 저장한다", async (ariaKey, expected) => {
    const api = mockProject(project());
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t(ariaKey) }));

    await waitFor(() => expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([{ currentRow: expected }]));
  });

  it("0단에서 줄여도 음수로 내려가지 않는다", async () => {
    const api = mockProject(project({ currentRow: 0 }));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("project:detail.rowDecreaseAria") }));

    await waitFor(() => expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([{ currentRow: 0 }]));
  });

  it("초기화는 확인을 받은 뒤 0단으로 저장하고 모달을 닫는다", async () => {
    const api = mockProject(project());
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("project:detail.reset") }));
    await userEvent.click(within(modalOf("project:detail.resetConfirmTitle")).getByRole("button", { name: t("project:detail.reset") }));

    await waitFor(() => expect(screen.queryByText(t("project:detail.resetConfirmTitle"))).not.toBeInTheDocument());
    expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([{ currentRow: 0 }]);
  });
});

describe("ProjectDetailPage 완료 처리", () => {
  it("확정 안 된 실이 있으면 예약량을 기본값으로 실사용량을 받아 함께 저장한다", async () => {
    const api = mockProject(project());
    renderPage();

    await screen.findByText("산네스");
    await userEvent.click(statusButton("COMPLETED"));
    const modal = modalOf("project:completeModal.title");
    const usedInput = within(modal).getByRole("spinbutton");
    expect(usedInput).toHaveValue(200);

    await userEvent.clear(usedInput);
    await userEvent.type(usedInput, "180");
    await userEvent.click(within(modal).getByRole("button", { name: t("project:completeModal.submit") }));

    await waitFor(() => expect(screen.queryByText(t("project:completeModal.title"))).not.toBeInTheDocument());
    expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([{ status: "COMPLETED", confirmUsages: [{ yarnId: "yarn-1", usedM: 180 }] }]);
  });

  it("완료 저장이 거부되면 모달을 그대로 두고 사유를 토스트로 보여준다", async () => {
    mockProject(project(), { "PATCH /projects/proj-1": () => ({ status: 400, body: { message: "사용량이 보유량보다 많아요" } }) });
    renderPage();

    await screen.findByText("산네스");
    await userEvent.click(statusButton("COMPLETED"));
    await userEvent.click(within(modalOf("project:completeModal.title")).getByRole("button", { name: t("project:completeModal.submit") }));

    expect(await screen.findByRole("alert")).toHaveTextContent("사용량이 보유량보다 많아요");
    expect(screen.getByText(t("project:completeModal.title"))).toBeInTheDocument();
  });

  it("확정할 실이 없으면 모달 없이 상태만 바꾼다", async () => {
    const api = mockProject(project({ yarnUsages: [usage(SANNES, 200, 190)] }));
    renderPage();

    await screen.findByText("산네스");
    await userEvent.click(statusButton("COMPLETED"));

    await waitFor(() => expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([{ status: "COMPLETED" }]));
    expect(screen.queryByText(t("project:completeModal.title"))).not.toBeInTheDocument();
  });

  it("완료가 아닌 상태로 바꿀 때는 확정을 묻지 않는다", async () => {
    const api = mockProject(project());
    renderPage();
    await screen.findByText("산네스");

    await userEvent.click(statusButton("ON_HOLD"));

    await waitFor(() => expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([{ status: "ON_HOLD" }]));
    expect(screen.queryByText(t("project:completeModal.title"))).not.toBeInTheDocument();
  });
});

describe("ProjectDetailPage 연결된 실", () => {
  it("이미 연결된 실은 후보에서 빼고, 고른 실을 연결한다", async () => {
    const candidates: PatternYarnMatch[] = [SANNES, yarn("yarn-2", "드롭스", 600, 600)].map((y) => ({
      yarn: y,
      ratioPercent: 100,
      label: "SUFFICIENT",
      gaugeChip: null,
      sizeCoverage: null,
      needsLotMixing: false,
    }));
    const api = mockProject(project(), {
      "GET /patterns/pat-1/yarn-matches": () => ({ status: 200, body: candidates }),
      "POST /projects/proj-1/yarns": () => ({ status: 201, body: {} }),
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("project:yarnList.linkAction") }));
    const dropsCandidate = await screen.findByText("드롭스");
    // 후보 목록이 열린 동안 산네스는 이미 연결된 행 하나로만 보인다 (고르면 목록이 닫히므로 그 전에 센다)
    expect(screen.getAllByText("산네스")).toHaveLength(1);

    await userEvent.click(dropsCandidate);
    await waitFor(() => expect(api.bodiesOf("POST /projects/proj-1/yarns")).toEqual([{ yarnId: "yarn-2" }]));
  });

  it("연결 해제는 해당 실의 연결을 지운다", async () => {
    const api = mockProject(project(), { "DELETE /projects/proj-1/yarns/yarn-1": () => ({ status: 200, body: { success: true } }) });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("project:yarnList.removeAria") }));

    await waitFor(() => expect(api.bodiesOf("DELETE /projects/proj-1/yarns/yarn-1")).toHaveLength(1));
  });

  it("예약량은 입력을 마치면 저장하고, 잘못된 값이면 원래 값으로 되돌린다", async () => {
    const api = mockProject(project(), { "PATCH /projects/proj-1/yarns/yarn-1": () => ({ status: 200, body: {} }) });
    renderPage();
    const reserved = await screen.findByRole("spinbutton");

    await userEvent.clear(reserved);
    await userEvent.type(reserved, "-5");
    await userEvent.tab();
    expect(reserved).toHaveValue(200);

    await userEvent.clear(reserved);
    await userEvent.type(reserved, "250");
    await userEvent.tab();

    await waitFor(() => expect(api.bodiesOf("PATCH /projects/proj-1/yarns/yarn-1")).toEqual([{ reservedM: 250 }]));
  });

  it("보유량보다 많이 예약돼 있으면 여유분과 함께 경고한다", async () => {
    // 다른 곳에서 실을 써서 가용량이 음수가 된 경우 - 이 프로젝트가 늘릴 수 있는 한도는 -50 + 200 = 150m
    mockProject(project({ yarnUsages: [usage(yarn("yarn-1", "산네스", 1000, -50), 200)] }));
    renderPage();

    expect(await screen.findByText(t("project:yarnList.overReserved", { ceiling: 150 }))).toBeInTheDocument();
  });
});

describe("ProjectDetailPage 메모·삭제", () => {
  it("메모는 바뀌었을 때만 입력을 마치면 저장한다", async () => {
    const api = mockProject(project({ memo: "소매 2cm 길게" }));
    renderPage();
    const memo = await screen.findByDisplayValue("소매 2cm 길게");

    await userEvent.click(memo);
    await userEvent.tab();
    expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([]);

    await userEvent.type(memo, ", 목둘레 줄임");
    await userEvent.tab();

    await waitFor(() => expect(api.bodiesOf("PATCH /projects/proj-1")).toEqual([{ memo: "소매 2cm 길게, 목둘레 줄임" }]));
  });

  it("삭제를 확인하면 프로젝트 목록으로 이동한다", async () => {
    mockProject(project(), { "DELETE /projects/proj-1": () => ({ status: 200, body: { success: true } }) });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: t("project:detail.deleteAria") }));
    await userEvent.click(within(modalOf("project:detail.deleteConfirmTitle")).getByRole("button", { name: t("common:action.delete") }));

    expect(await screen.findByText("프로젝트 목록")).toBeInTheDocument();
  });
});
