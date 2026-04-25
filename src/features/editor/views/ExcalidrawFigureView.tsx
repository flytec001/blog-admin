import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import type { ExcalidrawFigureAttributes } from "../extensions/ExcalidrawFigure";

export function ExcalidrawFigureView(props: NodeViewProps) {
  const { node, selected, updateAttributes, deleteNode } = props;
  const attrs = node.attrs as ExcalidrawFigureAttributes;

  function onAltChange(event: React.ChangeEvent<HTMLInputElement>) {
    updateAttributes({ alt: event.target.value || null });
  }

  function onCaptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    updateAttributes({ caption: event.target.value || null });
  }

  return (
    <NodeViewWrapper
      className={`figure-node ${selected ? "is-selected" : ""}`}
      data-drag-handle
    >
      <figure className="figure-node-body">
        {attrs.src ? (
          <img src={attrs.src} alt={attrs.alt ?? ""} draggable={false} />
        ) : (
          <div className="figure-placeholder">Excalidraw 图片地址为空</div>
        )}
        {attrs.caption ? (
          <figcaption className="figure-node-caption">{attrs.caption}</figcaption>
        ) : null}
      </figure>

      {selected ? (
        <div className="figure-toolbar" contentEditable={false}>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">说明</span>
            <input
              className="figure-caption-input"
              type="text"
              value={attrs.alt ?? ""}
              onChange={onAltChange}
              placeholder="替代文本（可留空）"
            />
          </div>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">图注</span>
            <input
              className="figure-caption-input"
              type="text"
              value={attrs.caption ?? ""}
              onChange={onCaptionChange}
              placeholder="图注（可留空）"
            />
            <button
              type="button"
              className="tb-btn danger"
              onClick={() => deleteNode()}
              title="删除 Excalidraw 图片"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
