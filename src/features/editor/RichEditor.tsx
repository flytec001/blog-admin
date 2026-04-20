import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { uploadImage } from "../../lib/upload";
import { EditorToolbar } from "./EditorToolbar";

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
  const lastValueRef = useRef(value);
  const submitRef = useRef(onSubmitShortcut);
  submitRef.current = onSubmitShortcut;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "开始写作...",
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        linkify: true,
        breaks: true,
        transformPastedText: true,
      }),
      createShortcuts(() => submitRef.current?.()),
    ],
    content: value,
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
    editor.commands.setContent(value || "", { emitUpdate: false });
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
        editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run();
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

  if (!editor) {
    return <div className="rich-editor-loading">编辑器加载中...</div>;
  }

  return (
    <div className="rich-editor">
      <EditorToolbar
        editor={editor}
        onPickImage={insertImageViaPicker}
        uploading={uploading}
      />
      <EditorContent editor={editor} />
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}
