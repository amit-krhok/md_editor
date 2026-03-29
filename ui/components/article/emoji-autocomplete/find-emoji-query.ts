import type { EditorState } from "@milkdown/prose/state";

/**
 * Incomplete `:name` shortcode before the cursor (no closing `:` yet).
 * Avoids `http:` / `foo:` by requiring the character before `:` not be alphanumeric.
 */
export function findEmojiQuery(
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

  const colonIdx = slice.lastIndexOf(":");
  if (colonIdx < 0) return null;

  if (colonIdx > 0) {
    const prev = slice[colonIdx - 1];
    if (/[a-zA-Z0-9_]/.test(prev)) return null;
  }

  const afterColon = slice.slice(colonIdx + 1);
  if (afterColon.includes(":")) return null;
  if (
    afterColon.includes(" ") ||
    afterColon.includes("\n") ||
    afterColon.includes("\t") ||
    afterColon.includes("\ufffc")
  ) {
    return null;
  }
  if (!/^[a-zA-Z0-9_+-]*$/.test(afterColon)) return null;

  const from = start + colonIdx;
  return { from, to: end, query: afterColon.toLowerCase() };
}
