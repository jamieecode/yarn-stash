import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { mockApi } from "../../test/mockApi";
import type { Yarn } from "../../types/api";
import { YarnEditPage } from "./YarnEditPage";

const t = (key: string) => i18n.t(key);

function YarnDetailStub() {
  const { id } = useParams();
  return <p>실 상세 {id}</p>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/yarns/yarn-1/edit"]}>
        <Routes>
          <Route path="/yarns/:id/edit" element={<YarnEditPage />} />
          <Route path="/yarns/:id" element={<YarnDetailStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// 선택 항목이 전부 채워진 실
const YARN: Yarn = {
  id: "yarn-1",
  userId: "u-1",
  catalogId: null,
  brand: "산네스",
  lineName: "턴디",
  colorName: "오프화이트",
  fiber: "울 100%",
  weightCategory: "DK",
  needleSize: "4mm",
  gaugeStitches: 22,
  memo: "스웨터용",
  consumed: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  batches: [],
  photos: [],
  totalM: 0,
  committedM: 0,
  availableM: 0,
  usages: [],
};

function mockYarn(yarn: Yarn) {
  return mockApi({
    "GET /yarns/yarn-1": () => ({ status: 200, body: yarn }),
    "PATCH /yarns/yarn-1": () => ({ status: 200, body: yarn }),
  });
}

// 라벨이 입력 요소와 연결돼 있지 않아서(htmlFor 없음) 라벨 바로 옆 입력 요소를 찾는다
function control(labelKey: string, selector = "input"): HTMLInputElement {
  return screen.getByText(t(labelKey)).parentElement!.querySelector(selector)!;
}

const saveButton = () => screen.getByRole("button", { name: t("yarn:edit.save") });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("YarnEditPage", () => {
  it("비운 선택 항목은 null로 보내 지우고, 상세로 이동한다", async () => {
    const api = mockYarn(YARN);
    renderPage();
    await screen.findByDisplayValue("산네스");

    await userEvent.clear(control("yarn:edit.lineNameLabel"));
    await userEvent.clear(control("yarn:edit.colorNameLabel"));
    await userEvent.clear(control("yarn:edit.fiberLabel"));
    await userEvent.selectOptions(control("yarn:edit.weightLabel", "select"), "");
    await userEvent.clear(control("yarn:edit.needleSizeLabel"));
    await userEvent.clear(control("yarn:edit.gaugeLabel"));
    await userEvent.clear(control("yarn:edit.memoLabel", "textarea"));
    await userEvent.click(saveButton());

    expect(await screen.findByText("실 상세 yarn-1")).toBeInTheDocument();
    expect(api.bodiesOf("PATCH /yarns/yarn-1")[0]).toMatchObject({
      brand: "산네스",
      lineName: null,
      colorName: null,
      fiber: null,
      weightCategory: null,
      needleSize: null,
      gaugeStitches: null,
      memo: null,
    });
  });

  it("손대지 않은 값은 그대로 보낸다", async () => {
    const api = mockYarn(YARN);
    renderPage();
    await screen.findByDisplayValue("산네스");

    await userEvent.click(saveButton());

    await screen.findByText("실 상세 yarn-1");
    expect(api.bodiesOf("PATCH /yarns/yarn-1")[0]).toMatchObject({
      lineName: "턴디",
      weightCategory: "DK",
      gaugeStitches: 22,
      memo: "스웨터용",
    });
  });
});
