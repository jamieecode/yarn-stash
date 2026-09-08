import { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { uploadPhoto } from "../../lib/cloudinary";
import type { PhotoInput } from "../../types/api";

interface PhotoUploaderProps {
  photos: PhotoInput[];
  onChange: (photos: PhotoInput[]) => void;
}

// 실 사진/프로젝트 진행 사진 공용 - 선택 즉시 Cloudinary unsigned upload로 직접 업로드 (기획서 2.8)
export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const { t } = useTranslation("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadPhoto));
      onChange([...photos, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.photoUploadFailed"));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <div key={photo.url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 text-white"
              aria-label={t("photoUploader.deletePhoto")}
              type="button"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card text-muted disabled:opacity-50"
        >
          <ImageIcon size={18} />
          <span className="text-[11px]">{isUploading ? t("photoUploader.uploading") : t("photoUploader.addPhoto")}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
