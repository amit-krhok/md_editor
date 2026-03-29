import { replaceRange } from "@milkdown/kit/utils";
import type { EditorState } from "@milkdown/prose/state";
import { isInTable } from "@milkdown/prose/tables";

import type { SlashCommand, SlashExecuteEnv } from "@/components/article/slash-commands/types";

import { TABLE_BUBBLE_ACTIONS, type TableBubbleActionId } from "./table-bubble-actions";
import {
  canRunTableBubbleAction,
  runTableBubbleAction,
} from "./table-bubble-commands";

function tableExecute(actionId: TableBubbleActionId) {
  return (env: SlashExecuteEnv): boolean => {
    if (!canRunTableBubbleAction(env.view.state, actionId)) return false;
    replaceRange("", { from: env.from, to: env.to })(env.ctx);
    return runTableBubbleAction(env.ctx, actionId);
  };
}

/** Slash entries for row/column ops; only listed when the cursor is inside a table. */
export const tableStructureSlashCommands: SlashCommand[] =
  TABLE_BUBBLE_ACTIONS.map((row) => ({
    id: row.slashId,
    title: row.title,
    description: "Table cell",
    aliases: row.slashAliases ? [...row.slashAliases] : undefined,
    fields: [],
    visibleInPicker: (state: EditorState) => isInTable(state),
    execute: tableExecute(row.id),
    buildMarkdown: () => "",
  }));
