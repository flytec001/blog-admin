import { useDeferredValue, useEffect, useRef, useState, type FormEvent } from "react";
import { RichEditor } from "../../editor/RichEditor";
import { ImageUploader } from "../../uploads/ImageUploader";
import { MarkdownPreview } from "./MarkdownPreview";
import { slugify } from "../slugify";
import type { PostInput } from "../types";

interface PostFormProps {
  mode: "create" | "edit";
  value: PostInput;
  isSubmitting: boolean;
  error: string;
  success: string;
  draftStatus: string;
  onChange: (next: PostInput) => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

type MobileView = "edit" | "preview";

export function PostForm({
  mode,
  value,
  isSubmitting,
  error,
  success,
  draftStatus,
  onChange,
  onSubmit,
  onDelete,
}: PostFormProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 960px)").matches : true,
  );
  const [mobileView, setMobileView] = useState<MobileView>("edit");
  const [desktopPreviewOpen, setDesktopPreviewOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const deferredBody = useDeferredValue(value.body ?? "");
  const slugTouchedRef = useRef(mode === "edit" && Boolean(value.slug));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(min-width: 960px)");
    const listener = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  function setField<K extends keyof PostInput>(key: K, fieldValue: PostInput[K]) {
    if (
      mode === "create" &&
      key === "title" &&
      !slugTouchedRef.current
    ) {
      const nextSlug = slugify(String(fieldValue ?? ""));
      onChange({ ...value, title: String(fieldValue ?? ""), slug: nextSlug });
      return;
    }

    if (key === "slug") {
      slugTouchedRef.current = String(fieldValue ?? "").length > 0;
    }

    onChange({ ...value, [key]: fieldValue });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!isSubmitting) onSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSubmitting, onSubmit]);

  const metaFields = (
    <div className="form-grid">
      <label className="field">
        <span>标题</span>
        <input
          aria-label="标题"
          value={value.title ?? ""}
          onChange={(event) => setField("title", event.target.value)}
        />
      </label>

      <label className="field">
        <span>Slug</span>
        <input
          aria-label="Slug"
          value={value.slug ?? ""}
          onChange={(event) => setField("slug", event.target.value)}
          placeholder={mode === "create" ? "根据标题自动生成，可手动覆盖" : ""}
        />
      </label>

      <label className="field">
        <span>日期</span>
        <input
          aria-label="日期"
          value={value.date ?? ""}
          onChange={(event) => setField("date", event.target.value)}
        />
      </label>

      <label className="field field-checkbox">
        <span>草稿</span>
        <input
          aria-label="草稿"
          type="checkbox"
          checked={value.draft}
          onChange={(event) => setField("draft", event.target.checked)}
        />
      </label>

      <label className="field field-full">
        <span>摘要</span>
        <textarea
          aria-label="摘要"
          rows={3}
          value={value.description ?? ""}
          onChange={(event) => setField("description", event.target.value)}
        />
      </label>

      <label className="field">
        <span>标签</span>
        <input
          value={(value.tags ?? []).join(", ")}
          onChange={(event) =>
            setField(
              "tags",
              event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
            )
          }
        />
      </label>

      <label className="field">
        <span>分类</span>
        <input
          value={(value.categories ?? []).join(", ")}
          onChange={(event) =>
            setField(
              "categories",
              event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
            )
          }
        />
      </label>

      <label className="field field-full">
        <span>封面图</span>
        <div className="cover-row">
          <input
            value={value.cover ?? ""}
            onChange={(event) => setField("cover", event.target.value)}
          />
          <ImageUploader label="上传封面" onUploaded={(url) => setField("cover", url)} />
        </div>
      </label>
    </div>
  );

  const editorPane = (
    <div className="editor-pane">
      <RichEditor
        value={value.body ?? ""}
        onChange={(markdown) => setField("body", markdown)}
        placeholder="开始写作，支持粘贴/拖放图片..."
        onSubmitShortcut={() => {
          if (!isSubmitting) onSubmit();
        }}
      />
    </div>
  );

  const previewPane = (
    <div className="preview-pane">
      <MarkdownPreview markdown={deferredBody} />
    </div>
  );

  const desktopWorkspace = (
    <div className="editor-desktop">
      <div className="desktop-view-switch" role="tablist" aria-label="桌面编辑视图">
        <button
          type="button"
          role="tab"
          aria-selected={!desktopPreviewOpen}
          className={!desktopPreviewOpen ? "active" : ""}
          onClick={() => setDesktopPreviewOpen(false)}
        >
          正文
        </button>
        <button
          type="button"
          role="tab"
          data-preview-toggle="desktop"
          aria-selected={desktopPreviewOpen}
          aria-pressed={desktopPreviewOpen}
          className={desktopPreviewOpen ? "active" : ""}
          onClick={() => setDesktopPreviewOpen((open) => !open)}
        >
          {desktopPreviewOpen ? "收起预览" : "展开预览"}
        </button>
      </div>

      <div className="editor-desktop-stack">
        {editorPane}
        {desktopPreviewOpen ? previewPane : null}
      </div>
    </div>
  );

  return (
    <form className="editor-form panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <h1>{mode === "create" ? "新建文章" : "编辑文章"}</h1>
          <p>内容将写回 Hugo 仓库，图片上传到 R2。</p>
        </div>
        <div className="row-actions">
          <button
            type="button"
            className={`status-badge ${value.draft ? "draft" : "published"} clickable`}
            onClick={() => setField("draft", !value.draft)}
            title={value.draft ? "当前草稿，点击切换为已发布" : "当前已发布，点击切换为草稿"}
            aria-label={value.draft ? "切换为已发布" : "切换为草稿"}
          >
            {value.draft ? "草稿" : "已发布"}
          </button>
          {onDelete ? (
            <button className="danger-button" type="button" onClick={onDelete}>
              删除
            </button>
          ) : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}
      {draftStatus ? <div className="alert info">{draftStatus}</div> : null}

      <details
        className="meta-section"
        open={isDesktop || metaOpen}
        onToggle={(event) => setMetaOpen((event.target as HTMLDetailsElement).open)}
      >
        <summary>文章信息</summary>
        {metaFields}
      </details>

      {isDesktop ? (
        desktopWorkspace
      ) : (
        <div className="editor-mobile">
          <div className="mobile-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "edit"}
              className={mobileView === "edit" ? "active" : ""}
              onClick={() => setMobileView("edit")}
            >
              编辑
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "preview"}
              className={mobileView === "preview" ? "active" : ""}
              onClick={() => setMobileView("preview")}
            >
              预览
            </button>
          </div>
          {mobileView === "edit" ? editorPane : previewPane}
        </div>
      )}

      <div className="shortcut-hint">
        <kbd>⌘</kbd><kbd>B</kbd> 加粗 · <kbd>⌘</kbd><kbd>I</kbd> 斜体 · <kbd>⌘</kbd><kbd>K</kbd> 链接 · <kbd>⌘</kbd><kbd>S</kbd> 保存
      </div>
    </form>
  );
}
