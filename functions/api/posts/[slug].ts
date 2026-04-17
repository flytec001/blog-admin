import type { Env } from "../../_lib/env";
import { deleteContentFile, getContentFile, putContentFile } from "../../_lib/github";
import { json } from "../../_lib/response";
import {
  buildPostPath,
  parseDeleteInput,
  parseWriteInput,
  toErrorResponse,
  toMarkdown,
  toPostDetail,
} from "../../_lib/posts";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const path = buildPostPath(env.POSTS_DIR, params.slug);
    const file = await getContentFile(env, path);

    return json(toPostDetail(file.content, file.sha, path));
  } catch (error) {
    const mapped = toErrorResponse(error);
    return json({ error: mapped.message }, { status: mapped.status });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const input = parseWriteInput(await request.json());
    const path = buildPostPath(env.POSTS_DIR, params.slug);
    const markdown = toMarkdown(input, input.slug ?? params.slug);
    const saved = await putContentFile(env, path, markdown, input.sha);

    return json({
      ...input,
      slug: input.slug ?? params.slug,
      sha: saved.sha,
    });
  } catch (error) {
    const mapped = toErrorResponse(error);
    return json({ error: mapped.message }, { status: mapped.status });
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const input = parseDeleteInput(await request.json());
    const path = buildPostPath(env.POSTS_DIR, params.slug);
    const result = await deleteContentFile(env, path, input.sha);

    return json({
      ok: true,
      commitSha: result.commitSha,
    });
  } catch (error) {
    const mapped = toErrorResponse(error);
    return json({ error: mapped.message }, { status: mapped.status });
  }
};
