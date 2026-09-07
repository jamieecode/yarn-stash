import { BookOpen, Home, ListChecks, Package, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/home", label: "홈", Icon: Home },
  { to: "/yarns", label: "실", Icon: Package },
  { to: "/patterns", label: "도안", Icon: BookOpen },
  { to: "/projects", label: "프로젝트", Icon: ListChecks },
  { to: "/my", label: "마이", Icon: User },
];

// 화면설계서 0-2 하단 탭바 - 목록형 화면에서만 표시(MainLayout에서만 렌더)
export function BottomTabBar() {
  return (
    <div className="flex border-t border-border bg-card">
      {TABS.map(({ to, label, Icon }) => (
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
              <span className={`text-[11px] ${isActive ? "font-semibold" : "font-normal"}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
