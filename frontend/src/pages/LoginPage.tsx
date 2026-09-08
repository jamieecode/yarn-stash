import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

// 화면설계서 0-1(시작 화면) - 카카오/구글 로그인 또는 게스트 시작을 명시적으로 고르게 함
export function LoginPage() {
  const { t } = useTranslation("auth");
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
      setError(t("loginPage.guestError"));
    } finally {
      setIsStartingGuest(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">{t("loginPage.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("loginPage.subtitle")}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={redirectToKakao}
          className="cursor-pointer rounded-xl border-none bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#3D3830]"
        >
          {t("loginPage.loginKakao")}
        </button>
        <button
          onClick={redirectToGoogle}
          className="cursor-pointer rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-text"
        >
          {t("loginPage.loginGoogle")}
        </button>
        <button
          onClick={handleGuestStart}
          disabled={isStartingGuest}
          className="cursor-pointer rounded-xl border-none bg-transparent px-4 py-3 text-sm font-medium text-muted underline disabled:opacity-50"
        >
          {isStartingGuest ? t("loginPage.guestStarting") : t("loginPage.guestStart")}
        </button>
        {error && <p className="text-center text-xs text-danger">{error}</p>}
      </div>

      <p className="max-w-xs text-center text-xs text-muted">{t("loginPage.guestNote")}</p>
    </div>
  );
}
