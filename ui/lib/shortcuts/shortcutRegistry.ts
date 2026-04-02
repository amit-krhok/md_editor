export const OPEN_ARTICLE_SEARCH_EVENT = "open-article-search" as const;
export const OPEN_CREATE_FILE_EVENT = "open-create-file" as const;

export type ShortcutCreateFileDetail = {
  folderId: string | null;
  initialTitle?: string;
};

type ShortcutDefinition = {
  /** Lowercased single key name, e.g. "k" or "n". */
  keyLower: string;
  /** Event name to dispatch on `window` when triggered. */
  eventName: string;
  /** Require Alt/Option in addition to Meta/Ctrl. */
  requireAlt?: boolean;
  /** Require Shift in addition to Meta/Ctrl. */
  requireShift?: boolean;
  detail?: unknown;
};

/**
 * Central place to add / modify UI keyboard shortcuts.
 * Extend this list and the global listener will pick it up.
 */
export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    keyLower: "k",
    eventName: OPEN_ARTICLE_SEARCH_EVENT,
  },
  {
    keyLower: "e",
    eventName: OPEN_CREATE_FILE_EVENT,
    detail: {
      folderId: null,
      initialTitle: "new file",
    } satisfies ShortcutCreateFileDetail,
  },
];
