import { z } from "zod";
import type { PostMeta } from "./frontmatter";
import { parseMarkdown, stringifyMarkdown } from "./frontmatter";
import { HttpError } from "./errors";
import { postWriteSchema } from "./schema";

export interface PostListItem {
  title: string;
  slug: string;
  date: string;
  lastmod: string;
  draft: boolean;
  description: string;
  tags: string[];
  categories: string[];
}

export interface PostDetail extends PostMeta {
  body: string;
  sha: string;
}

export function buildPostPath(postsDir: string, slug: string): string {
  return `${postsDir}/${slug}.md`;
}

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugFromPath(path: string): string {
  const fileName = path.split("/").pop() ?? path;
  return fileName.replace(/\.md$/i, "");
}

export function parseWriteInput(data: unknown) {
  return postWriteSchema.parse(data);
}

export function parseDeleteInput(data: unknown) {
  return z.object({ sha: z.string().min(1) }).parse(data);
}

export function buildPostMeta(input: ReturnType<typeof parseWriteInput>, slug: string): PostMeta {
  return {
    title: input.title,
    slug,
    date: input.date,
    lastmod: input.date,
    draft: input.draft,
    description: input.description,
    tags: input.tags,
    categories: input.categories,
    ...(input.cover ? { cover: input.cover } : {}),
  };
}

export function toPostDetail(markdown: string, sha: string, path: string): PostDetail {
  const parsed = parseMarkdown(markdown, {
    slug: slugFromPath(path),
  });
  return {
    ...parsed.meta,
    body: parsed.body,
    sha,
  };
}

export function toPostListItem(markdown: string, path: string): PostListItem {
  const parsed = parseMarkdown(markdown, {
    slug: slugFromPath(path),
  });
  return {
    title: parsed.meta.title,
    slug: parsed.meta.slug,
    date: parsed.meta.date,
    lastmod: parsed.meta.lastmod,
    draft: parsed.meta.draft,
    description: parsed.meta.description,
    tags: parsed.meta.tags ?? [],
    categories: parsed.meta.categories ?? [],
  };
}

export function toMarkdown(input: ReturnType<typeof parseWriteInput>, slug: string) {
  return stringifyMarkdown(buildPostMeta(input, slug), input.body);
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return { status: 404, message: "Post not found" };
    }
    if (error.status === 409) {
      return { status: 409, message: "Post conflict" };
    }
    return { status: error.status, message: error.message };
  }

  if (error instanceof z.ZodError) {
    return { status: 400, message: "Invalid request body" };
  }

  return { status: 500, message: "Internal Server Error" };
}
