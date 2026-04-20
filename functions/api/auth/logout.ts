import type { Env } from "../../_lib/env";
import { buildClearCookie } from "../../_lib/auth";

export const onRequestPost: PagesFunction<Env> = async () => {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  headers.append("Set-Cookie", buildClearCookie());
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};
