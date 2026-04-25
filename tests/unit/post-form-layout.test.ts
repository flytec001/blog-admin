import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

vi.mock("../../src/features/editor/RichEditor", () => ({
  RichEditor: ({ value }: { value: string }) =>
    React.createElement("div", { "data-testid": "rich-editor" }, value || "editor"),
}));

vi.mock("../../src/features/uploads/ImageUploader", () => ({
  ImageUploader: () =>
    React.createElement("button", { type: "button" }, "mock upload"),
}));

vi.mock("../../src/features/posts/components/MarkdownPreview", () => ({
  MarkdownPreview: ({ markdown }: { markdown: string }) =>
    React.createElement("div", { "data-testid": "markdown-preview" }, markdown || "preview"),
}));

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(min-width: 960px)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("PostForm desktop layout", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    if (root) {
      await act(async () => root.unmount());
    }
    container?.remove();
    vi.restoreAllMocks();
  });

  it("keeps preview collapsed on desktop until toggled open", async () => {
    installMatchMedia(true);
    const { PostForm } = await import("../../src/features/posts/components/PostForm");

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(PostForm, {
          mode: "edit",
          value: {
            title: "Dense UI",
            slug: "dense-ui",
            date: "2026-04-25T19:00:00+08:00",
            draft: true,
            description: "desc",
            tags: ["ui"],
            categories: ["admin"],
            cover: "",
            body: "# Hello",
          },
          isSubmitting: false,
          error: "",
          success: "",
          draftStatus: "",
          onChange: vi.fn(),
          onSubmit: vi.fn(),
          onDelete: vi.fn(),
        }),
      );
    });

    expect(container.querySelector("[data-testid='rich-editor']")).not.toBeNull();
    expect(container.querySelector("[data-testid='markdown-preview']")).toBeNull();

    const previewButton = container.querySelector(
      "button[data-preview-toggle='desktop']",
    ) as HTMLButtonElement | null;
    expect(previewButton).not.toBeNull();

    await act(async () => {
      previewButton?.click();
    });

    expect(container.querySelector("[data-testid='markdown-preview']")).not.toBeNull();
  });
});
