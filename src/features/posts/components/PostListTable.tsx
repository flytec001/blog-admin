import { Link } from "react-router-dom";
import type { AnalyticsItem } from "../../analytics/useAnalytics";
import type { PostListItem } from "../types";

interface PostListTableProps {
  items: PostListItem[];
  deletingSlug?: string | null;
  togglingSlug?: string | null;
  onDelete: (slug: string) => void;
  onToggleDraft: (slug: string, nextDraft: boolean) => void;
  analyticsEnabled?: boolean;
  analyticsMap?: Map<string, AnalyticsItem>;
}

function formatNumber(value: number): string {
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function PostListTable({
  items,
  deletingSlug,
  togglingSlug,
  onDelete,
  onToggleDraft,
  analyticsEnabled,
  analyticsMap,
}: PostListTableProps) {
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
          {analyticsEnabled ? <th>30天浏览</th> : null}
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const stat = analyticsMap?.get(item.slug);
          const isToggling = togglingSlug === item.slug;
          return (
            <tr key={item.slug}>
              <td className="title-cell">
                <Link className="post-title-cell" to={`/posts/${item.slug}`}>
                  <strong>{item.title}</strong>
                  <span>{item.description || "无摘要"}</span>
                </Link>
              </td>
              <td data-label="Slug" className="post-slug-cell">
                <code>{item.slug}</code>
              </td>
              <td data-label="日期" className="post-date-cell">{item.date}</td>
              <td data-label="状态">
                <button
                  type="button"
                  className={`status-badge ${item.draft ? "draft" : "published"} clickable`}
                  onClick={() => onToggleDraft(item.slug, !item.draft)}
                  disabled={isToggling}
                  title={item.draft ? "点击发布" : "点击转为草稿"}
                >
                  {isToggling ? "切换中..." : item.draft ? "草稿" : "已发布"}
                </button>
              </td>
              {analyticsEnabled ? (
                <td data-label="30天浏览" className="analytics-column">
                  {stat ? (
                    <div className="analytics-cell">
                      <strong>{formatNumber(stat.pageviews)}</strong>
                      <span>{formatNumber(stat.visits)} 访客</span>
                    </div>
                  ) : (
                    <span className="analytics-empty">—</span>
                  )}
                </td>
              ) : null}
              <td className="actions-cell compact-actions">
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
          );
        })}
      </tbody>
    </table>
  );
}
