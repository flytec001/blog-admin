import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteContentFile,
  getContentFile,
  putContentFile,
} from "../../functions/_lib/github";

const env = {
  GITHUB_OWNER: "acme",
  GITHUB_REPO: "blog",
  GITHUB_BRANCH: "main",
  GITHUB_TOKEN: "secret",
};

describe("github adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gets file content from github contents api", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: Buffer.from("hello").toString("base64"),
          sha: "abc123",
          path: "content/posts/hello.md",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await getContentFile(env as never, "content/posts/hello.md");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.content).toBe("hello");
    expect(result.sha).toBe("abc123");
  });

  it("puts file content to github contents api", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ content: { sha: "newsha" } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await putContentFile(
      env as never,
      "content/posts/hello.md",
      "hello",
      "oldsha",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.sha).toBe("newsha");
  });

  it("deletes file through github contents api", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ commit: { sha: "deadbeef" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await deleteContentFile(
      env as never,
      "content/posts/hello.md",
      "abc123",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.commitSha).toBe("deadbeef");
  });
});
