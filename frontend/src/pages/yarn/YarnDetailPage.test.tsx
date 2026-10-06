import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { ErrorToast } from "../../components/ui/ErrorToast";
import { mockApi } from "../../test/mockApi";
import type { Yarn } from "../../types/api";
import { YarnDetailPage } from "./YarnDetailPage";

const t = (key: string) => i18n.t(key);

const YARN: Yarn = {
  id: "yarn-1",
  userId: "u-1",
  catalogId: null,
  brand: "산네스",
  lineName: "턴디",
  colorName: null,
  fiber: null,
  weightCategory: null,
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
};

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={["/yarns/yarn-1"]}>
        <Routes>
          <Route path="/yarns/:id" element={<YarnDetailPage />} />
          <Route path="/yarns" element={<p>실 목록</p>} />
        </Routes>
      </MemoryRouter>
      <ErrorToast />
    </QueryClientProvider>,
  );
}

async function confirmDelete() {
  await userEvent.click(await screen.findByRole("button", { name: t("yarn:detail.deleteAria") }));
  // 상단 삭제 아이콘도 이름이 "삭제"라 확인 모달 안에서 찾는다
  const modal = screen.getByText(t("yarn:detail.deleteConfirmTitle")).parentElement!;
  await userEvent.click(within(modal).getByRole("button", { name: t("common:action.delete") }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// 저장/삭제 실패가 조용히 묻히지 않는지 - 화면 하나로 전역 오류 토스트 흐름을 끝까지 확인한다
describe("YarnDetailPage 삭제", () => {
  it("성공하면 실 목록으로 이동한다", async () => {
    mockApi({
      "GET /yarns/yarn-1": () => ({ status: 200, body: YARN }),
      "DELETE /yarns/yarn-1": () => ({ status: 200, body: { success: true } }),
    });
    renderPage();

    await confirmDelete();

    expect(await screen.findByText("실 목록")).toBeInTheDocument();
  });

  it("서버가 거부하면 사유를 토스트로 보여주고 화면에 남는다", async () => {
    mockApi({
      "GET /yarns/yarn-1": () => ({ status: 200, body: YARN }),
      "DELETE /yarns/yarn-1": () => ({ status: 403, body: { message: "진행 중인 프로젝트에서 쓰는 실이에요" } }),
    });
    renderPage();

    await confirmDelete();

    expect(await screen.findByRole("alert")).toHaveTextContent("진행 중인 프로젝트에서 쓰는 실이에요");
    expect(screen.queryByText("실 목록")).not.toBeInTheDocument();
  });

  it("서버에 닿지 못하면 네트워크 안내를 보여준다", async () => {
    const api = mockApi({ "GET /yarns/yarn-1": () => ({ status: 200, body: YARN }) });
    renderPage();
    await screen.findByRole("button", { name: t("yarn:detail.deleteAria") });
    api.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await confirmDelete();

    expect(await screen.findByRole("alert")).toHaveTextContent(t("common:error.network"));
  });
});
