import { compressImage, type CompressOptions } from "./image";
import { ApiError } from "./types";

export interface UploadResult {
  key: string;
  url: string;
  originalSize: number;
  finalSize: number;
  compressed: boolean;
  originalType: string;
  finalType: string;
}

export interface UploadHooks {
  onStage?: (stage: "compressing" | "uploading" | "done") => void;
  compress?: CompressOptions | false;
}

export async function uploadImage(
  file: File,
  hooks: UploadHooks = {},
): Promise<UploadResult> {
  hooks.onStage?.("compressing");

  const compression =
    hooks.compress === false
      ? null
      : await compressImage(file, hooks.compress ?? {});

  const finalFile = compression?.file ?? file;

  hooks.onStage?.("uploading");

  const formData = new FormData();
  formData.set("file", finalFile);

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

  hooks.onStage?.("done");

  return {
    key: payload.key,
    url: payload.url,
    originalSize: compression?.originalSize ?? file.size,
    finalSize: compression?.finalSize ?? finalFile.size,
    compressed: compression?.compressed ?? false,
    originalType: compression?.originalType ?? file.type,
    finalType: compression?.finalType ?? finalFile.type,
  };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
