/**
 * Extensible slash commands: `/id` in the editor opens a picker, then optional
 * keyboard-driven fields, then inserts markdown via `buildMarkdown` or runs `execute`.
 */

import type { Ctx } from "@milkdown/kit/ctx";
import type { EditorState } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";

export type SlashExecuteEnv = {
  ctx: Ctx;
  view: EditorView;
  from: number;
  to: number;
};

export type SlashFieldType = "text" | "number";

export type SlashField = {
  key: string;
  /** Shown above the input (screen reader + visible). */
  label: string;
  placeholder?: string;
  type?: SlashFieldType;
  /** Used when the user presses Enter on an empty input. */
  defaultValue?: string;
  /** Inclusive bounds for `type: "number"` (after parseInt). */
  min?: number;
  max?: number;
  /** Return an error message to block advancing, or null if ok. */
  validate?: (value: string) => string | null;
};

export type SlashCommand = {
  /** Trigger without slash: user types `/` + id (e.g. `table`, `image`). */
  id: string;
  title: string;
  description?: string;
  /** Extra strings to match when filtering (lowercased). */
  aliases?: string[];
  fields: SlashField[];
  /**
   * When set, command is hidden from the picker unless this returns true.
   * Omit for commands that are always available.
   */
  visibleInPicker?: (state: EditorState) => boolean;
  /**
   * If set, used instead of `buildMarkdown` when committing (0 fields, or after last field).
   * Should return false to leave the `/…` text unchanged (e.g. cursor not in a table).
   */
  execute?: (env: SlashExecuteEnv) => boolean;
  /**
   * Produce markdown inserted in place of `/…query` (and trailing slice).
   * Runs after all fields are collected (or immediately if `fields` is empty and no `execute`).
   */
  buildMarkdown: (values: Record<string, string>) => string;
};
