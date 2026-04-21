import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { GalleryView } from "../views/GalleryView";
import { galleryToShortcode } from "../shortcodes";

export interface GalleryItem {
  src: string;
  alt: string | null;
  caption: string | null;
}

export interface GalleryAttributes {
  columns: number;
  items: GalleryItem[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    gallery: {
      insertGallery: (attrs: Partial<GalleryAttributes>) => ReturnType;
      updateGallery: (attrs: Partial<GalleryAttributes>) => ReturnType;
    };
  }
}

function parseItems(element: HTMLElement): GalleryItem[] {
  const figures = Array.from(element.querySelectorAll("figure"));
  if (figures.length > 0) {
    return figures.map((figure) => ({
      src: figure.querySelector("img")?.getAttribute("src") ?? "",
      alt: figure.querySelector("img")?.getAttribute("alt") ?? null,
      caption: figure.querySelector("figcaption")?.textContent ?? null,
    }));
  }
  return Array.from(element.querySelectorAll("img")).map((img) => ({
    src: img.getAttribute("src") ?? "",
    alt: img.getAttribute("alt") ?? null,
    caption: null,
  }));
}

export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-columns");
          const n = raw ? Number.parseInt(raw, 10) : 2;
          return Number.isFinite(n) ? Math.min(4, Math.max(1, n)) : 2;
        },
        renderHTML: (attrs) => ({ "data-columns": String(attrs.columns ?? 2) }),
      },
      items: {
        default: [],
        parseHTML: (element) => parseItems(element as HTMLElement),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-gallery]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as GalleryAttributes;
    const wrapper = mergeAttributes(HTMLAttributes, {
      "data-gallery": "",
      "data-columns": String(attrs.columns ?? 2),
      class: "gallery-node",
    });
    const figures = attrs.items.map((item) => {
      const figureAttrs: Record<string, string> = {};
      const imgAttrs: Record<string, string> = { src: item.src };
      if (item.alt) imgAttrs.alt = item.alt;
      const children: unknown[] = [["img", imgAttrs]];
      if (item.caption) children.push(["figcaption", {}, item.caption]);
      return ["figure", figureAttrs, ...children];
    });
    return ["div", wrapper, ...figures] as unknown as [
      string,
      Record<string, unknown>,
      ...unknown[]
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize: (
          state: { write: (text: string) => void; closeBlock: (node: unknown) => void },
          node: { attrs: GalleryAttributes },
        ) => {
          const attrs = node.attrs;
          if (!attrs.items || attrs.items.length === 0) {
            state.closeBlock(node);
            return;
          }
          state.write(
            galleryToShortcode({
              columns: attrs.columns,
              figures: attrs.items.map((item) => ({
                src: item.src,
                alt: item.alt,
                caption: item.caption,
              })),
            }),
          );
          state.closeBlock(node);
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryView);
  },

  addCommands() {
    return {
      insertGallery:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              columns: attrs.columns ?? 2,
              items: attrs.items ?? [],
            },
          });
        },
      updateGallery:
        (attrs) =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const pos = selection.$from.before(selection.$from.depth);
          const node = state.doc.nodeAt(pos);
          if (!node || node.type.name !== this.name) return false;
          if (dispatch) {
            const tr = state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              ...attrs,
            });
            dispatch(tr);
          }
          return true;
        },
    };
  },
});
