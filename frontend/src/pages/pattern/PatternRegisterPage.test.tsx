import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../lib/i18n";
import { setToken } from "../../lib/apiClient";
import { createQueryClient } from "../../lib/queryClient";
import { AuthProvider } from "../../auth/AuthContext";
import { ErrorToast } from "../../components/ui/ErrorToast";
import { mockApi } from "../../test/mockApi";
import type { AuthProvider as Provider, YarnCatalog } from "../../types/api";
import { PatternRegisterPage } from "./PatternRegisterPage";

const t = (key: string) => i18n.t(key);

function PatternDetailStub() {
  const { id } = useParams();
  return <p>도안 상세 {id}</p>;
}

function renderPage(path = "/patterns/new") {
  // 도안 등록은 로그인 사용자만 가능해서 세션 토큰을 깔고 /auth/me 응답으로 게스트 여부를 정한다
  setToken("token");
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route path="/patterns/new" element={<PatternRegisterPage />} />
            <Route path="/patterns/:id" element={<PatternDetailStub />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
      <ErrorToast />
    </QueryClientProvider>,
  );
}

const me = (provider: Provider) => () => ({
  status: 200,
  body: { id: "u-1", provider, providerId: null, nickname: "뜨개인", createdAt: "2026-01-01T00:00:00.000Z" },
});
const created = () => ({ status: 201, body: { id: "pat-9" } });

// 라벨이 입력 요소와 연결돼 있지 않아서(htmlFor 없음) 라벨 바로 옆 input/select를 찾는다
function control(labelKey: string): HTMLInputElement | HTMLSelectElement {
  return screen.getByText(t(labelKey)).parentElement!.querySelector("input, select")!;
}

const submitButton = () => screen.getByRole("button", { name: t("pattern:register.submit") });
const minInput = () => screen.getByPlaceholderText(t("pattern:register.requiredMinPlaceholder"));
const maxInput = () => screen.getByPlaceholderText(t("pattern:register.requiredMaxPlaceholder"));
const searchInput = () => screen.getByPlaceholderText(t("pattern:searchAutocomplete.placeholder"));
const yarnInput = () => screen.getByPlaceholderText(t("yarn:catalog.placeholder"));

// 필수 항목(도안명·뜨개 방법·굵기·최소 필요량)만 채운다
async function fillRequired() {
  await userEvent.type(control("pattern:register.nameLabel"), "래글런 스웨터");
  await userEvent.selectOptions(control("pattern:register.craftTypeLabel"), "KNITTING");
  await userEvent.selectOptions(control("pattern:register.weightLabel"), "WORSTED");
  await userEvent.type(minInput(), "800");
}

const RAVELRY_RESULT = { source: "RAVELRY", ravelryId: 77, name: "Flax", designer: "Tin Can Knits" };
const RAVELRY_DETAIL = {
  ravelryId: 77,
  name: "Flax",
  designer: "Tin Can Knits",
  craftType: "KNITTING",
  weightCategory: "ARAN",
  requiredMinM: 600,
  requiredMaxM: 1200,
  gaugeStitches: 18,
  sourceUrl: "https://www.ravelry.com/patterns/library/flax",
};

const CATALOG: YarnCatalog = {
  id: "cat-1",
  createdByUserId: "u-1",
  brand: "드롭스",
  lineName: "알파카",
  fiber: null,
  weightCategory: "WORSTED",
  needleSize: null,
  gaugeStitches: null,
  sourceType: "USER",
  ravelryId: null,
  thumbnailUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PatternRegisterPage", () => {
  it("게스트에게는 폼 대신 로그인 안내를 보여준다", async () => {
    mockApi({ "GET /auth/me": me("GUEST") });
    renderPage();

    expect(await screen.findByText(t("pattern:register.guestNotice"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("pattern:register.submit") })).not.toBeInTheDocument();
  });

  it("필수 항목을 다 채우고 필요량이 올바라야 등록할 수 있다", async () => {
    mockApi({ "GET /auth/me": me("KAKAO") });
    renderPage();
    await screen.findByText(t("pattern:register.nameLabel"));

    expect(submitButton()).toBeDisabled();
    await fillRequired();
    expect(submitButton()).toBeEnabled();

    await userEvent.clear(minInput());
    await userEvent.type(minInput(), "0");
    expect(screen.getByText(t("pattern:register.requiredMinError"))).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    await userEvent.clear(minInput());
    await userEvent.type(minInput(), "800");
    await userEvent.type(maxInput(), "500");
    expect(screen.getByText(t("pattern:register.requiredMaxError"))).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    await userEvent.clear(maxInput());
    await userEvent.type(maxInput(), "800");
    expect(screen.queryByText(t("pattern:register.requiredMaxError"))).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("직접 입력한 도안은 USER로, yd를 고르면 IMPERIAL로 보내고 상세로 이동한다", async () => {
    const api = mockApi({ "GET /auth/me": me("KAKAO"), "POST /patterns": created });
    renderPage();
    await screen.findByText(t("pattern:register.nameLabel"));

    await fillRequired();
    await userEvent.click(screen.getByRole("button", { name: "yd" }));
    await userEvent.type(maxInput(), "1000");
    await userEvent.type(control("pattern:register.gaugeLabel"), "20");
    await userEvent.click(submitButton());

    expect(await screen.findByText("도안 상세 pat-9")).toBeInTheDocument();
    // 비워 둔 선택 항목은 JSON에서 빠진다(undefined)
    expect(api.bodiesOf("POST /patterns")).toEqual([
      {
        name: "래글런 스웨터",
        craftType: "KNITTING",
        weightCategory: "WORSTED",
        requiredMinM: 800,
        requiredMaxM: 1000,
        requiredUnit: "IMPERIAL",
        gaugeStitches: 20,
        sourceType: "USER",
      },
    ]);
  });

  it("참고 링크만 있으면 LINK로 보낸다", async () => {
    const api = mockApi({ "GET /auth/me": me("KAKAO"), "POST /patterns": created });
    renderPage();
    await screen.findByText(t("pattern:register.nameLabel"));

    await fillRequired();
    await userEvent.type(control("pattern:register.sourceUrlLabel"), "https://example.com/raglan");
    await userEvent.click(submitButton());

    await screen.findByText("도안 상세 pat-9");
    expect(api.bodiesOf("POST /patterns")[0]).toMatchObject({ sourceUrl: "https://example.com/raglan", sourceType: "LINK" });
  });

  it("내 DB 검색 결과를 고르면 새로 등록하지 않고 그 도안으로 이동한다", async () => {
    mockApi({
      "GET /auth/me": me("KAKAO"),
      "GET /patterns/search": () => ({
        status: 200,
        body: { items: [{ source: "LOCAL", id: "pat-1", name: "Flax", designer: "Tin Can Knits" }], ravelryUnavailable: false },
      }),
    });
    renderPage();

    await userEvent.type(searchInput(), "flax");
    await userEvent.click(await screen.findByRole("button", { name: /Flax/ }));

    expect(await screen.findByText("도안 상세 pat-1")).toBeInTheDocument();
  });

  it("Ravelry 검색 결과를 고르면 폼을 채우고 RAVELRY로 등록한다", async () => {
    const api = mockApi({
      "GET /auth/me": me("KAKAO"),
      "GET /patterns/search": () => ({ status: 200, body: { items: [RAVELRY_RESULT], ravelryUnavailable: false } }),
      "GET /patterns/ravelry/77": () => ({ status: 200, body: RAVELRY_DETAIL }),
      "POST /patterns": created,
    });
    renderPage();

    await userEvent.type(searchInput(), "flax");
    await userEvent.click(await screen.findByRole("button", { name: /Flax/ }));

    expect(await screen.findByText(t("pattern:register.autoFilledFromRavelry"))).toBeInTheDocument();
    expect(control("pattern:register.nameLabel")).toHaveValue("Flax");
    expect(control("pattern:register.designerLabel")).toHaveValue("Tin Can Knits");
    expect(control("pattern:register.weightLabel")).toHaveValue("ARAN");
    expect(minInput()).toHaveValue(600);
    expect(maxInput()).toHaveValue(1200);

    await userEvent.click(submitButton());
    await screen.findByText("도안 상세 pat-9");
    expect(api.bodiesOf("POST /patterns")[0]).toEqual({
      name: "Flax",
      designer: "Tin Can Knits",
      craftType: "KNITTING",
      weightCategory: "ARAN",
      requiredMinM: 600,
      requiredMaxM: 1200,
      requiredUnit: "METRIC",
      gaugeStitches: 18,
      sourceUrl: "https://www.ravelry.com/patterns/library/flax",
      sourceType: "RAVELRY",
      ravelryId: 77,
    });
  });

  it("Ravelry 상세 조회가 503이면 안내만 띄우고 직접 입력할 수 있게 둔다", async () => {
    mockApi({
      "GET /auth/me": me("KAKAO"),
      "GET /patterns/search": () => ({ status: 200, body: { items: [RAVELRY_RESULT], ravelryUnavailable: false } }),
      "GET /patterns/ravelry/77": () => ({ status: 503, body: { message: "Ravelry unavailable" } }),
    });
    renderPage();

    await userEvent.type(searchInput(), "flax");
    await userEvent.click(await screen.findByRole("button", { name: /Flax/ }));

    expect(await screen.findByText(t("common:ravelry.detailUnavailable"))).toBeInTheDocument();
    expect(control("pattern:register.nameLabel")).toHaveValue("");
    expect(screen.queryByText(t("pattern:register.autoFilledFromRavelry"))).not.toBeInTheDocument();
  });

  it("Ravelry 검색이 안 되면 검색 불가 안내를 띄운다", async () => {
    mockApi({
      "GET /auth/me": me("KAKAO"),
      "GET /patterns/search": () => ({ status: 200, body: { items: [], ravelryUnavailable: true } }),
    });
    renderPage();

    await userEvent.type(searchInput(), "flax");

    expect(await screen.findByText(t("common:ravelry.searchUnavailable"))).toBeInTheDocument();
  });

  it("?ravelryId로 들어오면 검색창 없이 바로 자동으로 채운다", async () => {
    mockApi({ "GET /auth/me": me("KAKAO"), "GET /patterns/ravelry/77": () => ({ status: 200, body: RAVELRY_DETAIL }) });
    renderPage("/patterns/new?ravelryId=77");

    expect(await screen.findByText(t("pattern:register.autoFilledFromRavelry"))).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(t("pattern:searchAutocomplete.placeholder"))).not.toBeInTheDocument();
    expect(control("pattern:register.nameLabel")).toHaveValue("Flax");
  });

  it("?ravelryId 자동 채움이 실패해도 안내만 띄우고 폼은 남긴다", async () => {
    mockApi({
      "GET /auth/me": me("KAKAO"),
      "GET /patterns/ravelry/77": () => ({ status: 503, body: { message: "Ravelry unavailable" } }),
    });
    renderPage("/patterns/new?ravelryId=77");

    // 5xx 조회는 한 번 재시도하므로(lib/queryClient.ts) 기본 대기시간보다 넉넉히 기다린다
    expect(await screen.findByText(t("common:ravelry.detailUnavailable"), undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(control("pattern:register.nameLabel")).toHaveValue("");
  });

  it("원본 실 카탈로그를 고르면 카탈로그 id와 브랜드·라인명을 함께 보낸다", async () => {
    const api = mockApi({
      "GET /auth/me": me("KAKAO"),
      "GET /yarn-catalog/search": () => ({ status: 200, body: { items: [{ source: "LOCAL", ...CATALOG }], ravelryUnavailable: false } }),
      "POST /patterns": created,
    });
    renderPage();
    await screen.findByText(t("pattern:register.nameLabel"));

    await fillRequired();
    await userEvent.type(yarnInput(), "드롭");
    await userEvent.click(await screen.findByRole("button", { name: /드롭스 알파카/ }));
    await userEvent.click(submitButton());

    await screen.findByText("도안 상세 pat-9");
    expect(api.bodiesOf("POST /patterns")[0]).toMatchObject({
      originalYarnCatalogId: "cat-1",
      originalYarnBrand: "드롭스",
      originalYarnLine: "알파카",
    });
  });

  it("원본 실을 고른 뒤 다시 고치면 카탈로그 연결과 라인명이 풀린다", async () => {
    const api = mockApi({
      "GET /auth/me": me("KAKAO"),
      "GET /yarn-catalog/search": () => ({ status: 200, body: { items: [{ source: "LOCAL", ...CATALOG }], ravelryUnavailable: false } }),
      "POST /patterns": created,
    });
    renderPage();
    await screen.findByText(t("pattern:register.nameLabel"));

    await fillRequired();
    await userEvent.type(yarnInput(), "드롭");
    await userEvent.click(await screen.findByRole("button", { name: /드롭스 알파카/ }));
    await userEvent.clear(yarnInput());
    await userEvent.type(yarnInput(), "산네스");
    await userEvent.click(submitButton());

    await screen.findByText("도안 상세 pat-9");
    const [body] = api.bodiesOf("POST /patterns") as Record<string, unknown>[];
    expect(body.originalYarnCatalogId).toBeUndefined();
    expect(body.originalYarnBrand).toBe("산네스");
    expect(body.originalYarnLine).toBeUndefined();
  });

  it("등록이 실패하면 서버 사유를 토스트로 보여주고 화면에 남는다", async () => {
    mockApi({
      "GET /auth/me": me("KAKAO"),
      "POST /patterns": () => ({ status: 400, body: { message: "필요량을 확인해 주세요" } }),
    });
    renderPage();
    await screen.findByText(t("pattern:register.nameLabel"));

    await fillRequired();
    await userEvent.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("필요량을 확인해 주세요");
    expect(submitButton()).toBeEnabled();
  });
});
