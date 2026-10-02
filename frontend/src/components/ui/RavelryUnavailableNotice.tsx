import { useTranslation } from "react-i18next";

// 검색 응답의 ravelryUnavailable이 true일 때 - 결과가 적은 게 "없어서"가 아니라 Ravelry가 안 돼서일 수 있음을 알린다
export function RavelryUnavailableNotice({ className = "" }: { className?: string }) {
  const { t } = useTranslation("common");
  return <p className={`rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn ${className}`}>{t("ravelry.searchUnavailable")}</p>;
}
