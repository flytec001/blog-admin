import { describe, expect, it } from "vitest";
import {
  parseMarkdown,
  stringifyMarkdown,
  type PostMeta,
} from "../../functions/_lib/frontmatter";

describe("frontmatter helpers", () => {
  it("parses markdown into meta and body", () => {
    const source = `---
title: Hello
slug: hello
date: 2026-04-17T11:00:00+08:00
lastmod: 2026-04-17T11:30:00+08:00
draft: true
description: intro
tags:
  - hugo
categories:
  - notes
cover: https://cdn.example.com/hello.webp
---
Hello world
`;

    const parsed = parseMarkdown(source);

    expect(parsed.meta.title).toBe("Hello");
    expect(parsed.meta.tags).toEqual(["hugo"]);
    expect(parsed.meta.draft).toBe(true);
    expect(parsed.body).toBe("Hello world");
  });

  it("serializes meta and body into stable markdown", () => {
    const meta: PostMeta = {
      title: "Hello",
      slug: "hello",
      date: "2026-04-17T11:00:00+08:00",
      lastmod: "2026-04-17T11:30:00+08:00",
      draft: false,
      description: "intro",
      tags: ["hugo"],
      categories: ["notes"],
      cover: "https://cdn.example.com/hello.webp",
    };

    const first = stringifyMarkdown(meta, "Hello world");
    const second = stringifyMarkdown(meta, "Hello world");

    expect(first).toBe(second);
    expect(first).toContain("title: Hello");
    expect(first).toContain("draft: false");
    expect(first.endsWith("Hello world\n")).toBe(true);
  });

  it("parses legacy markdown with missing optional fields", () => {
    const source = `---
date: '2025-08-10'
draft: false
categories: ['LIFE']
title: Legacy Post
---
Legacy body
`;

    const parsed = parseMarkdown(source, {
      slug: "legacy-post",
    });

    expect(parsed.meta.slug).toBe("legacy-post");
    expect(parsed.meta.lastmod).toBe("2025-08-10");
    expect(parsed.meta.description).toBe("");
    expect(parsed.meta.tags).toEqual([]);
    expect(parsed.meta.categories).toEqual(["LIFE"]);
    expect(parsed.body).toBe("Legacy body");
  });
});
