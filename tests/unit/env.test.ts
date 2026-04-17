import { describe, expect, it } from "vitest";
import { getAllowedEmails, getEnv } from "../../functions/_lib/env";

describe("env helpers", () => {
  it("returns trimmed allowlisted emails", () => {
    expect(getAllowedEmails(" a@example.com, b@example.com ")).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("throws when a required environment variable is missing", () => {
    expect(() =>
      getEnv({
        ALLOWED_EMAILS: "a@example.com",
        GITHUB_OWNER: "acme",
        GITHUB_REPO: "blog",
        GITHUB_BRANCH: "main",
        POSTS_DIR: "content/posts",
        R2_PUBLIC_BASE_URL: "https://cdn.example.com",
      }),
    ).toThrow("Missing required environment variable: GITHUB_TOKEN");
  });
});
