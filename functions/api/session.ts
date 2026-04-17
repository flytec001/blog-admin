import type { Env } from "../_lib/env";
import { resolveAuthenticatedEmail } from "../_lib/access";
import { json } from "../_lib/response";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const email = resolveAuthenticatedEmail(request, env.DEV_ACCESS_EMAIL);
  return json({ email });
};
