import type { Ctx } from "@milkdown/kit/ctx";
import { commandsCtx } from "@milkdown/kit/core";
import {
  addColAfterCommand,
  addColBeforeCommand,
  addRowAfterCommand,
  addRowBeforeCommand,
} from "@milkdown/kit/preset/gfm";
import type { EditorState } from "@milkdown/prose/state";
import {
  deleteColumn,
  deleteRow,
  isInTable,
  selectedRect,
} from "@milkdown/prose/tables";

import type { TableBubbleActionId } from "./table-bubble-actions";

function canDeleteCurrentRow(state: EditorState): boolean {
  if (!isInTable(state)) return false;
  const rect = selectedRect(state);
  return !(rect.top === 0 && rect.bottom === rect.map.height);
}

function canDeleteCurrentColumn(state: EditorState): boolean {
  if (!isInTable(state)) return false;
  const rect = selectedRect(state);
  return !(rect.left === 0 && rect.right === rect.map.width);
}

/** Whether an action should be enabled for the current editor state (no dispatch). */
export function canRunTableBubbleAction(
  state: EditorState,
  id: TableBubbleActionId,
): boolean {
  if (!isInTable(state)) return false;
  switch (id) {
    case "addRowBefore":
    case "addRowAfter":
    case "addColBefore":
    case "addColAfter":
      return true;
    case "deleteRow":
      return canDeleteCurrentRow(state);
    case "deleteColumn":
      return canDeleteCurrentColumn(state);
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

/** Runs the table bubble action via Milkdown commands / prosemirror-tables. */
export function runTableBubbleAction(
  ctx: Ctx,
  id: TableBubbleActionId,
): boolean {
  const commands = ctx.get(commandsCtx);
  switch (id) {
    case "addRowBefore":
      return commands.call(addRowBeforeCommand.key);
    case "addRowAfter":
      return commands.call(addRowAfterCommand.key);
    case "addColBefore":
      return commands.call(addColBeforeCommand.key);
    case "addColAfter":
      return commands.call(addColAfterCommand.key);
    case "deleteRow":
      return commands.inline(deleteRow);
    case "deleteColumn":
      return commands.inline(deleteColumn);
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
