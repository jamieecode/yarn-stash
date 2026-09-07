import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// 화면설계서 0-1(시작 화면) - 카카오/구글 로그인 또는 게스트 시작을 명시적으로 고르게 함
export function LoginPage() {
  const { loginAsGuest, redirectToKakao, redirectToGoogle } = useAuth();
  const navigate = useNavigate();
  const [isStartingGuest, setIsStartingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuestStart() {
    setError(null);
    setIsStartingGuest(true);
    try {
      await loginAsGuest();
      navigate("/home", { replace: true });
    } catch {
      setError("게스트로 시작하지 못했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setIsStartingGuest(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">실 스태시 트래커</h1>
        <p className="mt-2 text-sm text-muted">가진 실로 뜰 수 있는 도안을 찾아드려요</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={redirectToKakao}
          className="cursor-pointer rounded-xl border-none bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#3D3830]"
        >
          카카오로 로그인
        </button>
        <button
          onClick={redirectToGoogle}
          className="cursor-pointer rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-text"
        >
          구글로 로그인
        </button>
        <button
          onClick={handleGuestStart}
          disabled={isStartingGuest}
          className="cursor-pointer rounded-xl border-none bg-transparent px-4 py-3 text-sm font-medium text-muted underline disabled:opacity-50"
        >
          {isStartingGuest ? "시작하는 중..." : "게스트로 시작하기"}
        </button>
        {error && <p className="text-center text-xs text-danger">{error}</p>}
      </div>

      <p className="max-w-xs text-center text-xs text-muted">
        게스트로 시작해도 나중에 마이 탭에서 언제든 로그인할 수 있어요
      </p>
    </div>
  );
}
