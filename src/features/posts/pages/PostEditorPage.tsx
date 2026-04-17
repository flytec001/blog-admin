import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, deletePost, fetchPost, updatePost } from "../api";
import { PostForm } from "../components/PostForm";
import {
  buildDraftStorageKey,
  clearDraft,
  createDraftPayload,
  hasDraftContent,
  isSamePostInput,
  loadDraft,
  saveDraft,
} from "../drafts";
import type { PostInput } from "../types";

const initialValue: PostInput = {
  title: "",
  slug: "",
  date: "2026-04-17T11:00:00+08:00",
  draft: true,
  description: "",
  tags: [],
  categories: [],
  cover: "",
  body: "",
};

export function PostEditorPage() {
  const params = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const mode = params.slug ? "edit" : "create";
  const [value, setValue] = useState<PostInput>(initialValue);
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [baseValue, setBaseValue] = useState<PostInput>(initialValue);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || mode !== "create") {
      return;
    }

    const storage = window.localStorage;
    const localDraft = loadDraft(storage, buildDraftStorageKey("create"));

    if (localDraft) {
      setValue(localDraft.value);
      setDraftStatus("已恢复本地草稿");
    }

    setDraftReady(true);
  }, [mode]);

  useEffect(() => {
    if (!params.slug) {
      return;
    }

    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError("");

      try {
        const detail = await fetchPost(params.slug!);
        if (cancelled) {
          return;
        }

        const serverValue = {
          title: detail.title,
          slug: detail.slug,
          date: detail.date,
          draft: detail.draft,
          description: detail.description,
          tags: detail.tags,
          categories: detail.categories,
          cover: detail.cover ?? "",
          body: detail.body,
        };
        const storage = window.localStorage;
        const localDraft = loadDraft(storage, buildDraftStorageKey("edit", params.slug));

        setValue(localDraft?.sha === detail.sha ? localDraft.value : serverValue);
        if (localDraft?.sha === detail.sha) {
          setDraftStatus("已恢复本地草稿");
        }
        setBaseValue(serverValue);
        setSha(detail.sha);
        setDraftReady(true);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "加载文章失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !draftReady ||
      loading ||
      submitting
    ) {
      return;
    }

    const key = mode === "create"
      ? buildDraftStorageKey("create")
      : buildDraftStorageKey("edit", params.slug);

    if (!hasDraftContent(value)) {
      clearDraft(window.localStorage, key);
      return;
    }

    if (mode === "edit" && isSamePostInput(value, baseValue)) {
      clearDraft(window.localStorage, key);
      return;
    }

    const timer = window.setTimeout(() => {
      saveDraft(
        window.localStorage,
        key,
        createDraftPayload(mode, value, sha),
      );
      setDraftStatus("草稿已自动保存");
    }, 800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [baseValue, draftReady, loading, mode, params.slug, sha, submitting, value]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (params.slug) {
        const saved = await updatePost(params.slug, {
          ...value,
          sha,
        });
        setSha(saved.sha);
        const savedValue = {
          title: saved.title,
          slug: saved.slug,
          date: saved.date,
          draft: saved.draft,
          description: saved.description,
          tags: saved.tags,
          categories: saved.categories,
          cover: saved.cover ?? "",
          body: saved.body,
        };
        setValue(savedValue);
        setBaseValue(savedValue);
        clearDraft(window.localStorage, buildDraftStorageKey("edit", params.slug));
      } else {
        const saved = await createPost(value);
        setSha(saved.sha);
        const savedValue = {
          title: saved.title,
          slug: saved.slug,
          date: saved.date,
          draft: saved.draft,
          description: saved.description,
          tags: saved.tags,
          categories: saved.categories,
          cover: saved.cover ?? "",
          body: saved.body,
        };
        setValue(savedValue);
        setBaseValue(savedValue);
        clearDraft(window.localStorage, buildDraftStorageKey("create"));
        await navigate(`/posts/${saved.slug}`, { replace: true });
      }

      setSuccess("保存成功");
      setDraftStatus("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!params.slug || !sha) {
      return;
    }

    if (!window.confirm(`确认删除文章 ${params.slug} 吗？`)) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await deletePost(params.slug, sha);
      clearDraft(window.localStorage, buildDraftStorageKey("edit", params.slug));
      await navigate("/posts");
    } catch (error) {
      setError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <section className="panel">加载中...</section>;
  }

  return (
    <PostForm
      mode={mode}
      value={value}
      isSubmitting={submitting}
      error={error}
      success={success}
      draftStatus={draftStatus}
      onChange={setValue}
      onSubmit={handleSubmit}
      onDelete={params.slug ? handleDelete : undefined}
    />
  );
}
