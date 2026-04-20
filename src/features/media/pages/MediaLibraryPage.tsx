import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteMedia,
  fetchMedia,
  formatFileSize,
  formatUploadedAt,
  markdownImage,
  type MediaItem,
} from "../api";
import { uploadImage } from "../../../lib/upload";
import { OrphanScanner } from "../components/OrphanScanner";

export function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading">("idle");
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await fetchMedia();
      setItems(page.items);
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchMedia(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoadingMore(false);
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function copyToClipboard(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      window.prompt("复制以下内容", text);
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!window.confirm(`确认删除「${item.originalName}」吗？此操作不可恢复。`)) return;
    setDeletingKey(item.key);
    try {
      await deleteMedia(item.key);
      setItems((prev) => prev.filter((entry) => entry.key !== item.key));
      if (preview?.key === item.key) setPreview(null);
      showToast("已删除");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadStatus("uploading");
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        await uploadImage(file);
      }
      showToast("上传完成");
      await loadInitial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploadStatus("idle");
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1>图床</h1>
          <p>管理 R2 中的图片。上传、预览、复制链接、删除。</p>
        </div>
        <div className="row-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setScannerOpen(true)}
          >
            扫描孤儿
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadStatus === "uploading"}
          >
            {uploadStatus === "uploading" ? "上传中..." : "上传图片"}
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {toast ? <div className="alert info toast">{toast}</div> : null}

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">还没有图片，上传一张试试。</div>
      ) : (
        <>
          <div className="media-grid">
            {items.map((item) => (
              <MediaCard
                key={item.key}
                item={item}
                deleting={deletingKey === item.key}
                onPreview={() => setPreview(item)}
                onCopyUrl={() => copyToClipboard(item.url, "URL 已复制")}
                onCopyMarkdown={() =>
                  copyToClipboard(markdownImage(item.url, item.originalName), "Markdown 已复制")
                }
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>

          {hasMore ? (
            <div className="media-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
              >
                {loadingMore ? "加载中..." : "加载更多"}
              </button>
            </div>
          ) : null}
        </>
      )}

      {preview ? (
        <MediaPreview
          item={preview}
          onClose={() => setPreview(null)}
          onCopyUrl={() => copyToClipboard(preview.url, "URL 已复制")}
          onCopyMarkdown={() =>
            copyToClipboard(markdownImage(preview.url, preview.originalName), "Markdown 已复制")
          }
          onDelete={() => handleDelete(preview)}
          deleting={deletingKey === preview.key}
        />
      ) : null}

      {scannerOpen ? (
        <OrphanScanner
          onClose={() => setScannerOpen(false)}
          onAfterDelete={() => void loadInitial()}
        />
      ) : null}
    </section>
  );
}

interface MediaCardProps {
  item: MediaItem;
  deleting: boolean;
  onPreview: () => void;
  onCopyUrl: () => void;
  onCopyMarkdown: () => void;
  onDelete: () => void;
}

function MediaCard({
  item,
  deleting,
  onPreview,
  onCopyUrl,
  onCopyMarkdown,
  onDelete,
}: MediaCardProps) {
  return (
    <article className="media-card">
      <button type="button" className="media-thumb" onClick={onPreview} aria-label="预览">
        <img src={item.url} alt={item.originalName} loading="lazy" />
      </button>
      <div className="media-meta">
        <div className="media-name" title={item.originalName}>
          {item.originalName}
        </div>
        <div className="media-info">
          <span>{formatFileSize(item.size)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatUploadedAt(item.uploadedAt)}</span>
        </div>
      </div>
      <div className="media-actions">
        <button type="button" className="tb-btn" onClick={onCopyUrl} title="复制 URL">
          URL
        </button>
        <button type="button" className="tb-btn" onClick={onCopyMarkdown} title="复制 Markdown">
          MD
        </button>
        <button
          type="button"
          className="tb-btn danger"
          onClick={onDelete}
          disabled={deleting}
          title="删除"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>
    </article>
  );
}

interface MediaPreviewProps {
  item: MediaItem;
  onClose: () => void;
  onCopyUrl: () => void;
  onCopyMarkdown: () => void;
  onDelete: () => void;
  deleting: boolean;
}

function MediaPreview({
  item,
  onClose,
  onCopyUrl,
  onCopyMarkdown,
  onDelete,
  deleting,
}: MediaPreviewProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="media-modal" role="dialog" aria-modal="true">
      <div className="media-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="media-modal-body">
        <button type="button" className="media-modal-close" onClick={onClose} aria-label="关闭">
          ✕
        </button>
        <img className="media-modal-image" src={item.url} alt={item.originalName} />
        <div className="media-modal-info">
          <div className="media-modal-name">{item.originalName}</div>
          <div className="media-modal-meta">
            {formatFileSize(item.size)} · {item.contentType} · {formatUploadedAt(item.uploadedAt)}
          </div>
          <div className="media-modal-url">{item.url}</div>
          <div className="row-actions">
            <button type="button" className="secondary-button" onClick={onCopyUrl}>
              复制 URL
            </button>
            <button type="button" className="secondary-button" onClick={onCopyMarkdown}>
              复制 Markdown
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "删除"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
