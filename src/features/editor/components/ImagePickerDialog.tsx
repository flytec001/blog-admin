import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchMedia, type MediaItem } from "../../media/api";
import { uploadImage } from "../../../lib/upload";

export interface PickedImage {
  src: string;
  alt: string | null;
}

interface ImagePickerDialogProps {
  title: string;
  description?: string;
  minCount?: number;
  maxCount?: number;
  initialSelection?: PickedImage[];
  onClose: () => void;
  onConfirm: (items: PickedImage[]) => void;
}

export function ImagePickerDialog({
  title,
  description,
  minCount = 1,
  maxCount = 20,
  initialSelection = [],
  onClose,
  onConfirm,
}: ImagePickerDialogProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<PickedImage[]>(initialSelection);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoadingInitial(true);
    setError("");
    try {
      const page = await fetchMedia();
      setItems(page.items);
      setCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchMedia(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: PickedImage[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const result = await uploadImage(file);
        uploaded.push({ src: result.url, alt: file.name });
      }
      setSelection((prev) => mergeSelection(prev, uploaded, maxCount));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function toggleSelect(media: MediaItem) {
    const already = selection.findIndex((item) => item.src === media.url);
    if (already >= 0) {
      setSelection((prev) => prev.filter((_, index) => index !== already));
      return;
    }
    if (selection.length >= maxCount) {
      setError(`最多选择 ${maxCount} 张`);
      return;
    }
    setSelection((prev) => [
      ...prev,
      { src: media.url, alt: media.originalName ?? null },
    ]);
  }

  function orderOf(media: MediaItem): number {
    return selection.findIndex((item) => item.src === media.url);
  }

  const canConfirm = useMemo(
    () => selection.length >= minCount && selection.length <= maxCount,
    [selection.length, minCount, maxCount],
  );

  return (
    <div className="media-modal" role="dialog" aria-modal="true">
      <div className="media-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="picker-modal-body">
        <header className="orphan-header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            type="button"
            className="media-modal-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </header>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="picker-toolbar">
          <button
            type="button"
            className="secondary-button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "上传中..." : "上传新图"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              void handleUpload(event.target.files);
              event.target.value = "";
            }}
          />
          <span className="picker-count">
            已选 {selection.length}
            {maxCount < 100 ? `/${maxCount}` : ""}
          </span>
          <button
            type="button"
            className="primary-button"
            disabled={!canConfirm}
            onClick={() => onConfirm(selection)}
          >
            插入
          </button>
        </div>

        {loadingInitial ? (
          <div className="empty-state">加载图床中...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">图床还没有图片，先上传一张。</div>
        ) : (
          <div className="picker-grid">
            {items.map((media) => {
              const order = orderOf(media);
              const isSelected = order >= 0;
              return (
                <button
                  type="button"
                  key={media.key}
                  className={isSelected ? "picker-item selected" : "picker-item"}
                  onClick={() => toggleSelect(media)}
                >
                  <img src={media.url} alt={media.originalName} loading="lazy" />
                  {isSelected ? <span className="picker-badge">{order + 1}</span> : null}
                </button>
              );
            })}
          </div>
        )}

        {cursor ? (
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
      </div>
    </div>
  );
}

function mergeSelection(
  current: PickedImage[],
  additions: PickedImage[],
  maxCount: number,
): PickedImage[] {
  const merged = [...current];
  for (const item of additions) {
    if (merged.length >= maxCount) break;
    if (merged.some((entry) => entry.src === item.src)) continue;
    merged.push(item);
  }
  return merged;
}
