import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { mockApi } from "../../test/mockApi";
import type { Pattern, PatternPage } from "../../types/api";
import { PatternListPage } from "./PatternListPage";

const t = (key: string) => i18n.t(key);

function LocationStub() {
  const { pathname, search } = useLocation();
  return <p>현재 위치 {pathname + search}</p>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/patterns"]}>
        <Routes>
          <Route path="/patterns" element={<PatternListPage />} />
          <Route path="*" element={<LocationStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function pattern(id: string, name: string): Pattern {
  return {
    id,
    createdByUserId: "u-1",
    name,
    designer: null,
    craftType: "KNITTING",
    weightCategory: "DK",
    requiredMinM: 300,
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
    isBookmarked: false,
  };
}

const page = (items: Pattern[], nextCursor: string | null = null) => ({ status: 200, body: { items, nextCursor } satisfies PatternPage });

// jsdom에는 IntersectionObserver가 없어서, 관찰 중인 센티널을 테스트가 직접 "화면에 들어온" 것으로 만든다
let observers: { callback: IntersectionObserverCallback; disconnected: boolean }[] = [];

class IntersectionObserverStub {
  private entry: (typeof observers)[number];
  constructor(callback: IntersectionObserverCallback) {
    this.entry = { callback, disconnected: false };
    observers.push(this.entry);
  }
  observe() {}
  disconnect() {
    this.entry.disconnected = true;
  }
}

const activeObservers = () => observers.filter((o) => !o.disconnected);

function scrollToSentinel() {
  act(() => {
    for (const o of activeObservers()) {
      o.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  });
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PatternListPage", () => {
  it("센티널이 보이면 다음 커서로 이어서 불러오고, 마지막 페이지 뒤로는 더 요청하지 않는다", async () => {
    const api = mockApi({
      "GET /patterns": (_, url) =>
        url.searchParams.get("cursor") === "c-2" ? page([pattern("p-3", "세 번째 도안")]) : page([pattern("p-1", "첫 도안"), pattern("p-2", "두 번째 도안")], "c-2"),
    });
    renderPage();

    expect(await screen.findByText("첫 도안")).toBeInTheDocument();
    expect(screen.queryByText("세 번째 도안")).not.toBeInTheDocument();

    scrollToSentinel();

    expect(await screen.findByText("세 번째 도안")).toBeInTheDocument();
    expect(screen.getByText("첫 도안")).toBeInTheDocument();
    expect(activeObservers()).toHaveLength(0);
    expect(api.fetch).toHaveBeenCalledTimes(2);
  });

  it("찜 필터와 뜨개 방법 필터를 쿼리로 보내고, 찜한 도안이 없으면 안내한다", async () => {
    const api = mockApi({
      "GET /patterns": (_, url) => (url.searchParams.get("bookmarked") === "true" ? page([]) : page([pattern("p-1", "첫 도안")])),
    });
    renderPage();
    await screen.findByText("첫 도안");

    await userEvent.click(screen.getByRole("button", { name: t("pattern:list.filterBookmarked") }));
    expect(await screen.findByText(t("pattern:list.emptyBookmarked"))).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: t("enums:craftType.CROCHET") }));

    // 두 필터를 함께 담은 요청이 나갈 때까지 기다린다 (찜 없음 안내는 클릭 전부터 떠 있어서 기다림의 기준이 못 된다)
    await waitFor(() => {
      const params = api.fetch.mock.calls.map(([input]) => new URL(String(input)).searchParams);
      expect(params.some((p) => p.get("bookmarked") === "true" && p.get("craftType") === "CROCHET")).toBe(true);
    });
  });

  it("등록된 도안이 없으면 기본 안내를 보여준다", async () => {
    mockApi({ "GET /patterns": () => page([]) });
    renderPage();

    expect(await screen.findByText(t("pattern:list.emptyDefault"))).toBeInTheDocument();
  });

  it("검색하면 내 DB 결과와 Ravelry 결과를 함께 보여주고, Ravelry 결과는 등록 폼으로 보낸다", async () => {
    mockApi({
      "GET /patterns": () => page([pattern("p-1", "첫 도안")], "c-2"),
      "GET /patterns/search": () => ({
        status: 200,
        body: {
          items: [
            { source: "LOCAL", ...pattern("p-9", "로컬 스웨터") },
            { source: "RAVELRY", ravelryId: 42, name: "Ravelry 스웨터", designer: "Jane" },
          ],
          ravelryUnavailable: false,
        },
      }),
    });
    renderPage();
    await screen.findByText("첫 도안");

    await userEvent.type(screen.getByPlaceholderText(t("pattern:list.searchPlaceholder")), "스웨터");

    expect(await screen.findByText("로컬 스웨터")).toBeInTheDocument();
    expect(screen.queryByText("첫 도안")).not.toBeInTheDocument();
    // 검색 중에는 목록 무한 스크롤을 멈춘다
    expect(activeObservers()).toHaveLength(0);

    await userEvent.click(screen.getByText("Ravelry 스웨터"));
    expect(await screen.findByText("현재 위치 /patterns/new?ravelryId=42")).toBeInTheDocument();
  });

  it("Ravelry 검색이 안 되면 내 DB 결과와 함께 안내를 띄운다", async () => {
    mockApi({
      "GET /patterns": () => page([]),
      "GET /patterns/search": () => ({ status: 200, body: { items: [{ source: "LOCAL", ...pattern("p-9", "로컬 스웨터") }], ravelryUnavailable: true } }),
    });
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(t("pattern:list.searchPlaceholder")), "스웨터");

    expect(await screen.findByText(t("common:ravelry.searchUnavailable"))).toBeInTheDocument();
    expect(screen.getByText("로컬 스웨터")).toBeInTheDocument();
  });
});
