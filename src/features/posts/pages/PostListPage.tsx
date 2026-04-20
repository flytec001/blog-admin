import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deletePost, fetchPost, fetchPosts, setPostDraft } from "../api";
import { PostListTable } from "../components/PostListTable";
import { useAnalytics } from "../../analytics/useAnalytics";
import type { PostListItem } from "../types";

function normalize(input: string): string {
  return input.toLowerCase().trim();
}

function matchesQuery(item: PostListItem, query: string): boolean {
  if (!query) return true;
  const q = normalize(query);
  const haystack = [
    item.title,
    item.slug,
    item.description,
    ...(item.tags ?? []),
    ...(item.categories ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function PostListPage() {
  const [items, setItems] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const deferredQuery = useDeferredValue(query);
  const analytics = useAnalytics(30);

  async function loadPosts() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchPosts();
      setItems(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载文章失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  async function handleDelete(slug: string) {
    if (!window.confirm(`确认删除文章 ${slug} 吗？`)) {
      return;
    }

    setDeletingSlug(slug);
    setError("");

    try {
      const detail = await fetchPost(slug);
      await deletePost(slug, detail.sha);
      setItems((current) => current.filter((item) => item.slug !== slug));
    } catch (error) {
      setError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeletingSlug(null);
    }
  }

  async function handleToggleDraft(slug: string, nextDraft: boolean) {
    const action = nextDraft ? "转为草稿（隐藏）" : "发布";
    if (!window.confirm(`确认将文章 ${slug} ${action}？`)) return;

    setTogglingSlug(slug);
    setError("");

    try {
      const saved = await setPostDraft(slug, nextDraft);
      setItems((current) =>
        current.map((item) =>
          item.slug === slug ? { ...item, draft: saved.draft, lastmod: saved.lastmod ?? item.lastmod } : item,
        ),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "切换状态失败");
    } finally {
      setTogglingSlug(null);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter === "published" && item.draft) return false;
      if (filter === "draft" && !item.draft) return false;
      return matchesQuery(item, deferredQuery);
    });
  }, [items, filter, deferredQuery]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1>文章列表</h1>
          <p>这里展示 Hugo 仓库里已保存的文章文件。</p>
        </div>
        <Link className="primary-button" to="/posts/new">
          新建文章
        </Link>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="list-toolbar">
        <div className="search-field">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            aria-label="搜索文章"
            placeholder="搜索标题、描述、标签..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="清空搜索"
            >
              ✕
            </button>
          ) : null}
        </div>
        <div className="filter-tabs" role="tablist" aria-label="按状态过滤">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            全部
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "published"}
            className={filter === "published" ? "active" : ""}
            onClick={() => setFilter("published")}
          >
            已发布
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "draft"}
            className={filter === "draft" ? "active" : ""}
            onClick={() => setFilter("draft")}
          >
            草稿
          </button>
        </div>
        {!loading ? (
          <div className="list-count">
            {filtered.length}/{items.length} 篇
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {items.length === 0 ? "还没有文章，先新建一篇。" : "没有符合条件的文章。"}
        </div>
      ) : (
        <PostListTable
          items={filtered}
          deletingSlug={deletingSlug}
          togglingSlug={togglingSlug}
          onDelete={handleDelete}
          onToggleDraft={handleToggleDraft}
          analyticsEnabled={analytics.enabled}
          analyticsMap={analytics.map}
        />
      )}
    </section>
  );
}
