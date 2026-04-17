import type { Env } from "./_lib/env";
import { isAllowedEmail, resolveAuthenticatedEmail } from "./_lib/access";
import { requireEnvValue } from "./_lib/env";
import { json } from "./_lib/response";

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const pathname = new URL(request.url).pathname;

  if (pathname === "/api/healthz") {
    return context.next();
  }

  if (!pathname.startsWith("/api/")) {
    return context.next();
  }

  const allowedEmails = requireEnvValue(env, "ALLOWED_EMAILS");
  const email = resolveAuthenticatedEmail(request, env.DEV_ACCESS_EMAIL);

  if (!email || !isAllowedEmail(email, allowedEmails)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return context.next();
};
