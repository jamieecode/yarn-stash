import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { mockApi } from "../../test/mockApi";
import type { Pattern } from "../../types/api";
import { PatternEditPage } from "./PatternEditPage";

const t = (key: string) => i18n.t(key);

function PatternDetailStub() {
  const { id } = useParams();
  return <p>도안 상세 {id}</p>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/patterns/pat-1/edit"]}>
        <Routes>
          <Route path="/patterns/:id/edit" element={<PatternEditPage />} />
          <Route path="/patterns/:id" element={<PatternDetailStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// 원본 실이 카탈로그에 연결돼 있고 선택 항목이 전부 채워진 도안 (필요량은 백엔드처럼 m로 정규화된 값)
const PATTERN: Pattern = {
  id: "pat-1",
  createdByUserId: "u-1",
  name: "래글런 스웨터",
  designer: "작가",
  craftType: "KNITTING",
  weightCategory: "WORSTED",
  requiredMinM: 800,
  requiredMaxM: 1000,
  requiredUnit: "METRIC",
  gaugeStitches: 20,
  sourceUrl: "https://example.com/raglan",
  sourceType: "USER",
  ravelryId: null,
  thumbnailUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  originalYarnCatalogId: "cat-1",
  originalYarnBrand: "드롭스",
  originalYarnLine: "알파카",
};

function mockPattern(pattern: Pattern) {
  return mockApi({
    "GET /patterns/pat-1": () => ({ status: 200, body: pattern }),
    "PATCH /patterns/pat-1": () => ({ status: 200, body: pattern }),
    "GET /yarn-catalog/search": () => ({ status: 200, body: { items: [], ravelryUnavailable: false } }),
  });
}

// 라벨이 입력 요소와 연결돼 있지 않아서(htmlFor 없음) 라벨 바로 옆 input을 찾는다
function control(labelKey: string): HTMLInputElement {
  return screen.getByText(t(labelKey)).parentElement!.querySelector("input")!;
}

const saveButton = () => screen.getByRole("button", { name: t("pattern:edit.save") });
const minInput = () => screen.getByPlaceholderText(t("pattern:register.requiredMinPlaceholder"));
const maxInput = () => screen.getByPlaceholderText(t("pattern:register.requiredMaxPlaceholder"));
const yarnInput = () => screen.getByPlaceholderText(t("yarn:catalog.placeholder"));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PatternEditPage", () => {
  it("비운 선택 항목은 null로 보내 지우고, 상세로 이동한다", async () => {
    const api = mockPattern(PATTERN);
    renderPage();
    await screen.findByDisplayValue("래글런 스웨터");

    await userEvent.clear(control("pattern:register.designerLabel"));
    await userEvent.clear(maxInput());
    await userEvent.clear(control("pattern:register.gaugeLabel"));
    await userEvent.clear(control("pattern:register.sourceUrlLabel"));
    await userEvent.clear(yarnInput());
    await userEvent.click(saveButton());

    expect(await screen.findByText("도안 상세 pat-1")).toBeInTheDocument();
    expect(api.bodiesOf("PATCH /patterns/pat-1")[0]).toMatchObject({
      name: "래글런 스웨터",
      requiredMinM: 800,
      designer: null,
      requiredMaxM: null,
      gaugeStitches: null,
      sourceUrl: null,
      originalYarnCatalogId: null,
      originalYarnBrand: null,
      originalYarnLine: null,
    });
  });

  it("원본 실을 다른 이름으로 다시 입력하면 이전 카탈로그 연결과 라인명을 지운다", async () => {
    const api = mockPattern(PATTERN);
    renderPage();
    await screen.findByDisplayValue("드롭스 알파카");

    await userEvent.clear(yarnInput());
    await userEvent.type(yarnInput(), "산네스");
    await userEvent.click(saveButton());

    await screen.findByText("도안 상세 pat-1");
    expect(api.bodiesOf("PATCH /patterns/pat-1")[0]).toMatchObject({
      originalYarnCatalogId: null,
      originalYarnBrand: "산네스",
      originalYarnLine: null,
    });
  });

  it("yd로 등록한 도안은 필요량을 yd로 되돌려 보여줘서 그대로 저장해도 값이 바뀌지 않는다", async () => {
    // 1000yd / 1200yd를 백엔드가 m로 정규화한 값
    const api = mockPattern({ ...PATTERN, requiredUnit: "IMPERIAL", requiredMinM: 914.4, requiredMaxM: 1097.3 });
    renderPage();
    await screen.findByDisplayValue("래글런 스웨터");

    expect(minInput()).toHaveValue(1000);
    expect(maxInput()).toHaveValue(1200);

    await userEvent.click(saveButton());

    await screen.findByText("도안 상세 pat-1");
    expect(api.bodiesOf("PATCH /patterns/pat-1")[0]).toMatchObject({
      requiredMinM: 1000,
      requiredMaxM: 1200,
      requiredUnit: "IMPERIAL",
    });
  });
});
