import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FigureView } from "../views/FigureView";
import { figureToShortcode } from "../shortcodes";

export type FigureAlign = "left" | "center" | "right" | "wide" | "full" | null;
export type FigureSize = "small" | "medium" | "large" | "full" | null;

export interface FigureAttributes {
  src: string;
  alt: string | null;
  caption: string | null;
  align: FigureAlign;
  size: FigureSize;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      insertFigure: (attrs: Partial<FigureAttributes>) => ReturnType;
      updateFigure: (attrs: Partial<FigureAttributes>) => ReturnType;
    };
  }
}

export const Figure = Node.create({
  name: "figure",
  group: "block",
  draggable: true,
  selectable: true,
  atom: false,
  isolating: true,

  addStorage() {
    return {
      markdown: {
        serialize: (
          state: { write: (text: string) => void; closeBlock: (node: unknown) => void },
          node: { attrs: FigureAttributes },
        ) => {
          const attrs = node.attrs;
          const hasRichAttrs = Boolean(attrs.caption || attrs.align || attrs.size);
          if (!hasRichAttrs) {
            state.write(`![${attrs.alt ?? ""}](${attrs.src})`);
            state.closeBlock(node);
            return;
          }
          state.write(
            figureToShortcode({
              src: attrs.src,
              alt: attrs.alt,
              caption: attrs.caption,
              align: attrs.align,
              size: attrs.size,
            }),
          );
          state.closeBlock(node);
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: null },
      caption: { default: null },
      align: { default: null },
      size: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-figure]",
        getAttrs: (element) => {
          const img = element.querySelector("img");
          const captionEl = element.querySelector("figcaption");
          return {
            src: img?.getAttribute("src") ?? "",
            alt: img?.getAttribute("alt"),
            caption: captionEl?.textContent ?? null,
            align: element.getAttribute("data-align"),
            size: element.getAttribute("data-size"),
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (element) => ({
          src: element.getAttribute("src") ?? "",
          alt: element.getAttribute("alt"),
          caption: null,
          align: null,
          size: null,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { src, alt, caption, align, size } = node.attrs as FigureAttributes;
    const figureAttrs = mergeAttributes(HTMLAttributes, {
      "data-figure": "",
      "data-align": align ?? null,
      "data-size": size ?? null,
      class: [
        "figure-node",
        align ? `is-align-${align}` : null,
        size ? `is-size-${size}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
    const imgAttrs = { src, alt: alt ?? "" };
    const figureChildren: unknown[] = [["img", imgAttrs]];
    if (caption) {
      figureChildren.push(["figcaption", {}, caption]);
    }
    return ["figure", figureAttrs, ...figureChildren] as unknown as [
      string,
      Record<string, unknown>,
      ...unknown[]
    ];
  },

  addCommands() {
    return {
      insertFigure:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: "",
              alt: null,
              caption: null,
              align: null,
              size: null,
              ...attrs,
            },
          });
        },
      updateFigure:
        (attrs) =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const node = selection.$from.node(selection.$from.depth);
          if (!node || node.type.name !== this.name) {
            const pos = findFigurePosition(state);
            if (pos === null) return false;
            if (dispatch) {
              const tr = state.tr.setNodeMarkup(pos, undefined, {
                ...state.doc.nodeAt(pos)?.attrs,
                ...attrs,
              });
              dispatch(tr);
            }
            return true;
          }
          if (dispatch) {
            const pos = selection.$from.before(selection.$from.depth);
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

function findFigurePosition(state: { doc: { descendants: Function } }): number | null {
  let found: number | null = null;
  (state.doc.descendants as (fn: (node: { type: { name: string } }, pos: number) => boolean) => void)(
    (node, pos) => {
      if (node.type.name === "figure" && found === null) {
        found = pos;
        return false;
      }
      return true;
    },
  );
  return found;
}
