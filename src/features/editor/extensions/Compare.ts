import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CompareView } from "../views/CompareView";
import { compareToShortcode } from "../shortcodes";

export interface CompareAttributes {
  before: string;
  after: string;
  beforeLabel: string | null;
  afterLabel: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    compare: {
      insertCompare: (attrs: Partial<CompareAttributes>) => ReturnType;
      updateCompare: (attrs: Partial<CompareAttributes>) => ReturnType;
    };
  }
}

export const Compare = Node.create({
  name: "compare",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      before: {
        default: "",
        parseHTML: (element) =>
          (element as HTMLElement).querySelector('img[data-slot="before"]')?.getAttribute("src") ?? "",
        renderHTML: () => ({}),
      },
      after: {
        default: "",
        parseHTML: (element) =>
          (element as HTMLElement).querySelector('img[data-slot="after"]')?.getAttribute("src") ?? "",
        renderHTML: () => ({}),
      },
      beforeLabel: {
        default: null,
        parseHTML: (element) => (element as HTMLElement).getAttribute("data-before-label"),
        renderHTML: (attrs) =>
          attrs.beforeLabel ? { "data-before-label": attrs.beforeLabel } : {},
      },
      afterLabel: {
        default: null,
        parseHTML: (element) => (element as HTMLElement).getAttribute("data-after-label"),
        renderHTML: (attrs) =>
          attrs.afterLabel ? { "data-after-label": attrs.afterLabel } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-compare]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as CompareAttributes;
    const wrapper = mergeAttributes(HTMLAttributes, {
      "data-compare": "",
      class: "compare-node",
    });
    const children: unknown[] = [
      ["img", { "data-slot": "before", src: attrs.before }],
      ["img", { "data-slot": "after", src: attrs.after }],
    ];
    return ["div", wrapper, ...children] as unknown as [
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
          node: { attrs: CompareAttributes },
        ) => {
          const attrs = node.attrs;
          if (!attrs.before || !attrs.after) {
            state.closeBlock(node);
            return;
          }
          state.write(compareToShortcode(attrs));
          state.closeBlock(node);
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CompareView);
  },

  addCommands() {
    return {
      insertCompare:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              before: attrs.before ?? "",
              after: attrs.after ?? "",
              beforeLabel: attrs.beforeLabel ?? null,
              afterLabel: attrs.afterLabel ?? null,
            },
          });
        },
      updateCompare:
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
