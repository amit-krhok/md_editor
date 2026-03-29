/**
 * Extensible slash commands: `/id` in the editor opens a picker, then optional
 * keyboard-driven fields, then inserts markdown via `buildMarkdown`.
 */

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
   * Produce markdown inserted in place of `/…query` (and trailing slice).
   * Runs after all fields are collected (or immediately if `fields` is empty).
   */
  buildMarkdown: (values: Record<string, string>) => string;
};
