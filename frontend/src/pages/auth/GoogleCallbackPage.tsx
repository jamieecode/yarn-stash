import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";

// 화면설계서 0-1 - 구글 인가 코드를 받아 백엔드 로그인을 완료하고 메인으로 이동
export function GoogleCallbackPage() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const { completeGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const code = searchParams.get("code");
    if (!code) {
      setError(t("googleCallback.failed"));
      return;
    }
    completeGoogleLogin(code)
      .then(() => navigate("/home", { replace: true }))
      .catch(() => setError(t("googleCallback.failed")));
  }, [searchParams, completeGoogleLogin, navigate, t]);

  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-muted">
      {error ? error : t("googleCallback.processing")}
    </div>
  );
}
