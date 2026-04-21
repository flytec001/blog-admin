import { useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import type { GalleryAttributes, GalleryItem } from "../extensions/Gallery";
import { ImagePickerDialog, type PickedImage } from "../components/ImagePickerDialog";

const COLUMN_OPTIONS = [2, 3, 4];

export function GalleryView(props: NodeViewProps) {
  const { node, selected, updateAttributes, deleteNode } = props;
  const attrs = node.attrs as GalleryAttributes;
  const [picker, setPicker] = useState<"add" | "replace" | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function setColumns(value: number) {
    updateAttributes({ columns: value });
  }

  function removeItem(index: number) {
    const items = attrs.items.filter((_, i) => i !== index);
    updateAttributes({ items });
  }

  function updateCaption(index: number, caption: string) {
    const items = attrs.items.map((item, i) =>
      i === index ? { ...item, caption: caption || null } : item,
    );
    updateAttributes({ items });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= attrs.items.length) return;
    const items = [...attrs.items];
    const [moved] = items.splice(index, 1);
    items.splice(target, 0, moved);
    updateAttributes({ items });
  }

  function handlePickerConfirm(picked: PickedImage[]) {
    const asItems: GalleryItem[] = picked.map((item) => ({
      src: item.src,
      alt: item.alt,
      caption: null,
    }));
    updateAttributes({ items: asItems });
    setPicker(null);
  }

  function handleAddConfirm(picked: PickedImage[]) {
    const existing = attrs.items.map((item) => item.src);
    const additions = picked
      .filter((item) => !existing.includes(item.src))
      .map<GalleryItem>((item) => ({ src: item.src, alt: item.alt, caption: null }));
    updateAttributes({ items: [...attrs.items, ...additions] });
    setPicker(null);
  }

  const columns = Math.min(4, Math.max(1, attrs.columns ?? 2));

  return (
    <NodeViewWrapper
      className={`gallery-node-wrapper ${selected ? "is-selected" : ""}`}
      data-drag-handle
    >
      <div
        className="gallery-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {attrs.items.length === 0 ? (
          <div className="gallery-empty">
            画廊为空，点击下方「添加图片」选择。
          </div>
        ) : (
          attrs.items.map((item, index) => (
            <figure key={`${item.src}-${index}`} className="gallery-item">
              <img src={item.src} alt={item.alt ?? ""} loading="lazy" />
              {item.caption ? <figcaption>{item.caption}</figcaption> : null}
              {selected ? (
                <div className="gallery-item-overlay" contentEditable={false}>
                  <button
                    type="button"
                    className="tb-btn"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    title="左移"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="tb-btn"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === attrs.items.length - 1}
                    title="右移"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="tb-btn"
                    onClick={() =>
                      setEditingIndex((prev) => (prev === index ? null : index))
                    }
                    title="编辑图注"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="tb-btn danger"
                    onClick={() => removeItem(index)}
                    title="移除"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              {editingIndex === index && selected ? (
                <input
                  type="text"
                  className="gallery-caption-input"
                  value={item.caption ?? ""}
                  placeholder="图注（可留空）"
                  onChange={(event) => updateCaption(index, event.target.value)}
                  onBlur={() => setEditingIndex(null)}
                  autoFocus
                />
              ) : null}
            </figure>
          ))
        )}
      </div>

      {selected ? (
        <div className="figure-toolbar" contentEditable={false}>
          <div className="figure-toolbar-row">
            <span className="figure-toolbar-label">列数</span>
            <div className="figure-toolbar-group">
              {COLUMN_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={columns === n ? "tb-btn active" : "tb-btn"}
                  onClick={() => setColumns(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="figure-toolbar-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPicker("add")}
            >
              添加图片
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPicker("replace")}
            >
              重新选择
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => deleteNode()}
            >
              删除画廊
            </button>
          </div>
        </div>
      ) : null}

      {picker === "add" ? (
        <ImagePickerDialog
          title="添加图片到画廊"
          description="选择一张或多张图片（将追加到现有画廊末尾）"
          minCount={1}
          maxCount={12}
          onClose={() => setPicker(null)}
          onConfirm={handleAddConfirm}
        />
      ) : null}

      {picker === "replace" ? (
        <ImagePickerDialog
          title="重新选择画廊图片"
          description="将替换画廊中当前所有图片"
          minCount={1}
          maxCount={12}
          initialSelection={attrs.items.map((item) => ({ src: item.src, alt: item.alt }))}
          onClose={() => setPicker(null)}
          onConfirm={handlePickerConfirm}
        />
      ) : null}
    </NodeViewWrapper>
  );
}
