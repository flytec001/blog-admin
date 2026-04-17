import { afterEach, describe, expect, it, vi } from "vitest";
import {
  onRequestGet as getPosts,
  onRequestPost as createPost,
} from "../../functions/api/posts/index";
import {
  onRequestDelete as deletePost,
  onRequestGet as getPost,
  onRequestPut as updatePost,
} from "../../functions/api/posts/[slug]";

const env = {
  ALLOWED_EMAILS: "allowed@example.com",
  GITHUB_OWNER: "acme",
  GITHUB_REPO: "blog",
  GITHUB_BRANCH: "main",
  POSTS_DIR: "content/posts",
  R2_PUBLIC_BASE_URL: "https://cdn.example.com",
  GITHUB_TOKEN: "secret",
};

function encodeMarkdown(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function createRequest(url: string, method = "GET", body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function indexContext(request: Request) {
  return { request, env } as never;
}

function detailContext(request: Request, slug: string) {
  return { request, env, params: { slug } } as never;
}

describe("/api/posts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists posts from the configured posts directory", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              type: "file",
              path: "content/posts/hello.md",
              name: "hello.md",
            },
            {
              type: "file",
              path: "content/posts/readme.md",
              name: "readme.md",
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: encodeMarkdown(`---
date: '2026-04-17'
draft: false
categories: ['notes']
title: Hello
---
Hello world
`),
            sha: "sha-1",
            path: "content/posts/hello.md",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: encodeMarkdown(`# README\n`),
            sha: "sha-2",
            path: "content/posts/readme.md",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const response = await getPosts(indexContext(createRequest("https://admin.example.com/api/posts")));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([
      {
        title: "Hello",
        slug: "hello",
        date: "2026-04-17",
        lastmod: "2026-04-17",
        draft: false,
        description: "",
      },
    ]);
  });

  it("creates a new markdown file under content/posts/<slug>.md", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not Found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ content: { sha: "newsha" } }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );

    const response = await createPost(
      indexContext(
        createRequest("https://admin.example.com/api/posts", "POST", {
          title: "Hello World",
          date: "2026-04-17T11:00:00+08:00",
          draft: true,
          description: "intro",
          tags: ["hugo"],
          categories: ["notes"],
          body: "Hello world",
        }),
      ),
    );
    const payload = await response.json();
    const [, putCall] = fetchMock.mock.calls;

    expect(response.status).toBe(201);
    expect(payload.slug).toBe("hello-world");
    expect(String(putCall[0])).toContain("content/posts/hello-world.md");
  });

  it("rejects duplicate slug with 409", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: encodeMarkdown(`---
title: Hello World
slug: hello-world
date: 2026-04-17T11:00:00+08:00
lastmod: 2026-04-17T11:00:00+08:00
draft: true
description: intro
tags: []
categories: []
---
Hello world
`),
          sha: "exists",
          path: "content/posts/hello-world.md",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const response = await createPost(
      indexContext(
        createRequest("https://admin.example.com/api/posts", "POST", {
          title: "Hello World",
          date: "2026-04-17T11:00:00+08:00",
          draft: true,
          description: "intro",
          tags: [],
          categories: [],
          body: "Hello world",
        }),
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toEqual({ error: "Post already exists" });
  });

  it("gets one post with current sha", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: encodeMarkdown(`---
title: Hello
slug: hello
date: 2026-04-17T11:00:00+08:00
lastmod: 2026-04-17T11:30:00+08:00
draft: false
description: intro
tags:
  - hugo
categories:
  - notes
---
Hello world
`),
          sha: "sha-1",
          path: "content/posts/hello.md",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const response = await getPost(
      detailContext(createRequest("https://admin.example.com/api/posts/hello"), "hello"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.slug).toBe("hello");
    expect(payload.sha).toBe("sha-1");
    expect(payload.body).toBe("Hello world");
  });

  it("updates a post with optimistic concurrency via sha", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ content: { sha: "sha-2" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await updatePost(
      detailContext(
        createRequest("https://admin.example.com/api/posts/hello", "PUT", {
          title: "Hello",
          slug: "hello",
          date: "2026-04-17T11:00:00+08:00",
          draft: false,
          description: "intro",
          tags: ["hugo"],
          categories: ["notes"],
          body: "Updated body",
          sha: "sha-1",
        }),
        "hello",
      ),
    );
    const payload = await response.json();
    const [call] = fetchMock.mock.calls;

    expect(response.status).toBe(200);
    expect(payload.sha).toBe("sha-2");
    expect(String(call[0])).toContain("content/posts/hello.md");
  });

  it("deletes a post with provided sha", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ commit: { sha: "commit-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await deletePost(
      detailContext(
        createRequest("https://admin.example.com/api/posts/hello", "DELETE", {
          sha: "sha-1",
        }),
        "hello",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, commitSha: "commit-1" });
  });
});
