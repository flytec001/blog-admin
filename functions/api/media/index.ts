import type { Env } from "../../_lib/env";
import { requireEnvValue } from "../../_lib/env";
import { json } from "../../_lib/response";

interface MediaItem {
  key: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  originalName: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const baseUrl = requireEnvValue(env, "R2_PUBLIC_BASE_URL");
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "60", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 60;
  const prefix = url.searchParams.get("prefix") ?? "blog/";

  const listing = await env.MEDIA_BUCKET.list({
    prefix,
    cursor,
    limit,
    include: ["httpMetadata", "customMetadata"],
  });

  const items: MediaItem[] = listing.objects.map((object) => ({
    key: object.key,
    url: `${baseUrl}/${object.key}`,
    size: object.size,
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
    uploadedAt: object.customMetadata?.uploadedAt ?? object.uploaded.toISOString(),
    originalName: object.customMetadata?.originalName ?? object.key.split("/").pop() ?? object.key,
  }));

  items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return json({
    items,
    nextCursor: listing.truncated ? listing.cursor : null,
  });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return json({ error: "Missing key" }, { status: 400 });
  }

  if (!key.startsWith("blog/")) {
    return json({ error: "Invalid key" }, { status: 400 });
  }

  await env.MEDIA_BUCKET.delete(key);
  return json({ ok: true });
};
