import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const PROVIDER_LABEL: Record<string, string> = { KAKAO: "카카오", GOOGLE: "구글", GUEST: "게스트" };

// 화면설계서 8번(마이 탭)
export function MyPage() {
  const { user, isGuest, redirectToKakao, redirectToGoogle, updateNickname, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  function startEditing() {
    setNicknameInput(user?.nickname ?? "");
    setIsEditing(true);
  }

  async function handleSaveNickname() {
    const trimmed = nicknameInput.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await updateNickname(trimmed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
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
        ) : isEditing ? (
          <>
            <div className="flex gap-2">
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={30}
                autoFocus
                className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSaveNickname}
                disabled={isSaving || !nicknameInput.trim()}
                className="cursor-pointer rounded-xl border-none bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text"
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text">{user?.nickname ?? "이름 없음"}</p>
              <button onClick={startEditing} className="cursor-pointer text-xs font-semibold text-accent">
                수정
              </button>
            </div>
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
