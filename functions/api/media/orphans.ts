import type { Env } from "../../_lib/env";
import { getContentFile, listContentDir } from "../../_lib/github";
import { requireEnvValue } from "../../_lib/env";
import { json } from "../../_lib/response";

interface OrphanItem {
  key: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  originalName: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractReferencedKeys(markdown: string, baseUrl: string): Set<string> {
  const keys = new Set<string>();
  const base = baseUrl.replace(/\/+$/, "");
  if (!base) return keys;
  const pattern = new RegExp(`${escapeRegex(base)}/([^\\s"')\\]>]+)`, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown))) {
    const raw = match[1];
    const clean = raw.split(/[?#]/)[0].replace(/[.,;:]+$/, "");
    if (clean) keys.add(clean);
  }
  return keys;
}

async function listAllR2Objects(env: Env): Promise<OrphanItem[]> {
  const items: OrphanItem[] = [];
  const baseUrl = env.R2_PUBLIC_BASE_URL;
  let cursor: string | undefined;
  do {
    const page = await env.MEDIA_BUCKET.list({
      prefix: "blog/",
      cursor,
      limit: 1000,
      include: ["httpMetadata", "customMetadata"],
    });
    for (const object of page.objects) {
      items.push({
        key: object.key,
        url: `${baseUrl}/${object.key}`,
        size: object.size,
        contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
        uploadedAt: object.customMetadata?.uploadedAt ?? object.uploaded.toISOString(),
        originalName:
          object.customMetadata?.originalName ?? object.key.split("/").pop() ?? object.key,
      });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return items;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const baseUrl = requireEnvValue(env, "R2_PUBLIC_BASE_URL");

  const [r2Objects, postEntries] = await Promise.all([
    listAllR2Objects(env),
    listContentDir(env, env.POSTS_DIR),
  ]);

  const mdFiles = postEntries.filter(
    (entry) => entry.type === "file" && entry.name.endsWith(".md"),
  );

  const contents = await Promise.all(
    mdFiles.map((entry) =>
      getContentFile(env, entry.path).catch(() => null),
    ),
  );

  const referenced = new Set<string>();
  for (const file of contents) {
    if (!file) continue;
    for (const key of extractReferencedKeys(file.content, baseUrl)) {
      referenced.add(key);
    }
  }

  const orphans = r2Objects.filter((item) => !referenced.has(item.key));
  orphans.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const totalBytes = orphans.reduce((sum, item) => sum + item.size, 0);

  return json({
    scannedAt: new Date().toISOString(),
    totalObjects: r2Objects.length,
    referencedCount: referenced.size,
    postCount: mdFiles.length,
    orphanCount: orphans.length,
    orphanBytes: totalBytes,
    orphans,
  });
};
