import { requestJson } from "../../lib/http";

export interface MediaItem {
  key: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  originalName: string;
}

export interface MediaPage {
  items: MediaItem[];
  nextCursor: string | null;
}

export interface OrphanScan {
  scannedAt: string;
  totalObjects: number;
  referencedCount: number;
  postCount: number;
  orphanCount: number;
  orphanBytes: number;
  orphans: MediaItem[];
}

export async function fetchMedia(cursor?: string | null): Promise<MediaPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return requestJson<MediaPage>(`/api/media${query ? `?${query}` : ""}`);
}

export async function deleteMedia(key: string): Promise<void> {
  await requestJson(`/api/media?key=${encodeURIComponent(key)}`, { method: "DELETE" });
}

export async function scanOrphans(): Promise<OrphanScan> {
  return requestJson<OrphanScan>("/api/media/orphans");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatUploadedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function markdownImage(url: string, alt = ""): string {
  return `![${alt}](${url})`;
}
