import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import i18n from "../lib/i18n";
import { ErrorBoundary } from "./ErrorBoundary";

let shouldThrow = true;

function Flaky() {
  if (shouldThrow) throw new Error("boom");
  return <p>정상 화면</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Link to="/other">다른 화면</Link>
      <ErrorBoundary>
        <Routes>
          <Route path="/broken" element={<Flaky />} />
          <Route path="/other" element={<p>다른 화면 내용</p>} />
        </Routes>
      </ErrorBoundary>
    </MemoryRouter>,
  );
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    shouldThrow = true;
    // React와 componentDidCatch가 남기는 에러 로그로 테스트 출력이 지저분해지지 않게
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("렌더링 중 예외가 나면 빈 화면 대신 안내를 보여준다", () => {
    renderAt("/broken");
    expect(screen.getByText(i18n.t("common:errorBoundary.title"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: i18n.t("common:errorBoundary.goHome") })).toHaveAttribute("href", "/home");
  });

  it("다시 시도하면 하위 트리를 다시 렌더링한다", async () => {
    renderAt("/broken");
    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: i18n.t("common:errorBoundary.retry") }));
    expect(screen.getByText("정상 화면")).toBeInTheDocument();
  });

  it("경로가 바뀌면 에러 상태가 풀린다", async () => {
    renderAt("/broken");
    await userEvent.click(screen.getByText("다른 화면"));
    expect(screen.getByText("다른 화면 내용")).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("common:errorBoundary.title"))).not.toBeInTheDocument();
  });
});
