import DOMPurify from "dompurify";
import { marked } from "marked";

interface MarkdownPreviewProps {
  markdown: string;
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const source = markdown.trim() ? markdown : "_暂无正文预览_";
  const html = DOMPurify.sanitize(String(marked.parse(source)));

  return <article className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />;
}
