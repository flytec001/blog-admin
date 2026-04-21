import {
  figureToShortcode,
  parseCompareShortcode,
  parseFigureShortcode,
  parseGalleryShortcode,
  parseShortcodeAttrs,
  compareToShortcode,
  galleryToShortcode,
  type FigureMarkup,
} from "./shortcodes";
import { EXCALIDRAW_CLASS } from "./extensions/ExcalidrawFigure";

function attrSafe(value: string | null | undefined): string {
  return String(value ?? "").replace(/"/g, "&quot;");
}

function figureMarkupToHtml(figure: FigureMarkup, extraClass?: string | null): string {
  const attrs = [
    'data-figure=""',
    figure.align ? `data-align="${attrSafe(figure.align)}"` : "",
    figure.size ? `data-size="${attrSafe(figure.size)}"` : "",
    extraClass ? `class="${attrSafe(extraClass)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const img = `<img src="${attrSafe(figure.src)}" alt="${attrSafe(figure.alt)}" />`;
  const caption = figure.caption
    ? `<figcaption>${figure.caption.replace(/</g, "&lt;")}</figcaption>`
    : "";
  return `<figure ${attrs}>${img}${caption}</figure>`;
}

function hasClassToken(raw: string, token: string): boolean {
  const match = raw.match(/^\{\{<\s*figure\s+([\s\S]*?)\s*>\}\}$/);
  if (!match) return false;
  const attrs = parseShortcodeAttrs(match[1]);
  return (attrs.class ?? "").split(/\s+/).includes(token);
}

const FIGURE_BLOCK = /^\s*\{\{<\s*figure\s+[\s\S]*?>\}\}\s*$/;
const GALLERY_BLOCK = /^\s*\{\{<\s*gallery[\s\S]*?\{\{<\s*\/gallery\s*>\}\}\s*$/;
const COMPARE_BLOCK = /^\s*\{\{<\s*imagecompare\s+[\s\S]*?\/?>\}\}\s*$/;

export function shortcodesToHtml(markdown: string): string {
  if (!markdown) return markdown;

  const blocks = markdown.split(/\n{2,}/);
  const transformed = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return block;

    if (FIGURE_BLOCK.test(trimmed)) {
      const parsed = parseFigureShortcode(trimmed);
      if (parsed) {
        const extraClass = hasClassToken(trimmed, EXCALIDRAW_CLASS) ? EXCALIDRAW_CLASS : null;
        return figureMarkupToHtml(parsed, extraClass);
      }
    }

    if (GALLERY_BLOCK.test(trimmed)) {
      const parsed = parseGalleryShortcode(trimmed);
      if (parsed) {
        const items = parsed.figures
          .map((figure) =>
            figureMarkupToHtml({
              src: figure.src,
              alt: figure.alt,
              caption: figure.caption,
              align: null,
              size: null,
            }),
          )
          .join("");
        return `<div data-gallery data-columns="${parsed.columns}">${items}</div>`;
      }
    }

    if (COMPARE_BLOCK.test(trimmed)) {
      const parsed = parseCompareShortcode(trimmed);
      if (parsed) {
        const attrs = [
          'data-compare=""',
          parsed.beforeLabel ? `data-before-label="${attrSafe(parsed.beforeLabel)}"` : "",
          parsed.afterLabel ? `data-after-label="${attrSafe(parsed.afterLabel)}"` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<div ${attrs}><img data-slot="before" src="${attrSafe(
          parsed.before,
        )}" /><img data-slot="after" src="${attrSafe(parsed.after)}" /></div>`;
      }
    }

    return block;
  });

  return transformed.join("\n\n");
}

export { figureToShortcode, galleryToShortcode, compareToShortcode };
