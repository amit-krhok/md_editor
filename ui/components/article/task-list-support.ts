import type { Ctx } from "@milkdown/kit/ctx";
import { listItemAttr, listItemSchema } from "@milkdown/kit/preset/commonmark";
import { expectDomTypeError } from "@milkdown/exception";
import type {
  DOMOutputSpec,
  Node as ProseNode,
  TagParseRule,
} from "@milkdown/prose/model";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import type {
  MarkdownNode,
  NodeParserSpec,
  NodeSerializerSpec,
  ParserState,
  SerializerState,
} from "@milkdown/transformer";
import { $prose } from "@milkdown/kit/utils";

type ListItemSchemaFn = (ctx: Ctx) => Record<string, unknown>;

/**
 * GFM task lists: `- [ ]` / `- [x]` via `listItem.checked` from remark-gfm + checkbox in the editor.
 */
export const taskListListItemExtension = listItemSchema.extendSchema(
  (base: ListItemSchemaFn) => (ctx: Ctx) => {
    const baseSpec = base(ctx) as {
      attrs: Record<string, unknown>;
      parseDOM: readonly TagParseRule[];
      toDOM: (node: ProseNode) => DOMOutputSpec;
      parseMarkdown: NodeParserSpec;
      toMarkdown: NodeSerializerSpec;
    };

    return {
      ...baseSpec,
      attrs: {
        ...baseSpec.attrs,
        checked: {
          default: null as boolean | null,
          validate: (v: unknown) => v === null || typeof v === "boolean",
        },
      },
      parseDOM: [
        {
          tag: "li[data-task-item]",
          priority: 60,
          getAttrs: (dom: unknown) => {
            if (!(dom instanceof HTMLElement)) throw expectDomTypeError(dom);
            const input = dom.querySelector(
              "input.task-list-item-checkbox,input[type=checkbox]",
            );
            const checked =
              input instanceof HTMLInputElement
                ? input.checked
                : dom.dataset.checked === "true";
            return {
              label: dom.dataset.label ?? "•",
              listType: dom.dataset.listType ?? "bullet",
              spread: dom.dataset.spread !== "false",
              checked,
            };
          },
        },
        /* Milkdown preset-gfm task `li` (no native checkbox) — paste / older serialized HTML. */
        {
          tag: 'li[data-item-type="task"]',
          priority: 59,
          getAttrs: (dom: unknown) => {
            if (!(dom instanceof HTMLElement)) throw expectDomTypeError(dom);
            const dc = dom.dataset.checked;
            const checked =
              dc === "true" ? true : dc === "false" ? false : null;
            return {
              label: dom.dataset.label ?? "•",
              listType: dom.dataset.listType ?? "bullet",
              spread: dom.dataset.spread !== "false",
              checked,
            };
          },
        },
        ...baseSpec.parseDOM,
      ],
      toDOM: (node: ProseNode): DOMOutputSpec => {
        const attrs = {
          ...ctx.get(listItemAttr.key)(node),
          "data-label": node.attrs.label,
          "data-list-type": node.attrs.listType,
          "data-spread": node.attrs.spread,
        } as Record<string, string | undefined>;
        const c = node.attrs.checked as boolean | null | undefined;
        if (c === true || c === false) {
          /* PM: the content hole `0` must be the only child in its parent spec; never sibling to the checkbox. */
          return [
            "li",
            {
              ...attrs,
              class: "task-list-item",
              "data-task-item": "true",
              "data-checked": String(c),
            },
            [
              "div",
              { class: "task-list-item-row" },
              [
                "input",
                {
                  type: "checkbox",
                  class: "task-list-item-checkbox",
                  contenteditable: "false",
                  ...(c ? { checked: "checked" } : {}),
                },
              ],
              ["div", { class: "task-list-item-content" }, 0],
            ],
          ] as DOMOutputSpec;
        }
        return baseSpec.toDOM(node) as DOMOutputSpec;
      },
      parseMarkdown: {
        match: ({ type }) => type === "listItem",
        runner: (state: ParserState, node: MarkdownNode, type) => {
          if (node.checked == null) {
            baseSpec.parseMarkdown.runner(state, node, type);
            return;
          }
          const label = node.label != null ? `${node.label}.` : "•";
          const listType = node.label != null ? "ordered" : "bullet";
          const spread =
            node.spread != null ? `${node.spread}` : "true";
          const checked = Boolean(node.checked);
          state.openNode(type, {
            label,
            listType,
            spread,
            checked,
          });
          state.next(node.children);
          state.closeNode();
        },
      },
      toMarkdown: {
        match: (node) => node.type.name === "list_item",
        runner: (state: SerializerState, node: ProseNode) => {
          const checked = node.attrs.checked as boolean | null | undefined;
          if (checked !== true && checked !== false) {
            baseSpec.toMarkdown.runner(state, node);
            return;
          }
          const label = node.attrs.label as string;
          const listType = node.attrs.listType as string;
          const spread = node.attrs.spread as boolean;
          state.openNode("listItem", undefined, {
            label,
            listType,
            spread,
            checked,
          });
          state.next(node.content);
          state.closeNode();
        },
      },
    };
  },
);

const taskToggleKey = new PluginKey("articleTaskListToggle");

export const taskListTogglePlugin = $prose(() => {
  return new Plugin({
    key: taskToggleKey,
    props: {
      handleDOMEvents: {
        mousedown(view, event) {
          const t = event.target;
          if (!(t instanceof HTMLElement)) return false;
          if (
            !t.matches(
              "li.task-list-item input.task-list-item-checkbox, li.task-list-item input[type=checkbox]",
            )
          ) {
            return false;
          }
          event.preventDefault();
          return toggleTaskListItem(view, event.clientX, event.clientY);
        },
      },
    },
  });
});

function toggleTaskListItem(
  view: EditorView,
  clientX: number,
  clientY: number,
): boolean {
  const hit = view.posAtCoords({ left: clientX, top: clientY });
  if (hit == null) return false;
  const $pos = view.state.doc.resolve(hit.pos);
  for (let d = $pos.depth; d > 0; d--) {
    const n = $pos.node(d);
    if (n.type.name !== "list_item") continue;
    const c = n.attrs.checked as boolean | null | undefined;
    if (c !== true && c !== false) return false;
    const start = $pos.before(d);
    view.dispatch(
      view.state.tr.setNodeMarkup(start, undefined, {
        ...n.attrs,
        checked: !c,
      }),
    );
    return true;
  }
  return false;
}
