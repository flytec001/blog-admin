import { pinyin } from "pinyin-pro";

const CJK_RANGE = /[\u4e00-\u9fff]/;

function containsCJK(text: string): boolean {
  return CJK_RANGE.test(text);
}

export function slugify(input: string): string {
  const source = input.trim();
  if (!source) return "";

  const normalized = containsCJK(source)
    ? pinyin(source, { toneType: "none", nonZh: "consecutive", v: true })
    : source;

  return normalized
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
