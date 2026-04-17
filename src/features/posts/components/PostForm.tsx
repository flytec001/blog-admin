import { useDeferredValue, useState, type FormEvent } from "react";
import { ImageUploader } from "../../uploads/ImageUploader";
import { MarkdownPreview } from "./MarkdownPreview";
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
  const [panel, setPanel] = useState<"edit" | "preview">("edit");
  const deferredBody = useDeferredValue(value.body ?? "");

  function setField<K extends keyof PostInput>(key: K, fieldValue: PostInput[K]) {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="editor-form panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <h1>{mode === "create" ? "新建文章" : "编辑文章"}</h1>
          <p>内容将写回 Hugo 仓库，图片上传到 R2。</p>
        </div>
        <div className="row-actions">
          {onDelete ? (
            <button className="danger-button" type="button" onClick={onDelete}>
              删除文章
            </button>
          ) : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存文章"}
          </button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}
      {draftStatus ? <div className="alert info">{draftStatus}</div> : null}

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
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
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
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>

        <label className="field field-full">
          <span>封面图</span>
          <input
            value={value.cover ?? ""}
            onChange={(event) => setField("cover", event.target.value)}
          />
        </label>
      </div>

      <div className="upload-row">
        <ImageUploader label="上传封面图" onUploaded={(url) => setField("cover", url)} />
        <ImageUploader
          label="上传正文图片"
          onUploaded={(url) => setField("body", `${value.body}\n\n![](${url})`.trim())}
        />
      </div>

      <div className="editor-switch">
        <button
          className={panel === "edit" ? "switch-button active" : "switch-button"}
          type="button"
          onClick={() => setPanel("edit")}
        >
          编辑
        </button>
        <button
          className={panel === "preview" ? "switch-button active" : "switch-button"}
          type="button"
          onClick={() => setPanel("preview")}
        >
          预览
        </button>
      </div>

      {panel === "edit" ? (
        <label className="field">
          <span>正文</span>
          <textarea
            aria-label="正文"
            rows={18}
            value={value.body ?? ""}
            onChange={(event) => setField("body", event.target.value)}
          />
        </label>
      ) : (
        <section className="field">
          <span>正文预览</span>
          <MarkdownPreview markdown={deferredBody} />
        </section>
      )}
    </form>
  );
}
