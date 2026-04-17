import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deletePost, fetchPost, fetchPosts } from "../api";
import { PostListTable } from "../components/PostListTable";
import type { PostListItem } from "../types";

export function PostListPage() {
  const [items, setItems] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

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
      {loading ? <div className="empty-state">加载中...</div> : null}
      {!loading ? (
        <PostListTable items={items} deletingSlug={deletingSlug} onDelete={handleDelete} />
      ) : null}
    </section>
  );
}
