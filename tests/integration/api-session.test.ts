import { describe, expect, it } from "vitest";
import { onRequest as middleware } from "../../functions/_middleware";
import { onRequestGet as sessionHandler } from "../../functions/api/session";
import { onRequestPost as loginHandler } from "../../functions/api/auth/login";
import { signSession } from "../../functions/_lib/auth";

const BASE_ENV = {
  ADMIN_PASSWORD: "s3cret",
  AUTH_SECRET: "hmac-secret",
  GITHUB_OWNER: "acme",
  GITHUB_REPO: "blog",
  GITHUB_BRANCH: "main",
  POSTS_DIR: "content/posts",
  R2_PUBLIC_BASE_URL: "https://cdn.example.com",
  GITHUB_TOKEN: "t",
};

function middlewareContext(headers: HeadersInit = {}, url = "https://admin.example.com/api/session") {
  const request = new Request(url, { headers });
  return {
    request,
    env: BASE_ENV,
    next: () => sessionHandler({ request, env: BASE_ENV } as never),
  } as never;
}

describe("auth middleware + session", () => {
  it("blocks /api/session without cookie", async () => {
    const response = await middleware(middlewareContext());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("allows /api/session with a valid signed cookie", async () => {
    const token = await signSession(BASE_ENV.AUTH_SECRET);
    const response = await middleware(
      middlewareContext({ Cookie: `admin_session=${token}` }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
  });

  it("rejects cookies signed with a different secret", async () => {
    const token = await signSession("other-secret");
    const response = await middleware(
      middlewareContext({ Cookie: `admin_session=${token}` }),
    );
    expect(response.status).toBe(401);
  });
});

describe("POST /api/auth/login", () => {
  it("issues a session cookie on correct password", async () => {
    const request = new Request("https://admin.example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "s3cret" }),
    });
    const response = await loginHandler({ request, env: BASE_ENV } as never);
    expect(response.status).toBe(200);
    const cookie = response.headers.get("Set-Cookie") ?? "";
    expect(cookie).toMatch(/^admin_session=.+; Path=\/; HttpOnly; Secure; SameSite=Strict/);
  });

  it("returns 401 on wrong password", async () => {
    const request = new Request("https://admin.example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    const response = await loginHandler({ request, env: BASE_ENV } as never);
    expect(response.status).toBe(401);
  });
});
