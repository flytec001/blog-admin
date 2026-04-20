import { ApiError } from "./types";

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    url?: string;
    key?: string;
    error?: string;
  };

  if (!response.ok || !payload.url || !payload.key) {
    throw new ApiError(response.status, payload.error ?? "上传失败");
  }

  return { key: payload.key, url: payload.url };
}
