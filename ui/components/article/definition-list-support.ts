import { Fragment, type Node as ProseNode } from "@milkdown/prose/model";
import type {
  MarkdownNode,
  NodeParserSpec,
  NodeSerializerSpec,
  ParserState,
  SerializerState,
} from "@milkdown/transformer";
import { $nodeSchema, $remark } from "@milkdown/utils";
import remarkDefinitionList from "remark-definition-list";

/** Mirrors @milkdown/preset-commonmark serializeText (not exported from package root). */
function serializeInline(state: SerializerState, node: ProseNode) {
  const lastIsHardBreak =
    node.childCount >= 1 && node.lastChild?.type.name === "hardbreak";
  if (!lastIsHardBreak) {
    state.next(node.content);
    return;
  }
  const contentArr: ProseNode[] = [];
  node.content.forEach((n, _, i) => {
    if (i === node.childCount - 1) return;
    contentArr.push(n);
  });
  state.next(Fragment.fromArray(contentArr));
}

/**
 * PHP-Markdown / MDX-style definition lists:
 *
 * ```
 * Term
 * : Definition paragraph (can continue indented)
 *
 * Another term
 * : First def
 * : Second def
 * ```
 */
export const remarkDefListPlugin = $remark(
  "remarkDefinitionList",
  () => remarkDefinitionList,
);

const defListTermSpec = $nodeSchema("def_list_term", () => ({
  content: "inline*",
  group: "block",
  defining: true,
  parseDOM: [{ tag: "dt" }],
  toDOM: () => ["dt", { class: "md-def-term" }, 0] as const,
  parseMarkdown: {
    match: ({ type }) => type === "defListTerm",
    runner: (state: ParserState, node: MarkdownNode, type) => {
      state.openNode(type);
      if (node.children) state.next(node.children);
      else if (node.value != null) state.addText(String(node.value));
      state.closeNode();
    },
  } satisfies NodeParserSpec,
  toMarkdown: {
    match: (n) => n.type.name === "def_list_term",
    runner: (state: SerializerState, node: ProseNode) => {
      state.openNode("defListTerm");
      serializeInline(state, node);
      state.closeNode();
    },
  } satisfies NodeSerializerSpec,
}));

const defListDescriptionSpec = $nodeSchema("def_list_description", () => ({
  content: "paragraph block*",
  group: "block",
  defining: true,
  attrs: {
    spread: {
      default: false,
      validate: "boolean",
    },
  },
  parseDOM: [
    {
      tag: "dd",
      getAttrs: (dom) => ({
        spread: dom instanceof HTMLElement && dom.dataset.spread === "true",
      }),
    },
  ],
  toDOM: (node) => [
    "dd",
    {
      class: "md-def-desc",
      ...(node.attrs.spread ? { "data-spread": "true" } : {}),
    },
    0,
  ] as const,
  parseMarkdown: {
    match: ({ type }) => type === "defListDescription",
    runner: (state: ParserState, node: MarkdownNode, type) => {
      state.openNode(type, {
        spread: Boolean(
          (node as { spread?: boolean }).spread,
        ),
      });
      state.next(node.children);
      state.closeNode();
    },
  } satisfies NodeParserSpec,
  toMarkdown: {
    match: (n) => n.type.name === "def_list_description",
    runner: (state: SerializerState, node: ProseNode) => {
      state.openNode("defListDescription", undefined, {
        spread: node.attrs.spread as boolean,
      });
      state.next(node.content);
      state.closeNode();
    },
  } satisfies NodeSerializerSpec,
}));

const defListSpec = $nodeSchema("def_list", () => ({
  content: "(def_list_term def_list_description+)+",
  group: "block",
  defining: true,
  parseDOM: [{ tag: "dl.md-def-list" }, { tag: "dl" }],
  toDOM: () => ["dl", { class: "md-def-list" }, 0] as const,
  parseMarkdown: {
    match: ({ type }) => type === "defList",
    runner: (state: ParserState, node: MarkdownNode, type) => {
      state.openNode(type);
      state.next(node.children);
      state.closeNode();
    },
  } satisfies NodeParserSpec,
  toMarkdown: {
    match: (n) => n.type.name === "def_list",
    runner: (state: SerializerState, node: ProseNode) => {
      state.openNode("defList");
      state.next(node.content);
      state.closeNode();
    },
  } satisfies NodeSerializerSpec,
}));

export const definitionListSchemaPlugins = [
  defListTermSpec[0],
  defListTermSpec[1],
  defListDescriptionSpec[0],
  defListDescriptionSpec[1],
  defListSpec[0],
  defListSpec[1],
];
