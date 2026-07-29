interface ConfirmModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// 실/도안/프로젝트 삭제, 배치 삭제, 단수 리셋 등에서 공용으로 쓰는 확인 모달
export function ConfirmModal({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={onCancel}>
      <div
        className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && <p className="mt-2 text-xs text-muted">{description}</p>}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-text"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 cursor-pointer rounded-lg border-none py-2.5 text-sm font-semibold text-white ${
              danger ? "bg-danger" : "bg-accent"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
