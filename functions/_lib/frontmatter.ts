import YAML from "yaml";
import { postMetaSchema } from "./schema";

export type PostMeta = {
  title: string;
  slug: string;
  date: string;
  lastmod: string;
  draft: boolean;
  description: string;
  tags: string[];
  categories: string[];
  cover?: string;
};

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export function parseMarkdown(
  source: string,
  fallback: Partial<Pick<PostMeta, "slug" | "lastmod">> = {},
): { meta: PostMeta; body: string } {
  const match = source.match(FRONTMATTER_RE);

  if (!match) {
    throw new Error("Invalid front matter");
  }

  const parsed = YAML.parse(match[1]) as Record<string, unknown>;
  const normalized = {
    ...parsed,
    slug: parsed.slug ?? fallback.slug,
    lastmod:
      parsed.lastmod ?? parsed.date ?? fallback.lastmod ?? fallback.slug ?? "",
    description: parsed.description ?? "",
    tags: parsed.tags ?? [],
    categories: parsed.categories ?? [],
    draft: parsed.draft ?? false,
  };
  const meta = postMetaSchema.parse(normalized);
  const body = match[2].replace(/\s+$/, "");

  return { meta, body };
}

export function stringifyMarkdown(meta: PostMeta, body: string): string {
  const orderedMeta = {
    title: meta.title,
    slug: meta.slug,
    date: meta.date,
    lastmod: meta.lastmod,
    draft: meta.draft,
    description: meta.description,
    tags: meta.tags,
    categories: meta.categories,
    ...(meta.cover ? { cover: meta.cover } : {}),
  };

  const yaml = YAML.stringify(orderedMeta).trimEnd();
  const normalizedBody = body.replace(/\s+$/, "");

  return `---\n${yaml}\n---\n${normalizedBody}\n`;
}
