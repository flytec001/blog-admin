import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import type { FigureAlign, FigureAttributes, FigureSize } from "../extensions/Figure";

const ALIGN_OPTIONS: Array<{ value: FigureAlign; label: string }> = [
  { value: null, label: "默认" },
  { value: "left", label: "左" },
  { value: "center", label: "中" },
  { value: "right", label: "右" },
  { value: "wide", label: "加宽" },
  { value: "full", label: "全宽" },
];

const SIZE_OPTIONS: Array<{ value: FigureSize; label: string }> = [
  { value: null, label: "原始" },
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
  { value: "full", label: "满格" },
];

export function FigureView(props: NodeViewProps) {
  const { node, selected, updateAttributes, deleteNode } = props;
  const attrs = node.attrs as FigureAttributes;

  function onCaption(event: React.ChangeEvent<HTMLInputElement>) {
    updateAttributes({ caption: event.target.value || null });
  }

  function setAlign(value: FigureAlign) {
    updateAttributes({ align: value });
  }

  function setSize(value: FigureSize) {
    updateAttributes({ size: value });
  }

  return (
    <NodeViewWrapper
      className={`figure-node ${selected ? "is-selected" : ""} ${
        attrs.align ? `is-align-${attrs.align}` : ""
      } ${attrs.size ? `is-size-${attrs.size}` : ""}`}
      data-align={attrs.align ?? undefined}
      data-size={attrs.size ?? undefined}
      data-drag-handle
    >
      <figure className="figure-node-body">
        {attrs.src ? (
          <img src={attrs.src} alt={attrs.alt ?? ""} draggable={false} />
        ) : (
          <div className="figure-placeholder">（图片地址为空）</div>
        )}
        {attrs.caption ? (
          <figcaption className="figure-node-caption">{attrs.caption}</figcaption>
        ) : null}
      </figure>

      {selected ? (
        <div className="figure-toolbar" contentEditable={false}>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">对齐</span>
            <div className="figure-toolbar-group">
              {ALIGN_OPTIONS.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className={attrs.align === option.value ? "tb-btn active" : "tb-btn"}
                  onClick={() => setAlign(option.value)}
                  title={`对齐：${option.label}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">尺寸</span>
            <div className="figure-toolbar-group">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className={attrs.size === option.value ? "tb-btn active" : "tb-btn"}
                  onClick={() => setSize(option.value)}
                  title={`尺寸：${option.label}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">图注</span>
            <input
              className="figure-caption-input"
              type="text"
              value={attrs.caption ?? ""}
              onChange={onCaption}
              placeholder="填写后保存为 Hugo figure caption"
            />
            <button
              type="button"
              className="tb-btn danger"
              onClick={() => deleteNode()}
              title="删除图片"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
