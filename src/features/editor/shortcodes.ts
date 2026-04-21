export interface ShortcodeAttrs {
  [key: string]: string;
}

const CLASS_ALIGN_PREFIX = "align-";
const CLASS_SIZE_PREFIX = "size-";

export function parseShortcodeAttrs(raw: string): ShortcodeAttrs {
  const attrs: ShortcodeAttrs = {};
  const pattern = /([a-zA-Z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    const [, key, doubleQuoted, singleQuoted, bare] = match;
    attrs[key] = doubleQuoted ?? singleQuoted ?? bare ?? "";
  }
  return attrs;
}

export function buildShortcodeAttrs(attrs: ShortcodeAttrs): string {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}="${String(value).replace(/"/g, "&quot;")}"`)
    .join(" ");
}

export function classListToFigureAttrs(classAttr: string) {
  const tokens = classAttr.split(/\s+/).filter(Boolean);
  let align: string | null = null;
  let size: string | null = null;
  for (const token of tokens) {
    if (token.startsWith(CLASS_ALIGN_PREFIX)) align = token.slice(CLASS_ALIGN_PREFIX.length);
    else if (token.startsWith(CLASS_SIZE_PREFIX)) size = token.slice(CLASS_SIZE_PREFIX.length);
  }
  return { align, size };
}

export function figureAttrsToClass(
  align: string | null | undefined,
  size: string | null | undefined,
): string | null {
  const parts: string[] = [];
  if (align) parts.push(`${CLASS_ALIGN_PREFIX}${align}`);
  if (size) parts.push(`${CLASS_SIZE_PREFIX}${size}`);
  return parts.length > 0 ? parts.join(" ") : null;
}

export interface FigureMarkup {
  src: string;
  alt: string | null;
  caption: string | null;
  align: string | null;
  size: string | null;
}

export function figureToShortcode(figure: FigureMarkup): string {
  const attrs: ShortcodeAttrs = { src: figure.src };
  if (figure.alt) attrs.alt = figure.alt;
  if (figure.caption) attrs.caption = figure.caption;
  const cls = figureAttrsToClass(figure.align, figure.size);
  if (cls) attrs.class = cls;
  return `{{< figure ${buildShortcodeAttrs(attrs)} >}}`;
}

export function parseFigureShortcode(raw: string): FigureMarkup | null {
  const match = raw.match(/^\{\{<\s*figure\s+([\s\S]*?)\s*>\}\}$/);
  if (!match) return null;
  const attrs = parseShortcodeAttrs(match[1]);
  if (!attrs.src) return null;
  const { align, size } = classListToFigureAttrs(attrs.class ?? "");
  return {
    src: attrs.src,
    alt: attrs.alt ?? null,
    caption: attrs.caption ?? null,
    align,
    size,
  };
}

export interface GalleryMarkup {
  columns: number;
  figures: Array<Pick<FigureMarkup, "src" | "alt" | "caption">>;
}

export function galleryToShortcode(gallery: GalleryMarkup): string {
  const lines: string[] = [];
  lines.push(`{{< gallery columns="${gallery.columns}" >}}`);
  for (const figure of gallery.figures) {
    const attrs: ShortcodeAttrs = { src: figure.src };
    if (figure.alt) attrs.alt = figure.alt;
    if (figure.caption) attrs.caption = figure.caption;
    lines.push(`  {{< figure ${buildShortcodeAttrs(attrs)} >}}`);
  }
  lines.push(`{{< /gallery >}}`);
  return lines.join("\n");
}

export function parseGalleryShortcode(raw: string): GalleryMarkup | null {
  const match = raw.match(/^\{\{<\s*gallery([\s\S]*?)>\}\}([\s\S]*?)\{\{<\s*\/gallery\s*>\}\}$/);
  if (!match) return null;
  const attrs = parseShortcodeAttrs(match[1]);
  const columns = Number.parseInt(attrs.columns ?? "2", 10);
  const body = match[2];
  const figurePattern = /\{\{<\s*figure\s+([\s\S]*?)\s*>\}\}/g;
  const figures: GalleryMarkup["figures"] = [];
  let inner: RegExpExecArray | null;
  while ((inner = figurePattern.exec(body))) {
    const a = parseShortcodeAttrs(inner[1]);
    if (!a.src) continue;
    figures.push({ src: a.src, alt: a.alt ?? null, caption: a.caption ?? null });
  }
  return {
    columns: Number.isFinite(columns) ? Math.max(1, Math.min(4, columns)) : 2,
    figures,
  };
}

export interface CompareMarkup {
  before: string;
  after: string;
  beforeLabel: string | null;
  afterLabel: string | null;
}

export function compareToShortcode(compare: CompareMarkup): string {
  const attrs: ShortcodeAttrs = { before: compare.before, after: compare.after };
  if (compare.beforeLabel) attrs["before-label"] = compare.beforeLabel;
  if (compare.afterLabel) attrs["after-label"] = compare.afterLabel;
  return `{{< imagecompare ${buildShortcodeAttrs(attrs)} >}}`;
}

export function parseCompareShortcode(raw: string): CompareMarkup | null {
  const match = raw.match(/^\{\{<\s*imagecompare\s+([\s\S]*?)\s*\/?>\}\}$/);
  if (!match) return null;
  const attrs = parseShortcodeAttrs(match[1]);
  if (!attrs.before || !attrs.after) return null;
  return {
    before: attrs.before,
    after: attrs.after,
    beforeLabel: attrs["before-label"] ?? null,
    afterLabel: attrs["after-label"] ?? null,
  };
}
