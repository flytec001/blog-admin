import { describe, expect, it } from "vitest";
import { getEnv, requireEnvValue } from "../../functions/_lib/env";

describe("env helpers", () => {
  it("throws when a required environment variable is missing", () => {
    expect(() =>
      getEnv({
        ADMIN_PASSWORD: "pw",
        AUTH_SECRET: "secret",
        GITHUB_OWNER: "acme",
        GITHUB_REPO: "blog",
        GITHUB_BRANCH: "main",
        POSTS_DIR: "content/posts",
        R2_PUBLIC_BASE_URL: "https://cdn.example.com",
      }),
    ).toThrow("Missing required environment variable: GITHUB_TOKEN");
  });

  it("returns the value when key is present", () => {
    expect(requireEnvValue({ AUTH_SECRET: "s" }, "AUTH_SECRET")).toBe("s");
  });
});
