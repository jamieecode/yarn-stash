import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { setLanguage } from "../lib/i18n";

// 화면설계서 8번(마이 탭)
export function MyPage() {
  const { t, i18n } = useTranslation("auth");
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
      <h1 className="text-lg font-bold text-text">{t("myPage.title")}</h1>

      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        {isGuest ? (
          <>
            <p className="text-sm font-semibold text-text">{t("myPage.guestUsing")}</p>
            <p className="mt-1 text-xs text-muted">{t("myPage.guestMergeNotice")}</p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={redirectToKakao}
                className="cursor-pointer rounded-xl border-none bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-[#3D3830]"
              >
                {t("myPage.loginKakao")}
              </button>
              <button
                onClick={redirectToGoogle}
                className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text"
              >
                {t("myPage.loginGoogle")}
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
                {t("myPage.nicknameSave")}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text"
              >
                {t("myPage.nicknameCancel")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text">{user?.nickname ?? t("myPage.nicknameEmpty")}</p>
              <button onClick={startEditing} className="cursor-pointer text-xs font-semibold text-accent">
                {t("myPage.nicknameEdit")}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              {user ? t("myPage.loggedInWith", { provider: t(`provider.${user.provider}`) }) : ""}
            </p>
            <button
              onClick={handleLogout}
              className="mt-3 cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-danger"
            >
              {t("myPage.logout")}
            </button>
          </>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted">{t("settings.title")}</p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setLanguage("ko")}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${
              i18n.language === "ko" ? "border-accent bg-accent text-white" : "border-border bg-card text-text"
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${
              i18n.language === "en" ? "border-accent bg-accent text-white" : "border-border bg-card text-text"
            }`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
