import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
}

// 화면설계서 0-2 "등록/상세처럼 깊이 들어간 화면"에서 공통으로 쓰는 상단 바 - 뒤로가기 + 제목 + 우측 액션 슬롯
export function TopBar({ title, showBack = true, right }: TopBarProps) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between border-b border-border bg-bg px-3 py-3.5 sticky top-0 z-10">
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            aria-label={t("action.back")}
            className="flex cursor-pointer border-none bg-transparent p-0"
          >
            <ChevronLeft size={22} className="text-text" />
          </button>
        )}
      </div>
      <div className="text-[15px] font-semibold text-text">{title}</div>
      <div className="flex w-10 justify-end">{right}</div>
    </div>
  );
}
