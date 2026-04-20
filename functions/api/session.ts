import type { Env } from "../_lib/env";
import { readSessionCookie, verifySession } from "../_lib/auth";
import { requireEnvValue } from "../_lib/env";
import { json } from "../_lib/response";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const secret = requireEnvValue(env, "AUTH_SECRET");
  const token = readSessionCookie(request);
  const session = token ? await verifySession(secret, token) : null;
  return json({ authenticated: Boolean(session) });
};
