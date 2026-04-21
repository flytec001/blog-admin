import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { uploadImage } from "../../lib/upload";
import { EditorToolbar } from "./EditorToolbar";
import { Figure } from "./extensions/Figure";
import { Gallery } from "./extensions/Gallery";
import { Compare } from "./extensions/Compare";
import { shortcodesToHtml } from "./markdownBridge";
import { ImagePickerDialog, type PickedImage } from "./components/ImagePickerDialog";

interface RichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  onSubmitShortcut?: () => void;
}

function createShortcuts(onSubmit?: () => void) {
  return Extension.create({
    name: "richEditorShortcuts",
    addKeyboardShortcuts() {
      return {
        "Mod-k": () => {
          const editor = this.editor;
          const current = editor.getAttributes("link").href ?? "";
          const url = window.prompt("输入链接地址", current || "https://");
          if (url === null) return true;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return true;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          return true;
        },
        "Mod-s": () => {
          onSubmit?.();
          return true;
        },
      };
    },
  });
}

export function RichEditor({ value, onChange, placeholder, onSubmitShortcut }: RichEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<"gallery" | "compare" | null>(null);
  const lastValueRef = useRef(value);
  const submitRef = useRef(onSubmitShortcut);
  submitRef.current = onSubmitShortcut;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Figure,
      Gallery,
      Compare,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "开始写作...",
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        linkify: true,
        breaks: true,
        transformPastedText: true,
      }),
      createShortcuts(() => submitRef.current?.()),
    ],
    content: shortcodesToHtml(value),
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        spellcheck: "false",
      },
      handlePaste: (_view, event) => handleFilesFromEvent(event.clipboardData?.files),
      handleDrop: (_view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        return handleFilesFromEvent(files);
      },
    },
    onUpdate: ({ editor: instance }) => {
      const markdown = instance.storage.markdown.getMarkdown();
      lastValueRef.current = markdown;
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    editor.commands.setContent(shortcodesToHtml(value || ""), { emitUpdate: false });
  }, [editor, value]);

  function handleFilesFromEvent(list?: FileList | null): boolean {
    if (!list || list.length === 0 || !editor) return false;
    const images = Array.from(list).filter((item) => item.type.startsWith("image/"));
    if (images.length === 0) return false;
    void insertImages(images);
    return true;
  }

  async function insertImages(files: File[]) {
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const result = await uploadImage(file);
        editor
          ?.chain()
          .focus()
          .insertFigure({ src: result.url, alt: file.name })
          .run();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function insertImageViaPicker(file: File) {
    void insertImages([file]);
  }

  function handleGalleryInsert(picked: PickedImage[]) {
    editor
      ?.chain()
      .focus()
      .insertGallery({
        columns: picked.length >= 3 ? 3 : 2,
        items: picked.map((item) => ({ src: item.src, alt: item.alt, caption: null })),
      })
      .run();
    setPicker(null);
  }

  function handleCompareInsert(picked: PickedImage[]) {
    if (picked.length < 2) return;
    editor
      ?.chain()
      .focus()
      .insertCompare({
        before: picked[0].src,
        after: picked[1].src,
        beforeLabel: null,
        afterLabel: null,
      })
      .run();
    setPicker(null);
  }

  if (!editor) {
    return <div className="rich-editor-loading">编辑器加载中...</div>;
  }

  return (
    <div className="rich-editor">
      <EditorToolbar
        editor={editor}
        onPickImage={insertImageViaPicker}
        onInsertGallery={() => setPicker("gallery")}
        onInsertCompare={() => setPicker("compare")}
        uploading={uploading}
      />
      <EditorContent editor={editor} />
      {error ? <div className="field-error">{error}</div> : null}

      {picker === "gallery" ? (
        <ImagePickerDialog
          title="插入图片画廊"
          description="选择 2 张以上图片组成画廊"
          minCount={2}
          maxCount={12}
          onClose={() => setPicker(null)}
          onConfirm={handleGalleryInsert}
        />
      ) : null}

      {picker === "compare" ? (
        <ImagePickerDialog
          title="插入前后对比"
          description="依次选择两张图片：第一张作为「前」，第二张作为「后」"
          minCount={2}
          maxCount={2}
          onClose={() => setPicker(null)}
          onConfirm={handleCompareInsert}
        />
      ) : null}
    </div>
  );
}
