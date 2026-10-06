import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { showErrorToast } from "../../lib/errorToast";
import { ErrorToast } from "./ErrorToast";

afterEach(() => {
  vi.useRealTimers();
});

describe("ErrorToast", () => {
  it("오류가 없으면 아무것도 그리지 않는다", () => {
    render(<ErrorToast />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("오류를 띄우고 4초 뒤 사라진다", () => {
    vi.useFakeTimers();
    render(<ErrorToast />);

    act(() => showErrorToast("삭제할 수 없어요"));
    expect(screen.getByRole("alert")).toHaveTextContent("삭제할 수 없어요");

    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("새 오류가 오면 바로 교체하고 타이머를 다시 잰다", () => {
    vi.useFakeTimers();
    render(<ErrorToast />);

    act(() => showErrorToast("첫 번째"));
    act(() => vi.advanceTimersByTime(3000));
    act(() => showErrorToast("두 번째"));
    expect(screen.getByRole("alert")).toHaveTextContent("두 번째");

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("alert")).toHaveTextContent("두 번째");
  });
});
