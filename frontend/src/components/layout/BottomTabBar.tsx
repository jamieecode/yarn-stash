import { BookOpen, Home, ListChecks, Package, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TABS = [
  { to: "/home", labelKey: "tab.home", Icon: Home },
  { to: "/yarns", labelKey: "tab.yarn", Icon: Package },
  { to: "/patterns", labelKey: "tab.pattern", Icon: BookOpen },
  { to: "/projects", labelKey: "tab.project", Icon: ListChecks },
  { to: "/my", labelKey: "tab.my", Icon: User },
];

// 화면설계서 0-2 하단 탭바 - 목록형 화면에서만 표시(MainLayout에서만 렌더)
export function BottomTabBar() {
  const { t } = useTranslation("common");
  return (
    <div className="flex border-t border-border bg-card">
      {TABS.map(({ to, labelKey, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-[3px] border-none bg-transparent py-2.5 pb-3 ${
              isActive ? "text-accent" : "text-muted"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className={`text-[11px] ${isActive ? "font-semibold" : "font-normal"}`}>{t(labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
