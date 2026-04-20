import type { Env } from "../../_lib/env";
import { buildSessionCookie, signSession } from "../../_lib/auth";
import { requireEnvValue } from "../../_lib/env";
import { json } from "../../_lib/response";

interface LoginBody {
  password?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const expected = requireEnvValue(env, "ADMIN_PASSWORD");
  const secret = requireEnvValue(env, "AUTH_SECRET");

  if (password.length !== expected.length || password !== expected) {
    return json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await signSession(secret);
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  headers.append("Set-Cookie", buildSessionCookie(token));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};
