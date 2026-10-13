import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { mockApi } from "../../test/mockApi";
import type { Yarn, YarnBatch } from "../../types/api";
import { YarnListPage } from "./YarnListPage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function LocationStub() {
  const { pathname } = useLocation();
  return <p>현재 위치 {pathname}</p>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/yarns"]}>
        <Routes>
          <Route path="/yarns" element={<YarnListPage />} />
          <Route path="*" element={<LocationStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function batch(id: string, dyeLot: string | null, skeinCount: number): YarnBatch {
  return {
    id,
    yarnId: "yarn-1",
    dyeLot,
    skeinCount,
    weightPerSkeinG: 50,
    lengthPerSkeinM: 100,
    inputUnit: "METRIC",
    purchasedAt: null,
  } as YarnBatch;
}

function yarn(id: string, brand: string, overrides: Partial<Yarn> = {}): Yarn {
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
    totalM: 0,
    committedM: 0,
    availableM: 0,
    usages: [],
    ...overrides,
  };
}

const list = (yarns: Yarn[]) => ({ status: 200, body: yarns });

describe("YarnListPage", () => {
  it("처음에는 최근 등록순·소진 제외로 불러오고, 카드를 누르면 실 상세로 간다", async () => {
    const api = mockApi({ "GET /yarns": () => list([yarn("yarn-1", "산네스")]) });
    renderPage();

    await userEvent.click(await screen.findByText("산네스"));

    expect(await screen.findByText("현재 위치 /yarns/yarn-1")).toBeInTheDocument();
    const params = new URL(String(api.fetch.mock.calls[0][0])).searchParams;
    expect(Object.fromEntries(params)).toEqual({ sort: "RECENT", includeConsumed: "false" });
  });

  it("굵기·검색어·정렬·소진됨 보기를 모두 쿼리로 보낸다", async () => {
    const api = mockApi({ "GET /yarns": () => list([yarn("yarn-1", "산네스")]) });
    renderPage();
    await screen.findByText("산네스");

    await userEvent.click(screen.getByRole("button", { name: t("enums:weightCategory.WORSTED") }));
    await userEvent.type(screen.getByPlaceholderText(t("yarn:list.searchPlaceholder")), "턴디");
    await userEvent.click(screen.getByRole("button", { name: t("yarn:list.sortName") }));
    await userEvent.click(screen.getByRole("checkbox", { name: t("yarn:list.showConsumed") }));

    await waitFor(() => {
      const params = api.fetch.mock.calls.map(([input]) => Object.fromEntries(new URL(String(input)).searchParams));
      expect(params).toContainEqual({ q: "턴디", weightCategory: "WORSTED", sort: "NAME", includeConsumed: "true" });
    });
  });

  it("실이 하나도 없으면 등록 버튼과 함께 첫 등록을 안내한다", async () => {
    mockApi({ "GET /yarns": () => list([]) });
    renderPage();

    expect(await screen.findByText(t("yarn:list.emptyDefault"))).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: t("yarn:list.emptyCta") }));
    expect(await screen.findByText("현재 위치 /yarns/new")).toBeInTheDocument();
  });

  it("필터에 맞는 실이 없으면 등록 버튼 없이 결과 없음만 안내한다", async () => {
    mockApi({
      "GET /yarns": (_, url) => (url.searchParams.get("weightCategory") ? list([]) : list([yarn("yarn-1", "산네스")])),
    });
    renderPage();
    await screen.findByText("산네스");

    await userEvent.click(screen.getByRole("button", { name: t("enums:weightCategory.LACE") }));

    expect(await screen.findByText(t("yarn:list.emptyFiltered"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("yarn:list.emptyCta") })).not.toBeInTheDocument();
  });

  it("목록을 못 불러오면 오류를 안내한다", async () => {
    // 4xx는 재시도하지 않아 바로 오류 상태가 된다 (lib/queryClient.ts)
    mockApi({ "GET /yarns": () => ({ status: 429, body: { message: "too many" } }) });
    renderPage();

    expect(await screen.findByText(t("yarn:list.loadError"))).toBeInTheDocument();
  });

  it("프로젝트에 묶인 양이 있으면 카드에 남은 양과 사용 중인 양을, 없으면 총량을 보여준다", async () => {
    mockApi({
      "GET /yarns": () =>
        list([
          yarn("yarn-1", "산네스", {
            batches: [batch("b-1", "A1", 2), batch("b-2", "B2", 1)],
            totalM: 300,
            committedM: 120,
            availableM: 180,
          }),
          yarn("yarn-2", "드롭스", { batches: [batch("b-3", null, 4)], totalM: 400, availableM: 400, consumed: true }),
        ]),
    });
    renderPage();

    const committed = (await screen.findByText("산네스")).closest("button")!;
    expect(committed).toHaveTextContent(t("yarn:card.availableMeters", { meters: 180 }));
    expect(committed).toHaveTextContent(t("yarn:card.committedNote", { meters: 120 }));
    expect(committed).toHaveTextContent(t("yarn:card.skeinCount", { count: 3 }));
    expect(committed).toHaveTextContent(t("yarn:card.lotCount", { count: 2 }));

    const consumed = screen.getByText("드롭스").closest("button")!;
    expect(consumed).toHaveTextContent(t("yarn:card.totalMeters", { meters: 400 }));
    expect(consumed).toHaveTextContent(t("yarn:card.consumed"));
    expect(consumed).not.toHaveTextContent(t("yarn:card.lotCount", { count: 1 }));
  });
});
