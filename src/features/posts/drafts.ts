import type { PostInput } from "./types";

export interface DraftPayload {
  mode: "create" | "edit";
  value: PostInput;
  sha: string;
  savedAt: string;
}

export function buildDraftStorageKey(mode: "create" | "edit", slug?: string) {
  return mode === "create" ? "blog-admin:draft:new" : `blog-admin:draft:${slug ?? "unknown"}`;
}

export function createDraftPayload(
  mode: "create" | "edit",
  value: PostInput,
  sha: string,
): DraftPayload {
  return {
    mode,
    value,
    sha,
    savedAt: new Date().toISOString(),
  };
}

export function saveDraft(storage: Storage, key: string, payload: DraftPayload) {
  storage.setItem(key, JSON.stringify(payload));
}

export function loadDraft(storage: Storage, key: string): DraftPayload | null {
  try {
    const raw = storage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DraftPayload;

    if (!parsed || typeof parsed !== "object" || !parsed.value) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(storage: Storage, key: string) {
  storage.removeItem(key);
}

export function hasDraftContent(value: PostInput) {
  return Boolean(
    value.title.trim() ||
      (value.slug ?? "").trim() ||
      value.description.trim() ||
      (value.cover ?? "").trim() ||
      value.body.trim() ||
      value.tags.length ||
      value.categories.length,
  );
}

export function isSamePostInput(left: PostInput, right: PostInput) {
  return JSON.stringify(left) === JSON.stringify(right);
}
