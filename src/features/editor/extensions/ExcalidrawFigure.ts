import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ExcalidrawFigureView } from "../views/ExcalidrawFigureView";
import { buildShortcodeAttrs } from "../shortcodes";

export const EXCALIDRAW_CLASS = "excalidraw";

export interface ExcalidrawFigureAttributes {
  src: string;
  alt: string | null;
  caption: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    excalidrawFigure: {
      insertExcalidrawFigure: (attrs: Partial<ExcalidrawFigureAttributes>) => ReturnType;
      updateExcalidrawFigure: (attrs: Partial<ExcalidrawFigureAttributes>) => ReturnType;
    };
  }
}

function includesExcalidrawClass(classAttr: string | null): boolean {
  if (!classAttr) return false;
  return classAttr.split(/\s+/).includes(EXCALIDRAW_CLASS);
}

export const ExcalidrawFigure = Node.create({
  name: "excalidrawFigure",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: null },
      caption: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-figure]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          if (!includesExcalidrawClass(el.getAttribute("class"))) return false;
          const img = el.querySelector("img");
          const captionEl = el.querySelector("figcaption");
          return {
            src: img?.getAttribute("src") ?? "",
            alt: img?.getAttribute("alt") ?? null,
            caption: captionEl?.textContent ?? null,
          };
        },
        priority: 60,
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as ExcalidrawFigureAttributes;
    const figureAttrs = mergeAttributes(HTMLAttributes, {
      "data-figure": "",
      class: `figure-node ${EXCALIDRAW_CLASS}`,
    });
    const imgAttrs: Record<string, string> = { src: attrs.src };
    if (attrs.alt) imgAttrs.alt = attrs.alt;
    const children: unknown[] = [["img", imgAttrs]];
    if (attrs.caption) children.push(["figcaption", {}, attrs.caption]);
    return ["figure", figureAttrs, ...children] as unknown as [
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
          node: { attrs: ExcalidrawFigureAttributes },
        ) => {
          const attrs = node.attrs;
          const payload: Record<string, string> = {
            src: attrs.src,
            class: EXCALIDRAW_CLASS,
          };
          if (attrs.alt) payload.alt = attrs.alt;
          if (attrs.caption) payload.caption = attrs.caption;
          state.write(`{{< figure ${buildShortcodeAttrs(payload)} >}}`);
          state.closeBlock(node);
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawFigureView);
  },

  addCommands() {
    return {
      insertExcalidrawFigure:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src ?? "",
              alt: attrs.alt ?? null,
              caption: attrs.caption ?? null,
            },
          });
        },
      updateExcalidrawFigure:
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
