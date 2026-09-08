import type { PhotoInput } from "../types/api";
import i18n from "./i18n";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

// 기획서 2.8 - 클라이언트에서 Cloudinary로 직접 업로드(unsigned preset)하고 반환된 URL만 백엔드에 저장
export async function uploadPhoto(file: File): Promise<PhotoInput> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(i18n.t("common:error.cloudinaryNotConfigured"));
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(i18n.t("common:error.photoUploadFailed"));
  }
  const data = (await res.json()) as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}
