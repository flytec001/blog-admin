import { useRef } from "react";
import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor;
  onPickImage: (file: File) => void;
  uploading: boolean;
}

export function EditorToolbar({ editor, onPickImage, uploading }: EditorToolbarProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);

  function pickFromFiles() {
    fileRef.current?.click();
  }

  function pickFromCamera() {
    cameraRef.current?.click();
  }

  function onChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onPickImage(file);
    event.target.value = "";
  }

  function setLink() {
    const url = window.prompt("输入链接地址", editor.getAttributes("link").href ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const btn = (
    active: boolean,
    label: string,
    title: string,
    onClick: () => void,
    disabled = false,
  ) => (
    <button
      key={title}
      type="button"
      className={active ? "tb-btn active" : "tb-btn"}
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );

  return (
    <div className="rich-toolbar" role="toolbar" aria-label="编辑器工具栏">
      {btn(editor.isActive("bold"), "B", "加粗", () => editor.chain().focus().toggleBold().run())}
      {btn(editor.isActive("italic"), "I", "斜体", () => editor.chain().focus().toggleItalic().run())}
      {btn(editor.isActive("strike"), "S", "删除线", () => editor.chain().focus().toggleStrike().run())}
      {btn(editor.isActive("code"), "`", "行内代码", () => editor.chain().focus().toggleCode().run())}
      <span className="tb-sep" />
      {btn(editor.isActive("heading", { level: 1 }), "H1", "一级标题", () =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
      )}
      {btn(editor.isActive("heading", { level: 2 }), "H2", "二级标题", () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      )}
      {btn(editor.isActive("heading", { level: 3 }), "H3", "三级标题", () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
      )}
      <span className="tb-sep" />
      {btn(editor.isActive("bulletList"), "•", "无序列表", () =>
        editor.chain().focus().toggleBulletList().run(),
      )}
      {btn(editor.isActive("orderedList"), "1.", "有序列表", () =>
        editor.chain().focus().toggleOrderedList().run(),
      )}
      {btn(editor.isActive("blockquote"), "❝", "引用", () =>
        editor.chain().focus().toggleBlockquote().run(),
      )}
      {btn(editor.isActive("codeBlock"), "</>", "代码块", () =>
        editor.chain().focus().toggleCodeBlock().run(),
      )}
      <span className="tb-sep" />
      {btn(editor.isActive("link"), "🔗", "链接", setLink)}
      {btn(false, "🖼", uploading ? "上传中..." : "插入图片", pickFromFiles, uploading)}
      {btn(false, "📷", uploading ? "上传中..." : "拍照插入", pickFromCamera, uploading)}
      <span className="tb-sep" />
      {btn(false, "↶", "撤销", () => editor.chain().focus().undo().run(), !editor.can().undo())}
      {btn(false, "↷", "重做", () => editor.chain().focus().redo().run(), !editor.can().redo())}

      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={onChosen}
      />
      <input
        ref={cameraRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChosen}
      />
    </div>
  );
}
