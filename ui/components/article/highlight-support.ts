import { markRule } from "@milkdown/kit/prose";
import { $inputRule, $markSchema, $remark } from "@milkdown/kit/utils";

type MdastLikeNode = {
  type?: string;
  value?: string;
  children?: MdastLikeNode[];
};

type MarkdownStringifyHandler = (
  node: { children?: unknown[] },
  parent: unknown,
  state: {
    createTracker: (info: unknown) => {
      move: (value: string) => string;
      current: () => Record<string, unknown>;
    };
    containerPhrasing: (
      node: { children?: unknown[] },
      info: Record<string, unknown>,
    ) => string;
  },
  info: unknown,
) => string;

const HIGHLIGHT_RE = /==([^=\n][^\n]*?)==/g;

function splitTextWithHighlights(value: string): MdastLikeNode[] {
  const next: MdastLikeNode[] = [];
  let cursor = 0;
  HIGHLIGHT_RE.lastIndex = 0;

  let match = HIGHLIGHT_RE.exec(value);
  while (match) {
    const start = match.index;
    const full = match[0] ?? "";
    const inner = match[1] ?? "";
    const end = start + full.length;

    if (start > cursor) {
      next.push({ type: "text", value: value.slice(cursor, start) });
    }
    if (inner.length > 0) {
      next.push({
        type: "highlight",
        children: [{ type: "text", value: inner }],
      });
    } else {
      next.push({ type: "text", value: full });
    }

    cursor = end;
    match = HIGHLIGHT_RE.exec(value);
  }

  if (cursor < value.length) {
    next.push({ type: "text", value: value.slice(cursor) });
  }

  return next.length > 0 ? next : [{ type: "text", value }];
}

function rewriteHighlights(node: MdastLikeNode): void {
  if (!Array.isArray(node.children) || node.children.length === 0) return;
  if (
    node.type === "inlineCode" ||
    node.type === "code" ||
    node.type === "html"
  ) {
    return;
  }

  const nextChildren: MdastLikeNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && typeof child.value === "string") {
      nextChildren.push(...splitTextWithHighlights(child.value));
      continue;
    }
    rewriteHighlights(child);
    nextChildren.push(child);
  }
  node.children = nextChildren;
}

export const remarkHighlightPlugin = $remark(
  "remarkHighlightPlugin",
  () =>
    () =>
    (tree) => {
      rewriteHighlights(tree as MdastLikeNode);
    },
);

export const highlightSchema = $markSchema("highlight", () => ({
  parseDOM: [{ tag: "mark" }],
  toDOM: () => ["mark", { class: "md-highlight" }],
  parseMarkdown: {
    match: (node) => node.type === "highlight",
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === "highlight",
    runner: (state, mark) => {
      state.withMark(mark, "highlight");
    },
  },
}));

export const highlightInputRule = $inputRule((ctx) => {
  return markRule(/==(?!\s)([^=\n]*?[^\s=])==$/, highlightSchema.type(ctx));
});

export const highlightMarkdownHandler: MarkdownStringifyHandler = (
  node,
  _parent,
  state,
  info,
) => {
  const tracker = state.createTracker(info);
  const before = tracker.move("==");
  const inner = tracker.move(
    state.containerPhrasing(node, {
      ...tracker.current(),
      before,
      after: "==",
    }),
  );
  const after = tracker.move("==");
  return `${before}${inner}${after}`;
};
