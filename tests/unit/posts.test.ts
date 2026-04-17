import { describe, expect, it } from "vitest";
import { HttpError } from "../../functions/_lib/errors";
import {
  buildPostPath,
  normalizeSlug,
  toErrorResponse,
} from "../../functions/_lib/posts";

describe("post helpers", () => {
  it("normalizes title-like strings into slug format", () => {
    expect(normalizeSlug(" Hello, Hugo World! ")).toBe("hello-hugo-world");
  });

  it("builds markdown path under posts directory", () => {
    expect(buildPostPath("content/posts", "hello-world")).toBe(
      "content/posts/hello-world.md",
    );
  });

  it("maps upstream http errors into response status and message", () => {
    expect(toErrorResponse(new HttpError(404, "Not Found"))).toEqual({
      status: 404,
      message: "Post not found",
    });
  });
});
