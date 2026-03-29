import type { EditorState } from "@milkdown/prose/state";

/** `/` must be at block start or after whitespace; query has no spaces. */
export function findSlashQuery(
  state: EditorState,
): { from: number; to: number; query: string } | null {
  const { $from } = state.selection;
  const parent = $from.parent;
  if (!parent.isTextblock) return null;
  if (parent.type.name === "code_block") return null;

  const start = $from.start();
  const end = $from.pos;
  const text = $from.parent.textBetween(
    0,
    $from.parent.content.size,
    undefined,
    "\ufffc",
  );
  const relEnd = end - start;
  const slice = text.slice(0, relEnd);
  const slashIdx = slice.lastIndexOf("/");
  if (slashIdx < 0) return null;

  const before = slice.slice(0, slashIdx);
  if (slashIdx > 0) {
    const prev = before[before.length - 1];
    if (prev !== " " && prev !== "\t" && prev !== "\n" && prev !== "\ufffc") {
      return null;
    }
  }

  const query = slice.slice(slashIdx + 1);
  if (query.includes(" ") || query.includes("\n") || query.includes("\t")) {
    return null;
  }

  const from = start + slashIdx;
  return { from, to: end, query };
}
