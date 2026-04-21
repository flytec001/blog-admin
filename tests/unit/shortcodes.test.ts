import { describe, expect, it } from "vitest";
import {
  buildShortcodeAttrs,
  classListToFigureAttrs,
  compareToShortcode,
  figureAttrsToClass,
  figureToShortcode,
  galleryToShortcode,
  parseCompareShortcode,
  parseFigureShortcode,
  parseGalleryShortcode,
  parseShortcodeAttrs,
} from "../../src/features/editor/shortcodes";

describe("parseShortcodeAttrs", () => {
  it("parses double-quoted attrs", () => {
    expect(parseShortcodeAttrs('src="a.jpg" alt="hello"')).toEqual({
      src: "a.jpg",
      alt: "hello",
    });
  });

  it("parses single-quoted attrs", () => {
    expect(parseShortcodeAttrs("src='a.jpg'")).toEqual({ src: "a.jpg" });
  });

  it("parses attrs with spaces in values", () => {
    expect(parseShortcodeAttrs('caption="a long caption with spaces"')).toEqual({
      caption: "a long caption with spaces",
    });
  });
});

describe("buildShortcodeAttrs", () => {
  it("builds attr string", () => {
    expect(buildShortcodeAttrs({ src: "a.jpg", alt: "x" })).toBe('src="a.jpg" alt="x"');
  });

  it("escapes embedded quotes", () => {
    expect(buildShortcodeAttrs({ caption: 'he said "hi"' })).toBe(
      'caption="he said &quot;hi&quot;"',
    );
  });

  it("drops empty values", () => {
    expect(buildShortcodeAttrs({ src: "a.jpg", caption: "" })).toBe('src="a.jpg"');
  });
});

describe("classListToFigureAttrs", () => {
  it("extracts align and size", () => {
    expect(classListToFigureAttrs("align-center size-medium")).toEqual({
      align: "center",
      size: "medium",
    });
  });

  it("returns null for missing", () => {
    expect(classListToFigureAttrs("other-class")).toEqual({ align: null, size: null });
  });
});

describe("figureAttrsToClass", () => {
  it("builds class string", () => {
    expect(figureAttrsToClass("center", "medium")).toBe("align-center size-medium");
  });

  it("returns null when empty", () => {
    expect(figureAttrsToClass(null, null)).toBeNull();
  });
});

describe("figure shortcode round-trip", () => {
  it("serialises full figure", () => {
    expect(
      figureToShortcode({
        src: "a.jpg",
        alt: "hi",
        caption: "cap",
        align: "center",
        size: "medium",
      }),
    ).toBe(
      '{{< figure src="a.jpg" alt="hi" caption="cap" class="align-center size-medium" >}}',
    );
  });

  it("parses figure back", () => {
    expect(
      parseFigureShortcode(
        '{{< figure src="a.jpg" alt="hi" caption="cap" class="align-center size-medium" >}}',
      ),
    ).toEqual({
      src: "a.jpg",
      alt: "hi",
      caption: "cap",
      align: "center",
      size: "medium",
    });
  });

  it("parses figure without class", () => {
    expect(parseFigureShortcode('{{< figure src="a.jpg" >}}')).toEqual({
      src: "a.jpg",
      alt: null,
      caption: null,
      align: null,
      size: null,
    });
  });

  it("returns null for missing src", () => {
    expect(parseFigureShortcode('{{< figure alt="x" >}}')).toBeNull();
  });
});

describe("gallery round-trip", () => {
  it("serialises and parses a gallery", () => {
    const input = {
      columns: 3,
      figures: [
        { src: "a.jpg", alt: "A", caption: null },
        { src: "b.jpg", alt: null, caption: "with cap" },
      ],
    };
    const text = galleryToShortcode(input);
    expect(text).toContain('columns="3"');
    const parsed = parseGalleryShortcode(text);
    expect(parsed).toEqual(input);
  });

  it("defaults columns to 2 if missing", () => {
    const text = `{{< gallery >}}\n  {{< figure src="a.jpg" >}}\n{{< /gallery >}}`;
    expect(parseGalleryShortcode(text)).toEqual({
      columns: 2,
      figures: [{ src: "a.jpg", alt: null, caption: null }],
    });
  });
});

describe("compare round-trip", () => {
  it("serialises compare", () => {
    expect(
      compareToShortcode({
        before: "b.jpg",
        after: "a.jpg",
        beforeLabel: "Before",
        afterLabel: "After",
      }),
    ).toBe(
      '{{< imagecompare before="b.jpg" after="a.jpg" before-label="Before" after-label="After" >}}',
    );
  });

  it("parses compare back", () => {
    expect(
      parseCompareShortcode('{{< imagecompare before="b.jpg" after="a.jpg" >}}'),
    ).toEqual({
      before: "b.jpg",
      after: "a.jpg",
      beforeLabel: null,
      afterLabel: null,
    });
  });

  it("returns null when missing required", () => {
    expect(parseCompareShortcode('{{< imagecompare before="b.jpg" >}}')).toBeNull();
  });
});
