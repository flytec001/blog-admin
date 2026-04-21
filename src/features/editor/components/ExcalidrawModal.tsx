import { useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw, exportToBlob, loadFromBlob } from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import "@excalidraw/excalidraw/index.css";

interface ExcalidrawModalProps {
  initialSrc?: string | null;
  onClose: () => void;
  onExport: (pngBlob: Blob) => Promise<void> | void;
}

function detectDarkMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ExcalidrawModal({ initialSrc, onClose, onExport }: ExcalidrawModalProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [loading, setLoading] = useState(Boolean(initialSrc));
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const theme = useMemo(() => detectDarkMode(), []);
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(
    initialSrc ? null : { appState: { viewBackgroundColor: "#ffffff" } },
  );

  useEffect(() => {
    if (!initialSrc) return;
    let cancelled = false;

    async function loadScene() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(initialSrc, { credentials: "omit" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const scene = await loadFromBlob(blob, null, null);
        if (cancelled) return;
        setInitialData(scene);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
          setInitialData({ appState: { viewBackgroundColor: "#ffffff" } });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadScene();
    return () => {
      cancelled = true;
    };
  }, [initialSrc]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    const api = apiRef.current;
    if (!api) return;
    setExporting(true);
    setError("");
    try {
      const elements = api.getSceneElements();
      if (elements.length === 0) {
        setError("画板为空，无法导出");
        setExporting(false);
        return;
      }
      const blob = await exportToBlob({
        elements,
        appState: { ...api.getAppState(), exportBackground: true },
        files: api.getFiles(),
        mimeType: "image/png",
        quality: 0.92,
      });
      await onExport(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="excalidraw-modal" role="dialog" aria-modal="true">
      <div className="excalidraw-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="excalidraw-modal-body">
        <header className="excalidraw-header">
          <div>
            <h2>画板</h2>
            <p>可插入图片、手绘图形、流程图，保存为 PNG 并嵌入场景数据。</p>
          </div>
          <div className="row-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={exporting || loading}
              onClick={() => void handleSave()}
            >
              {exporting ? "保存中..." : "保存并插入"}
            </button>
          </div>
        </header>
        {error ? <div className="alert error">{error}</div> : null}
        <div className="excalidraw-canvas">
          {loading || !initialData ? (
            <div className="excalidraw-loading">加载画板中...</div>
          ) : (
            <Excalidraw
              excalidrawAPI={(api) => {
                apiRef.current = api;
              }}
              initialData={initialData}
              theme={theme}
              UIOptions={{
                canvasActions: {
                  loadScene: true,
                  saveToActiveFile: false,
                  export: false,
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
