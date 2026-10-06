import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "../lib/i18n";
import { dismissErrorToast, getErrorToast } from "../lib/errorToast";

// jsdom의 navigator.language(en-US)를 따라가지 않도록 기본 언어로 고정 - 기대 문구는 i18n.t로 만들어 번역이 바뀌어도 깨지지 않게 한다
await i18n.changeLanguage("ko");

afterEach(() => {
  cleanup();
  localStorage.clear();
  // 오류 토스트는 모듈 전역 상태라 테스트 사이에 남지 않게 비운다
  const toast = getErrorToast();
  if (toast) dismissErrorToast(toast.id);
});
