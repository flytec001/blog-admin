import { describe, expect, it } from "vitest";
import { onRequest as middleware } from "../../functions/_middleware";
import { onRequestGet as sessionHandler } from "../../functions/api/session";

function createContext(
  headers: HeadersInit = {},
  options: { url?: string; env?: Record<string, string> } = {},
) {
  const request = new Request(options.url ?? "https://admin.example.com/api/session", {
    headers,
  });

  return {
    request,
    env: {
      ALLOWED_EMAILS: "allowed@example.com",
      ...(options.env ?? {}),
    },
    next: () =>
      sessionHandler({
        request,
        env: {
          ALLOWED_EMAILS: "allowed@example.com",
          ...(options.env ?? {}),
        },
      } as never),
  } as never;
}

describe("GET /api/session", () => {
  it("returns 401 without access email header", async () => {
    const response = await middleware(createContext());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("returns session when access email is allowed", async () => {
    const response = await middleware(
      createContext({
        "Cf-Access-Authenticated-User-Email": "allowed@example.com",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ email: "allowed@example.com" });
  });

  it("returns session for local dev when dev access email is configured", async () => {
    const response = await middleware(
      createContext(
        {},
        {
          url: "http://127.0.0.1:8788/api/session",
          env: {
            DEV_ACCESS_EMAIL: "allowed@example.com",
          },
        },
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ email: "allowed@example.com" });
  });

  it("still returns 401 on non-local host even if dev access email is configured", async () => {
    const response = await middleware(
      createContext(
        {},
        {
          env: {
            DEV_ACCESS_EMAIL: "allowed@example.com",
          },
        },
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });
});
