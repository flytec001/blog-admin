import { useEffect, useMemo, useState } from "react";
import {
  deleteMedia,
  formatFileSize,
  formatUploadedAt,
  scanOrphans,
  type MediaItem,
  type OrphanScan,
} from "../api";

interface OrphanScannerProps {
  onClose: () => void;
  onAfterDelete: () => void;
}

export function OrphanScanner({ onClose, onAfterDelete }: OrphanScannerProps) {
  const [scan, setScan] = useState<OrphanScan | null>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setScanning(true);
      setError("");
      try {
        const result = await scanOrphans();
        if (!cancelled) setScan(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "扫描失败");
      } finally {
        if (!cancelled) setScanning(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const allSelected = useMemo(
    () => Boolean(scan?.orphans.length) && selected.size === scan?.orphans.length,
    [scan, selected],
  );

  function toggleAll() {
    if (!scan) return;
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(scan.orphans.map((item) => item.key)));
    }
  }

  function toggleOne(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (!scan || selected.size === 0) return;
    const targets = scan.orphans.filter((item) => selected.has(item.key));
    if (
      !window.confirm(
        `确认删除选中的 ${targets.length} 张图片吗？将释放约 ${formatFileSize(
          targets.reduce((sum, item) => sum + item.size, 0),
        )}，不可恢复。`,
      )
    )
      return;

    setDeleting(true);
    setError("");
    setProgress({ current: 0, total: targets.length });

    const failedKeys: string[] = [];
    for (let index = 0; index < targets.length; index++) {
      const item = targets[index];
      try {
        await deleteMedia(item.key);
      } catch {
        failedKeys.push(item.key);
      }
      setProgress({ current: index + 1, total: targets.length });
    }

    setDeleting(false);

    if (failedKeys.length > 0) {
      setError(`有 ${failedKeys.length} 张删除失败，请稍后重试`);
    }

    setScan((prev) =>
      prev
        ? {
            ...prev,
            orphans: prev.orphans.filter(
              (item) => failedKeys.includes(item.key) || !selected.has(item.key),
            ),
            orphanCount: prev.orphans.filter(
              (item) => failedKeys.includes(item.key) || !selected.has(item.key),
            ).length,
          }
        : prev,
    );
    setSelected(new Set(failedKeys));
    onAfterDelete();
  }

  return (
    <div className="media-modal" role="dialog" aria-modal="true">
      <div className="media-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="orphan-modal-body">
        <header className="orphan-header">
          <div>
            <h2>孤儿图片扫描</h2>
            <p>扫描仓库中的 Markdown 文件，找出 R2 里没有被任何文章引用的图片。</p>
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

        {scanning ? (
          <div className="orphan-status">正在扫描所有文章并与 R2 对比...</div>
        ) : scan ? (
          <>
            <div className="orphan-stats">
              <Stat label="总图片" value={scan.totalObjects.toString()} />
              <Stat label="被引用" value={scan.referencedCount.toString()} />
              <Stat label="扫描文章" value={scan.postCount.toString()} />
              <Stat
                label="孤儿数"
                value={scan.orphanCount.toString()}
                highlight={scan.orphanCount > 0}
              />
              <Stat label="可释放" value={formatFileSize(scan.orphanBytes)} />
            </div>

            {scan.orphans.length === 0 ? (
              <div className="empty-state">没有发现孤儿图片，R2 干净得很。</div>
            ) : (
              <>
                <div className="orphan-toolbar">
                  <label className="orphan-toggle-all">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                    <span>
                      {allSelected ? "取消全选" : "全选"}（已选 {selected.size}/
                      {scan.orphans.length}）
                    </span>
                  </label>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={deleting || selected.size === 0}
                    onClick={handleDeleteSelected}
                  >
                    {deleting
                      ? `删除中 ${progress.current}/${progress.total}`
                      : `删除选中 (${selected.size})`}
                  </button>
                </div>

                <div className="orphan-grid">
                  {scan.orphans.map((item) => (
                    <OrphanCard
                      key={item.key}
                      item={item}
                      checked={selected.has(item.key)}
                      onToggle={() => toggleOne(item.key)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "orphan-stat highlight" : "orphan-stat"}>
      <span className="orphan-stat-label">{label}</span>
      <strong className="orphan-stat-value">{value}</strong>
    </div>
  );
}

interface OrphanCardProps {
  item: MediaItem;
  checked: boolean;
  onToggle: () => void;
}

function OrphanCard({ item, checked, onToggle }: OrphanCardProps) {
  return (
    <label className={checked ? "orphan-card selected" : "orphan-card"}>
      <input
        type="checkbox"
        className="orphan-check"
        checked={checked}
        onChange={onToggle}
      />
      <div className="media-thumb">
        <img src={item.url} alt={item.originalName} loading="lazy" />
      </div>
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
    </label>
  );
}
