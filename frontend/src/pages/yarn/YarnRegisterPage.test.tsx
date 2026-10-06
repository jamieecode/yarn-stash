import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { createQueryClient } from "../../lib/queryClient";
import { ErrorToast } from "../../components/ui/ErrorToast";
import { mockApi } from "../../test/mockApi";
import type { YarnCatalog } from "../../types/api";
import { YarnRegisterPage } from "./YarnRegisterPage";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

function YarnDetailStub() {
  const { id } = useParams();
  return <p>상세 화면 {id}</p>;
}

function renderPage() {
  // 실제 앱과 같은 QueryClient(전역 오류 토스트 포함)로 렌더링
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/yarns/new"]}>
        <Routes>
          <Route path="/yarns/new" element={<YarnRegisterPage />} />
          <Route path="/yarns/:id" element={<YarnDetailStub />} />
        </Routes>
      </MemoryRouter>
      <ErrorToast />
    </QueryClientProvider>,
  );
}

// 라벨이 input과 연결돼 있지 않아서(htmlFor 없음) 라벨 바로 옆 input을 찾는다
function field(labelKey: string): HTMLInputElement {
  return screen.getByText(t(labelKey)).parentElement!.querySelector("input")!;
}

const brandInput = () => screen.getByPlaceholderText(t("yarn:catalog.placeholder"));
const submitButton = () => screen.getByRole("button", { name: t("yarn:register.submit") });
const skeinInputs = () => screen.getAllByPlaceholderText(t("yarn:register.skeinCountPlaceholder"));
const weightInputs = (unit = "g") => screen.getAllByPlaceholderText(t("yarn:register.weightPerSkeinPlaceholder", { unit }));
const lengthInputs = (unit = "m") => screen.getAllByPlaceholderText(t("yarn:register.lengthPerSkeinPlaceholder", { unit }));

async function fillBatch(index: number, values: { skeins: string; weight: string; length: string }, units = { w: "g", l: "m" }) {
  await userEvent.type(skeinInputs()[index], values.skeins);
  await userEvent.type(weightInputs(units.w)[index], values.weight);
  await userEvent.type(lengthInputs(units.l)[index], values.length);
}

const LOCAL_CATALOG: YarnCatalog = {
  id: "cat-1",
  createdByUserId: "u-1",
  brand: "드롭스",
  lineName: "알파카",
  fiber: "알파카 100%",
  weightCategory: "SPORT",
  needleSize: "3.5mm",
  gaugeStitches: 24,
  sourceType: "USER",
  ravelryId: null,
  thumbnailUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const noSearchResults = () => ({ status: 200, body: { items: [], ravelryUnavailable: false } });
const created = () => ({ status: 201, body: { id: "yarn-9" } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("YarnRegisterPage", () => {
  it("브랜드와 보유 기록을 채워야 등록할 수 있고, 잘못된 값이면 안내를 띄운다", async () => {
    mockApi({ "GET /yarn-catalog/search": noSearchResults });
    renderPage();

    expect(submitButton()).toBeDisabled();

    await userEvent.type(brandInput(), "산네스");
    expect(submitButton()).toBeDisabled();

    await fillBatch(0, { skeins: "0", weight: "50", length: "100" });
    expect(screen.getByText(t("yarn:register.batchValidationError"))).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    await userEvent.clear(skeinInputs()[0]);
    await userEvent.type(skeinInputs()[0], "2");
    expect(screen.queryByText(t("yarn:register.batchValidationError"))).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("입력한 값을 그대로 보내고 등록된 실 상세 화면으로 이동한다", async () => {
    const api = mockApi({ "GET /yarn-catalog/search": noSearchResults, "POST /yarns": created });
    renderPage();

    await userEvent.type(brandInput(), "산네스");
    await userEvent.type(field("yarn:register.colorNameLabel"), "크림");
    await userEvent.selectOptions(screen.getByRole("combobox"), "WORSTED");
    await userEvent.type(field("yarn:register.gaugeLabel"), "18");
    await fillBatch(0, { skeins: "3", weight: "50", length: "105" });
    await userEvent.click(submitButton());

    expect(await screen.findByText("상세 화면 yarn-9")).toBeInTheDocument();
    // 비워 둔 선택 항목은 JSON에서 빠진다(undefined)
    expect(api.bodiesOf("POST /yarns")).toEqual([
      {
        brand: "산네스",
        colorName: "크림",
        weightCategory: "WORSTED",
        gaugeStitches: 18,
        photos: [],
        batches: [{ skeinCount: 3, weightPerSkeinG: 50, lengthPerSkeinM: 105, inputUnit: "METRIC" }],
      },
    ]);
  });

  it("oz·yd로 바꾸면 입력값을 그대로 보내고 단위만 IMPERIAL로 표시한다 (환산은 백엔드 몫)", async () => {
    const api = mockApi({ "GET /yarn-catalog/search": noSearchResults, "POST /yarns": created });
    renderPage();

    await userEvent.type(brandInput(), "산네스");
    await userEvent.click(screen.getByRole("button", { name: t("yarn:register.unitImperial") }));
    await fillBatch(0, { skeins: "1", weight: "1.75", length: "220" }, { w: "oz", l: "yd" });
    await userEvent.click(submitButton());

    await screen.findByText("상세 화면 yarn-9");
    const [body] = api.bodiesOf("POST /yarns") as { batches: unknown[] }[];
    expect(body.batches).toEqual([{ skeinCount: 1, weightPerSkeinG: 1.75, lengthPerSkeinM: 220, inputUnit: "IMPERIAL" }]);
  });

  it("배치를 추가·제거할 수 있고, 모든 배치가 유효해야 등록된다", async () => {
    const api = mockApi({ "GET /yarn-catalog/search": noSearchResults, "POST /yarns": created });
    renderPage();

    await userEvent.type(brandInput(), "산네스");
    await fillBatch(0, { skeins: "2", weight: "50", length: "100" });
    // 배치가 하나일 때는 제거 버튼이 없다
    expect(screen.queryByRole("button", { name: t("yarn:register.removeBatch") })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: t("yarn:register.addBatch") }));
    expect(skeinInputs()).toHaveLength(2);
    expect(submitButton()).toBeDisabled();

    await userEvent.type(screen.getAllByPlaceholderText(t("yarn:register.dyeLotPlaceholder"))[1], "L-22");
    await fillBatch(1, { skeins: "1", weight: "50", length: "100" });
    expect(submitButton()).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: t("yarn:register.addBatch") }));
    await userEvent.click(screen.getAllByRole("button", { name: t("yarn:register.removeBatch") })[2]);
    expect(skeinInputs()).toHaveLength(2);

    await userEvent.click(submitButton());
    await screen.findByText("상세 화면 yarn-9");
    const [body] = api.bodiesOf("POST /yarns") as { batches: unknown[] }[];
    expect(body.batches).toEqual([
      { skeinCount: 2, weightPerSkeinG: 50, lengthPerSkeinM: 100, inputUnit: "METRIC" },
      { dyeLot: "L-22", skeinCount: 1, weightPerSkeinG: 50, lengthPerSkeinM: 100, inputUnit: "METRIC" },
    ]);
  });

  it("내 DB 카탈로그를 고르면 스펙을 자동으로 채우고 catalogId를 함께 보낸다", async () => {
    const api = mockApi({
      "GET /yarn-catalog/search": () => ({ status: 200, body: { items: [{ source: "LOCAL", ...LOCAL_CATALOG }], ravelryUnavailable: false } }),
      "POST /yarns": created,
    });
    renderPage();

    await userEvent.type(brandInput(), "드롭");
    await userEvent.click(await screen.findByRole("button", { name: /드롭스 알파카/ }));

    expect(screen.getByText(t("yarn:register.autoFilledFrom", { source: "드롭스 알파카" }))).toBeInTheDocument();
    expect(field("yarn:register.lineNameLabel")).toHaveValue("알파카");
    expect(field("yarn:register.fiberLabel")).toHaveValue("알파카 100%");
    expect(field("yarn:register.needleSizeLabel")).toHaveValue("3.5mm");
    expect(field("yarn:register.gaugeLabel")).toHaveValue(24);
    expect(screen.getByRole("combobox")).toHaveValue("SPORT");

    await fillBatch(0, { skeins: "4", weight: "50", length: "150" });
    await userEvent.click(submitButton());

    await screen.findByText("상세 화면 yarn-9");
    expect(api.bodiesOf("POST /yarns")[0]).toMatchObject({
      catalogId: "cat-1",
      brand: "드롭스",
      lineName: "알파카",
      fiber: "알파카 100%",
      weightCategory: "SPORT",
      needleSize: "3.5mm",
      gaugeStitches: 24,
    });
  });

  it("카탈로그를 고른 뒤 브랜드를 다시 고치면 카탈로그 연결이 풀린다", async () => {
    const api = mockApi({
      "GET /yarn-catalog/search": () => ({ status: 200, body: { items: [{ source: "LOCAL", ...LOCAL_CATALOG }], ravelryUnavailable: false } }),
      "POST /yarns": created,
    });
    renderPage();

    await userEvent.type(brandInput(), "드롭");
    await userEvent.click(await screen.findByRole("button", { name: /드롭스 알파카/ }));
    await userEvent.type(brandInput(), "2");

    expect(screen.queryByText(t("yarn:register.autoFilledFrom", { source: "드롭스 알파카" }))).not.toBeInTheDocument();

    await fillBatch(0, { skeins: "1", weight: "50", length: "150" });
    await userEvent.click(submitButton());
    await screen.findByText("상세 화면 yarn-9");
    const [body] = api.bodiesOf("POST /yarns") as Record<string, unknown>[];
    expect(body.catalogId).toBeUndefined();
    expect(body.brand).toBe("드롭스 알파카2");
  });

  it("Ravelry 결과를 고르면 카탈로그로 확정한 뒤 자동으로 채운다", async () => {
    const api = mockApi({
      "GET /yarn-catalog/search": () => ({
        status: 200,
        body: { items: [{ source: "RAVELRY", ravelryId: 123, brand: "Malabrigo", lineName: "Rios" }], ravelryUnavailable: false },
      }),
      "POST /yarn-catalog/ravelry/123": () => ({
        status: 201,
        body: { ...LOCAL_CATALOG, id: "cat-rav", brand: "Malabrigo", lineName: "Rios", weightCategory: "WORSTED", sourceType: "RAVELRY", ravelryId: 123 },
      }),
    });
    renderPage();

    await userEvent.type(brandInput(), "mala");
    await userEvent.click(await screen.findByRole("button", { name: /Malabrigo Rios/ }));

    expect(await screen.findByText(t("yarn:register.autoFilledFrom", { source: "Malabrigo Rios" }))).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("WORSTED");
    expect(api.bodiesOf("POST /yarn-catalog/ravelry/123")).toHaveLength(1);
  });

  it("Ravelry 상세 조회가 503이면 장애 안내를 띄우고 자동 채움은 하지 않는다", async () => {
    mockApi({
      "GET /yarn-catalog/search": () => ({
        status: 200,
        body: { items: [{ source: "RAVELRY", ravelryId: 123, brand: "Malabrigo", lineName: "Rios" }], ravelryUnavailable: false },
      }),
      "POST /yarn-catalog/ravelry/123": () => ({ status: 503, body: { message: "Ravelry unavailable" } }),
    });
    renderPage();

    await userEvent.type(brandInput(), "mala");
    await userEvent.click(await screen.findByRole("button", { name: /Malabrigo Rios/ }));

    expect(await screen.findByText(t("common:ravelry.detailUnavailable"))).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(field("yarn:register.lineNameLabel")).toHaveValue("");
  });

  it("Ravelry 검색이 안 되면 검색 불가 안내를 띄운다", async () => {
    mockApi({ "GET /yarn-catalog/search": () => ({ status: 200, body: { items: [], ravelryUnavailable: true } }) });
    renderPage();

    await userEvent.type(brandInput(), "mala");

    expect(await screen.findByText(t("common:ravelry.searchUnavailable"))).toBeInTheDocument();
  });

  it("등록이 실패하면 오류 문구를 보여주고 화면에 남는다", async () => {
    mockApi({
      "GET /yarn-catalog/search": noSearchResults,
      "POST /yarns": () => ({ status: 500, body: { message: "Internal server error" } }),
    });
    renderPage();

    await userEvent.type(brandInput(), "산네스");
    await fillBatch(0, { skeins: "1", weight: "50", length: "100" });
    await userEvent.click(submitButton());

    expect(await screen.findByText(t("yarn:register.submitError"))).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
    // 화면이 직접 문구를 보여주므로 전역 토스트는 띄우지 않는다
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
