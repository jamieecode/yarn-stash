import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

// 화면설계서 0-1 - 구글 인가 코드를 받아 백엔드 로그인을 완료하고 메인으로 이동
export function GoogleCallbackPage() {
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
      setError("구글 로그인에 실패했어요");
      return;
    }
    completeGoogleLogin(code)
      .then(() => navigate("/yarns", { replace: true }))
      .catch(() => setError("구글 로그인에 실패했어요"));
  }, [searchParams, completeGoogleLogin, navigate]);

  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-muted">
      {error ? error : "구글 로그인 처리 중이에요..."}
    </div>
  );
}
