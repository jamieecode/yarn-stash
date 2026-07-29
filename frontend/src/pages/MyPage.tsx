import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const PROVIDER_LABEL: Record<string, string> = { KAKAO: "카카오", GOOGLE: "구글", GUEST: "게스트" };

// 화면설계서 8번(마이 탭)
export function MyPage() {
  const { user, isGuest, redirectToKakao, redirectToGoogle, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-text">마이</h1>

      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        {isGuest ? (
          <>
            <p className="text-sm font-semibold text-text">게스트로 이용 중</p>
            <p className="mt-1 text-xs text-muted">로그인하면 지금까지 등록한 실·찜 데이터가 그대로 이관돼요</p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={redirectToKakao}
                className="cursor-pointer rounded-xl border-none bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-[#3D3830]"
              >
                카카오로 로그인
              </button>
              <button
                onClick={redirectToGoogle}
                className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text"
              >
                구글로 로그인
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-text">{user?.nickname ?? "이름 없음"}</p>
            <p className="mt-1 text-xs text-muted">{user ? PROVIDER_LABEL[user.provider] : ""} 계정으로 로그인됨</p>
            <button
              onClick={handleLogout}
              className="mt-3 cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-danger"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </div>
  );
}
