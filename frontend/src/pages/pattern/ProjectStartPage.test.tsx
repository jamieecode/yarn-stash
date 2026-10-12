import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { ErrorToast } from "../../components/ui/ErrorToast";
import { mockApi } from "../../test/mockApi";
import type { Pattern, PatternYarnMatch, Yarn } from "../../types/api";
import { ProjectStartPage } from "./ProjectStartPage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function ProjectDetailStub() {
  const { id } = useParams();
  return <p>프로젝트 상세 {id}</p>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/patterns/pat-1/start-project"]}>
        <Routes>
          <Route path="/patterns/:id/start-project" element={<ProjectStartPage />} />
          <Route path="/projects/:id" element={<ProjectDetailStub />} />
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
  requiredMaxM: 1200,
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

function match(y: Yarn): PatternYarnMatch {
  return { yarn: y, ratioPercent: 100, label: "SUFFICIENT", gaugeChip: null, sizeCoverage: null, needsLotMixing: false };
}

// 다른 프로젝트가 일부를 잡고 있는 실과 통째로 쓸 수 있는 실
const MATCHES = [match(yarn("yarn-1", "산네스", 1500, 300)), match(yarn("yarn-2", "드롭스", 1000, 0))];

function mockStart(start: () => { status: number; body?: unknown } = () => ({ status: 201, body: { id: "proj-1" } })) {
  return mockApi({
    "GET /patterns/pat-1": () => ({ status: 200, body: PATTERN }),
    "GET /patterns/pat-1/yarn-matches": () => ({ status: 200, body: MATCHES }),
    "POST /projects": start,
  });
}

const startButton = () => screen.getByRole("button", { name: t("pattern:projectStart.start") });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProjectStartPage", () => {
  it("다른 프로젝트가 잡고 있는 실은 보유량 대비 쓸 수 있는 양을 보여준다", async () => {
    mockStart();
    renderPage();

    expect(await screen.findByText(t("pattern:projectStart.availableOfTotal", { available: 1200, total: 1500 }))).toBeInTheDocument();
    expect(screen.getByText(t("pattern:projectStart.available", { available: 1000 }))).toBeInTheDocument();
    expect(screen.getByText(t("pattern:projectStart.requiredRange", { min: 800, max: 1200 }))).toBeInTheDocument();
  });

  it("실을 고르지 않으면 실 없이 시작하고 만든 프로젝트로 이동한다", async () => {
    const api = mockStart();
    renderPage();
    await screen.findByText("산네스");

    await userEvent.click(startButton());

    expect(await screen.findByText("프로젝트 상세 proj-1")).toBeInTheDocument();
    expect(api.bodiesOf("POST /projects")).toEqual([{ patternId: "pat-1" }]);
  });

  it("고른 실을 함께 보내 시작한다", async () => {
    const api = mockStart();
    renderPage();

    await userEvent.click(await screen.findByText("드롭스"));
    await userEvent.click(startButton());

    await screen.findByText("프로젝트 상세 proj-1");
    expect(api.bodiesOf("POST /projects")).toEqual([{ patternId: "pat-1", yarnId: "yarn-2" }]);
  });

  it("나중에 연결을 다시 고르면 실 선택을 취소한다", async () => {
    const api = mockStart();
    renderPage();

    await userEvent.click(await screen.findByText("드롭스"));
    await userEvent.click(screen.getByRole("button", { name: t("pattern:projectStart.laterOption") }));
    await userEvent.click(startButton());

    await screen.findByText("프로젝트 상세 proj-1");
    expect(api.bodiesOf("POST /projects")).toEqual([{ patternId: "pat-1" }]);
  });

  it("시작이 거부되면 사유를 토스트로 보여주고 화면에 남는다", async () => {
    mockStart(() => ({ status: 400, body: { message: "이미 다 쓴 실이에요" } }));
    renderPage();
    await screen.findByText("산네스");

    await userEvent.click(startButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("이미 다 쓴 실이에요");
    expect(screen.queryByText(/프로젝트 상세/)).not.toBeInTheDocument();
  });
});
