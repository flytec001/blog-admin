import { describe, expect, it } from "vitest";
import { extractReferencedKeys } from "../../functions/api/media/orphans";

const BASE = "https://cdn.example.com";

describe("extractReferencedKeys", () => {
  it("handles markdown image syntax", () => {
    const md = `hello ![](${BASE}/blog/2026/04/a.jpg) world`;
    expect(extractReferencedKeys(md, BASE)).toEqual(new Set(["blog/2026/04/a.jpg"]));
  });

  it("handles HTML img tags", () => {
    const md = `<img src="${BASE}/blog/2026/04/b.png" alt="x" />`;
    expect(extractReferencedKeys(md, BASE)).toEqual(new Set(["blog/2026/04/b.png"]));
  });

  it("handles Hugo figure shortcode with quotes", () => {
    const md = `{{< figure src="${BASE}/blog/2026/04/c.webp" >}}`;
    expect(extractReferencedKeys(md, BASE)).toEqual(new Set(["blog/2026/04/c.webp"]));
  });

  it("handles front matter cover field", () => {
    const md = `---
cover: ${BASE}/blog/2026/04/d.jpg
---
body`;
    expect(extractReferencedKeys(md, BASE)).toEqual(new Set(["blog/2026/04/d.jpg"]));
  });

  it("deduplicates repeated references", () => {
    const md = `![](${BASE}/blog/a.jpg) again ![](${BASE}/blog/a.jpg)`;
    expect(extractReferencedKeys(md, BASE)).toEqual(new Set(["blog/a.jpg"]));
  });

  it("strips query and fragment from urls", () => {
    const md = `![](${BASE}/blog/a.jpg?v=2#part)`;
    expect(extractReferencedKeys(md, BASE)).toEqual(new Set(["blog/a.jpg"]));
  });

  it("ignores urls outside the base", () => {
    const md = `![](https://other.example.com/x.jpg) ![](${BASE}/blog/z.jpg)`;
    expect(extractReferencedKeys(md, BASE)).toEqual(new Set(["blog/z.jpg"]));
  });

  it("handles trailing base slash", () => {
    expect(
      extractReferencedKeys(`![](${BASE}/blog/a.jpg)`, `${BASE}/`),
    ).toEqual(new Set(["blog/a.jpg"]));
  });

  it("returns empty set for empty base", () => {
    expect(extractReferencedKeys(`![](${BASE}/blog/a.jpg)`, "")).toEqual(new Set());
  });
});
