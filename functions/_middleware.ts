import type { Env } from "./_lib/env";
import { readSessionCookie, verifySession } from "./_lib/auth";
import { requireEnvValue } from "./_lib/env";
import { json } from "./_lib/response";

const PUBLIC_API_PATHS = new Set(["/api/healthz", "/api/auth/login"]);

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const pathname = new URL(request.url).pathname;

  if (!pathname.startsWith("/api/")) {
    return context.next();
  }

  if (PUBLIC_API_PATHS.has(pathname)) {
    return context.next();
  }

  const secret = requireEnvValue(env, "AUTH_SECRET");
  const token = readSessionCookie(request);
  const session = token ? await verifySession(secret, token) : null;

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return context.next();
};
