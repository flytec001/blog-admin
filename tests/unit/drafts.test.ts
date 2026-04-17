import { describe, expect, it, vi } from "vitest";
import {
  buildDraftStorageKey,
  clearDraft,
  createDraftPayload,
  loadDraft,
  saveDraft,
} from "../../src/features/posts/drafts";

const sampleValue = {
  title: "Hello",
  slug: "hello",
  date: "2026-04-17T11:00:00+08:00",
  draft: true,
  description: "intro",
  tags: ["hugo"],
  categories: ["notes"],
  cover: "",
  body: "Hello world",
};

describe("draft helpers", () => {
  it("builds stable storage key for create and edit mode", () => {
    expect(buildDraftStorageKey("create")).toBe("blog-admin:draft:new");
    expect(buildDraftStorageKey("edit", "hello")).toBe("blog-admin:draft:hello");
  });

  it("saves and loads draft payload from storage", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const payload = createDraftPayload("create", sampleValue, "");

    saveDraft(storage as never, buildDraftStorageKey("create"), payload);

    expect(storage.setItem).toHaveBeenCalledOnce();
    const savedJson = storage.setItem.mock.calls[0][1];
    storage.getItem.mockReturnValue(savedJson);

    expect(loadDraft(storage as never, buildDraftStorageKey("create"))).toEqual(payload);
  });

  it("clears stored draft", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    clearDraft(storage as never, buildDraftStorageKey("create"));

    expect(storage.removeItem).toHaveBeenCalledWith("blog-admin:draft:new");
  });
});
