# Admin Density And Editor-First UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the admin UI into a denser, editor-first workspace, with the post editor giving most desktop space to writing while post list and media pages show more useful information per screen.

**Architecture:** Keep data flow and routes unchanged, and limit structural changes to `PostForm` plus small page-level header updates. Centralize most of the visual density work in `src/styles/global.css`, and add one regression test around the new desktop preview toggle so the editor-first behavior stays stable.

**Tech Stack:** React 19, React Router, Vite, Vitest, plain CSS, jsdom

---

### Task 1: Add a regression test for the new desktop editor/preview behavior

**Files:**
- Create: `tests/unit/post-form-layout.test.ts`
- Modify: `src/features/posts/components/PostForm.tsx`
- Test: `tests/unit/post-form-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/post-form-layout.test.ts` with module mocks for the heavy editor dependencies and a jsdom render helper:

```ts
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";

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
    await act(async () => root?.unmount());
    container?.remove();
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/post-form-layout.test.ts`

Expected: FAIL because `PostForm` does not yet expose a desktop preview toggle and still renders preview as a permanent second column.

- [ ] **Step 3: Write the minimal implementation to make the test pass**

Update `src/features/posts/components/PostForm.tsx` so desktop layout gets its own preview toggle state and preview becomes opt-in:

```tsx
const [desktopPreviewOpen, setDesktopPreviewOpen] = useState(false);

const desktopWorkspace = (
  <div className="editor-workspace">
    <section className="editor-main">
      <div className="editor-main-toolbar">
        <div className="view-switch" role="tablist" aria-label="桌面编辑视图">
          <button type="button" className="active">正文</button>
          <button
            type="button"
            data-preview-toggle="desktop"
            aria-pressed={desktopPreviewOpen}
            onClick={() => setDesktopPreviewOpen((open) => !open)}
          >
            {desktopPreviewOpen ? "收起预览" : "展开预览"}
          </button>
        </div>
      </div>

      {editorPane}

      {desktopPreviewOpen ? (
        <section className="preview-drawer">
          {previewPane}
        </section>
      ) : null}
    </section>

    <aside className="editor-sidecar">
      {metaFields}
    </aside>
  </div>
);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/post-form-layout.test.ts`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/post-form-layout.test.ts src/features/posts/components/PostForm.tsx
git commit -m "Add editor-first desktop preview toggle"
```

### Task 2: Recompose page structure for denser workspace headers and side rails

**Files:**
- Modify: `src/app/AppShell.tsx`
- Modify: `src/features/posts/pages/PostListPage.tsx`
- Modify: `src/features/posts/components/PostListTable.tsx`
- Modify: `src/features/media/pages/MediaLibraryPage.tsx`
- Modify: `src/features/posts/components/PostForm.tsx`
- Test: `pnpm build`

- [ ] **Step 1: Write the failing verification target**

The current verification target is the production build, because the layout changes span several route components and shared CSS hooks:

```bash
pnpm build
```

Expected before the page-structure edits: build still passes, but the UI has no compact metrics/header hooks and the editor metadata is still grouped like a form rather than a secondary rail.

- [ ] **Step 2: Add compact page metrics and denser structural hooks**

Update the route components so they expose compact, information-dense header content:

```tsx
// src/features/posts/pages/PostListPage.tsx
const publishedCount = items.filter((item) => !item.draft).length;
const draftCount = items.length - publishedCount;

<div className="panel-header panel-header-compact">
  <div className="page-heading">
    <h1>文章</h1>
    <p>筛选、扫描、快速进入编辑。</p>
  </div>
  <div className="page-metrics">
    <span className="metric-pill">总计 {items.length}</span>
    <span className="metric-pill">已发布 {publishedCount}</span>
    <span className="metric-pill">草稿 {draftCount}</span>
  </div>
  <Link className="primary-button" to="/posts/new">新建</Link>
</div>

// src/features/media/pages/MediaLibraryPage.tsx
<div className="panel-header panel-header-compact">
  <div className="page-heading">
    <h1>图床</h1>
    <p>上传、复制、预览、删除。</p>
  </div>
  <div className="page-metrics">
    <span className="metric-pill">当前 {items.length} 张</span>
    <span className="metric-pill">{hasMore ? "可继续加载" : "已到底"}</span>
  </div>
  <div className="row-actions">...</div>
</div>

// src/features/posts/components/PostListTable.tsx
<td data-label="标题" className="title-cell">...</td>
<td className="actions-cell compact-actions">...</td>
```

- [ ] **Step 3: Restructure `PostForm` around a main editor column and metadata side rail**

Move metadata out of the collapsible top block on desktop and into a compact side rail:

```tsx
const metaFields = (
  <section className="editor-meta-card">
    <div className="editor-meta-header">
      <h2>文章信息</h2>
      <button
        type="button"
        className={`status-badge ${value.draft ? "draft" : "published"} clickable`}
        onClick={() => setField("draft", !value.draft)}
      >
        {value.draft ? "草稿" : "已发布"}
      </button>
    </div>
    <div className="form-grid compact-form-grid">...</div>
  </section>
);

return (
  <form className="editor-form panel panel-editor" onSubmit={handleSubmit}>
    <div className="editor-topbar">...</div>
    {isDesktop ? desktopWorkspace : mobileWorkspace}
  </form>
);
```

- [ ] **Step 4: Run the production build to verify component composition still compiles**

Run: `pnpm build`

Expected: PASS with generated `dist/` output and no TypeScript/JSX compile errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/AppShell.tsx src/features/posts/pages/PostListPage.tsx src/features/posts/components/PostListTable.tsx src/features/media/pages/MediaLibraryPage.tsx src/features/posts/components/PostForm.tsx
git commit -m "Restructure admin pages for denser workspace layout"
```

### Task 3: Compress the visual system in `global.css` and verify the full app

**Files:**
- Modify: `src/styles/global.css`
- Test: `tests/unit/post-form-layout.test.ts`
- Test: `pnpm test`
- Test: `pnpm build`

- [ ] **Step 1: Write the failing visual target**

Use the existing desktop layout goals as the failure condition: the shell is still too wide, panel padding is too loose, editor height is too short, and media/list views still show presentation-heavy spacing.

```bash
pnpm test tests/unit/post-form-layout.test.ts
```

Expected: PASS, which means the structural editor behavior is stable and you can safely tighten styling without changing the contract.

- [ ] **Step 2: Update global density tokens and compact layout rules**

Tighten shared spacing and add the new compact classes:

```css
.app-shell {
  grid-template-columns: 220px minmax(0, 1fr);
}

.app-sidebar {
  padding: var(--space-5) var(--space-4);
}

.app-main {
  padding: var(--space-6);
}

.panel {
  max-width: 1440px;
  padding: var(--space-6);
  border-radius: var(--radius-md);
}

.panel-header-compact {
  align-items: center;
  margin-bottom: var(--space-4);
}

.page-metrics {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.metric-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 var(--space-3);
  border-radius: 999px;
  background: var(--bg-muted);
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.editor-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--space-4);
  min-height: 72vh;
}

.editor-main {
  display: grid;
  gap: var(--space-3);
  min-height: 0;
}

.editor-sidecar {
  display: grid;
  align-self: start;
  position: sticky;
  top: var(--space-6);
}

.rich-editor .ProseMirror {
  min-height: 68vh;
  padding: var(--space-5);
}

.preview-drawer {
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-raised);
}

.post-table th,
.post-table td {
  padding: 10px 12px;
}

.media-grid {
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: var(--space-3);
}

.media-card {
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 3: Add responsive fallbacks so density stays usable on mobile**

Preserve mobile behavior while preventing cramped layouts:

```css
@media (max-width: 959px) {
  .app-main {
    padding: var(--space-3);
  }

  .panel {
    padding: var(--space-4);
  }

  .editor-workspace {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .editor-sidecar {
    position: static;
  }

  .page-metrics {
    order: 3;
    width: 100%;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  }
}
```

- [ ] **Step 4: Run full verification**

Run:

```bash
pnpm test
pnpm build
```

Expected:

- `12 passed` test files with `68+` passing tests
- successful Vite build with generated assets in `dist/`

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css tests/unit/post-form-layout.test.ts src/features/posts/components/PostForm.tsx src/app/AppShell.tsx src/features/posts/pages/PostListPage.tsx src/features/posts/components/PostListTable.tsx src/features/media/pages/MediaLibraryPage.tsx
git commit -m "Polish dense editor-first admin UI"
```
