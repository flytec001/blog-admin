import { getAllowedEmails } from "./env";

export function getAccessEmail(request: Request): string | null {
  return request.headers.get("Cf-Access-Authenticated-User-Email");
}

export function isLocalDevelopmentRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "127.0.0.1" || hostname === "localhost";
}

export function resolveAuthenticatedEmail(
  request: Request,
  devAccessEmail?: string,
): string | null {
  const accessEmail = getAccessEmail(request);

  if (accessEmail) {
    return accessEmail;
  }

  if (devAccessEmail && isLocalDevelopmentRequest(request)) {
    return devAccessEmail;
  }

  return null;
}

export function isAllowedEmail(email: string, allowlist: string): boolean {
  return getAllowedEmails(allowlist).includes(email);
}
