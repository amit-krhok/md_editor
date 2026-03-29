/**
 * Single source of truth for table structure actions (slash commands share ids via `slashId`).
 */
export const TABLE_BUBBLE_ACTIONS = [
  {
    id: "addRowBefore",
    slashId: "table-row-above",
    slashAliases: ["trow-up", "row-above"],
    label: "↑",
    title: "Insert row above",
  },
  {
    id: "addRowAfter",
    slashId: "table-row-below",
    slashAliases: ["trow-down", "row-below"],
    label: "↓",
    title: "Insert row below",
  },
  {
    id: "addColBefore",
    slashId: "table-col-left",
    slashAliases: ["tcol-left", "col-left"],
    label: "←",
    title: "Insert column left",
    dividerBefore: true,
  },
  {
    id: "addColAfter",
    slashId: "table-col-right",
    slashAliases: ["tcol-right", "col-right"],
    label: "→",
    title: "Insert column right",
  },
  {
    id: "deleteRow",
    slashId: "table-row-delete",
    slashAliases: ["trow-del", "del-row"],
    label: "⊟",
    title: "Delete row",
    dividerBefore: true,
  },
  {
    id: "deleteColumn",
    slashId: "table-col-delete",
    slashAliases: ["tcol-del", "del-col"],
    label: "⊠",
    title: "Delete column",
  },
] as const;

export type TableBubbleActionId = (typeof TABLE_BUBBLE_ACTIONS)[number]["id"];
