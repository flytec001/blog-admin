import { Link } from "react-router-dom";
import type { PostListItem } from "../types";

interface PostListTableProps {
  items: PostListItem[];
  deletingSlug?: string | null;
  onDelete: (slug: string) => void;
}

export function PostListTable({ items, deletingSlug, onDelete }: PostListTableProps) {
  if (items.length === 0) {
    return <div className="empty-state">还没有文章，先新建一篇。</div>;
  }

  return (
    <table className="post-table">
      <thead>
        <tr>
          <th>标题</th>
          <th>Slug</th>
          <th>日期</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.slug}>
            <td>
              <div className="post-title-cell">
                <strong>{item.title}</strong>
                <span>{item.description || "无摘要"}</span>
              </div>
            </td>
            <td>{item.slug}</td>
            <td>{item.date}</td>
            <td>
              <span className={`status-badge ${item.draft ? "draft" : "published"}`}>
                {item.draft ? "草稿" : "已发布"}
              </span>
            </td>
            <td>
              <div className="row-actions">
                <Link className="secondary-button" to={`/posts/${item.slug}`}>
                  编辑
                </Link>
                <button
                  className="danger-button"
                  type="button"
                  disabled={deletingSlug === item.slug}
                  onClick={() => onDelete(item.slug)}
                >
                  {deletingSlug === item.slug ? "删除中..." : "删除"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
