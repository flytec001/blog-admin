import type { Env } from "../../_lib/env";
import { getContentFile, listContentDir, putContentFile } from "../../_lib/github";
import { HttpError } from "../../_lib/errors";
import { json } from "../../_lib/response";
import {
  buildPostPath,
  normalizeSlug,
  parseWriteInput,
  toErrorResponse,
  toMarkdown,
  toPostListItem,
} from "../../_lib/posts";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const entries = await listContentDir(env, env.POSTS_DIR);
    const files = entries.filter((entry) => entry.type === "file" && entry.name.endsWith(".md"));
    const posts = await Promise.all(
      files.map(async (entry) => {
        const file = await getContentFile(env, entry.path);
        try {
          return toPostListItem(file.content, entry.path);
        } catch {
          return null;
        }
      }),
    );

    const validPosts = posts.filter((item): item is NonNullable<typeof item> => Boolean(item));

    validPosts.sort((left, right) => right.date.localeCompare(left.date));

    return json(validPosts);
  } catch (error) {
    console.error("GET /api/posts failed", error);
    const mapped = toErrorResponse(error);
    return json({ error: mapped.message }, { status: mapped.status });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const input = parseWriteInput(await request.json());
    const slug = input.slug ?? normalizeSlug(input.title);
    const path = buildPostPath(env.POSTS_DIR, slug);

    try {
      await getContentFile(env, path);
      return json({ error: "Post already exists" }, { status: 409 });
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 404) {
        throw error;
      }
    }

    const markdown = toMarkdown(input, slug);
    const saved = await putContentFile(env, path, markdown);

    return json(
      {
        ...input,
        slug,
        sha: saved.sha,
      },
      { status: 201 },
    );
  } catch (error) {
    const mapped = toErrorResponse(error);
    return json({ error: mapped.message }, { status: mapped.status });
  }
};
