import { useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import type { CompareAttributes } from "../extensions/Compare";
import { ImagePickerDialog, type PickedImage } from "../components/ImagePickerDialog";

export function CompareView(props: NodeViewProps) {
  const { node, selected, updateAttributes, deleteNode } = props;
  const attrs = node.attrs as CompareAttributes;
  const [position, setPosition] = useState(50);
  const [picker, setPicker] = useState<"replace" | null>(null);

  function setLabel(key: "beforeLabel" | "afterLabel", value: string) {
    updateAttributes({ [key]: value || null });
  }

  function handleReplace(picked: PickedImage[]) {
    if (picked.length < 2) return;
    updateAttributes({
      before: picked[0].src,
      after: picked[1].src,
    });
    setPicker(null);
  }

  const hasImages = Boolean(attrs.before) && Boolean(attrs.after);

  return (
    <NodeViewWrapper
      className={`compare-node-wrapper ${selected ? "is-selected" : ""}`}
      data-drag-handle
    >
      {hasImages ? (
        <div className="compare-viewer">
          <div className="compare-layer compare-after">
            <img src={attrs.after} alt={attrs.afterLabel ?? "after"} draggable={false} />
            {attrs.afterLabel ? (
              <span className="compare-label compare-label-after">{attrs.afterLabel}</span>
            ) : null}
          </div>
          <div className="compare-layer compare-before" style={{ width: `${position}%` }}>
            <img
              src={attrs.before}
              alt={attrs.beforeLabel ?? "before"}
              draggable={false}
              style={{
                width: `${(100 / Math.max(position, 0.0001)) * 100}%`,
                maxWidth: "none",
              }}
            />
            {attrs.beforeLabel ? (
              <span className="compare-label compare-label-before">{attrs.beforeLabel}</span>
            ) : null}
          </div>
          <input
            className="compare-slider"
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            aria-label="拖动滑杆查看对比"
          />
          <div
            className="compare-divider"
            style={{ left: `${position}%` }}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="compare-placeholder">
          {selected ? "点击下方「选择图片」添加两张对比图" : "尚未设置对比图片"}
        </div>
      )}

      {selected ? (
        <div className="figure-toolbar" contentEditable={false}>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">前图注</span>
            <input
              type="text"
              className="figure-caption-input"
              value={attrs.beforeLabel ?? ""}
              placeholder="Before"
              onChange={(event) => setLabel("beforeLabel", event.target.value)}
            />
          </div>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">后图注</span>
            <input
              type="text"
              className="figure-caption-input"
              value={attrs.afterLabel ?? ""}
              placeholder="After"
              onChange={(event) => setLabel("afterLabel", event.target.value)}
            />
          </div>
          <div className="figure-toolbar-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPicker("replace")}
            >
              {hasImages ? "更换图片" : "选择图片"}
            </button>
            <button type="button" className="danger-button" onClick={() => deleteNode()}>
              删除对比
            </button>
          </div>
        </div>
      ) : null}

      {picker === "replace" ? (
        <ImagePickerDialog
          title="选择前后对比图"
          description="按顺序选择两张图片：第一张为「前」，第二张为「后」"
          minCount={2}
          maxCount={2}
          initialSelection={
            hasImages
              ? [
                  { src: attrs.before, alt: attrs.beforeLabel },
                  { src: attrs.after, alt: attrs.afterLabel },
                ]
              : []
          }
          onClose={() => setPicker(null)}
          onConfirm={handleReplace}
        />
      ) : null}
    </NodeViewWrapper>
  );
}
