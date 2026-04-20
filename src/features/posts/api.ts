import { requestJson } from "../../lib/http";
import type { PostDetail, PostInput, PostListItem } from "./types";

export async function fetchPosts(): Promise<PostListItem[]> {
  return requestJson<PostListItem[]>("/api/posts");
}

export async function fetchPost(slug: string): Promise<PostDetail> {
  return requestJson<PostDetail>(`/api/posts/${slug}`);
}

export async function createPost(input: PostInput): Promise<PostDetail> {
  return requestJson<PostDetail>("/api/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updatePost(
  slug: string,
  input: PostInput & { sha: string },
): Promise<PostDetail> {
  return requestJson<PostDetail>(`/api/posts/${slug}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deletePost(slug: string, sha: string): Promise<{ ok: true; commitSha: string }> {
  return requestJson<{ ok: true; commitSha: string }>(`/api/posts/${slug}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sha }),
  });
}

export async function setPostDraft(slug: string, draft: boolean): Promise<PostDetail> {
  const detail = await fetchPost(slug);
  return updatePost(slug, {
    title: detail.title,
    slug: detail.slug,
    date: detail.date,
    draft,
    description: detail.description,
    tags: detail.tags,
    categories: detail.categories,
    cover: detail.cover,
    body: detail.body,
    sha: detail.sha,
  });
}
