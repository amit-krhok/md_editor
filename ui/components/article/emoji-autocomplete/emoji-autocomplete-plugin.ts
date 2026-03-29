import { Plugin, PluginKey, TextSelection } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { search } from "node-emoji";
import { $prose } from "@milkdown/kit/utils";

import { findSlashQuery } from "@/components/article/slash-commands/find-slash";

import { findEmojiQuery } from "./find-emoji-query";

export const emojiAutocompletePluginKey = new PluginKey("articleEmojiAutocomplete");

const MAX_RESULTS = 20;

let allEmojiCache: { emoji: string; name: string }[] | null = null;

function allEmojis(): { emoji: string; name: string }[] {
  if (!allEmojiCache) {
    allEmojiCache = search("").sort((a, b) => a.name.localeCompare(b.name));
  }
  return allEmojiCache;
}

let popularCache: { emoji: string; name: string }[] | null = null;

function popularEmojis(): { emoji: string; name: string }[] {
  if (!popularCache) {
    popularCache = allEmojis().slice(0, MAX_RESULTS);
  }
  return popularCache;
}

/** Substring match (not regex) so `:+1` and similar never throw. */
function filterEmojis(query: string): { emoji: string; name: string }[] {
  const q = query.toLowerCase();
  const raw =
    query.length === 0
      ? popularEmojis()
      : allEmojis().filter(({ name }) => name.includes(q));
  const sorted = [...raw].sort((a, b) => {
    if (query.length === 0) return a.name.localeCompare(b.name);
    const ap = a.name.startsWith(q) ? 0 : 1;
    const bp = b.name.startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.name.localeCompare(b.name);
  });
  return sorted.slice(0, MAX_RESULTS);
}

type EmojiPluginState =
  | { mode: "idle" }
  | {
      mode: "pick";
      from: number;
      to: number;
      query: string;
      selectedIndex: number;
    };

type EmojiMeta =
  | { action: "close" }
  | { action: "nav"; delta: number };

function initialPickState(
  hit: { from: number; to: number; query: string },
  prev: EmojiPluginState,
): EmojiPluginState {
  const list = filterEmojis(hit.query);
  if (!list.length) return { mode: "idle" };

  let selectedIndex = 0;
  if (prev.mode === "pick") {
    const same = prev.from === hit.from && prev.query === hit.query;
    const extended =
      prev.from === hit.from &&
      hit.query.startsWith(prev.query) &&
      hit.query.length > prev.query.length;
    if (same || extended) {
      selectedIndex = Math.min(prev.selectedIndex, list.length - 1);
    }
  }

  return {
    mode: "pick",
    from: hit.from,
    to: hit.to,
    query: hit.query,
    selectedIndex,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class EmojiAutocompleteView {
  private menu: HTMLDivElement;
  private view: EditorView;
  private root: HTMLElement | null = null;

  constructor(view: EditorView) {
    this.view = view;
    this.menu = document.createElement("div");
    this.menu.className = "article-emoji-menu";
    this.menu.setAttribute("role", "listbox");
    this.menu.style.display = "none";
    this.mount(view);
  }

  private mount(view: EditorView) {
    const dom = view.dom as HTMLElement;
    this.root = dom.closest(".article-md-editor") ?? dom.parentElement;
    this.root?.appendChild(this.menu);
  }

  private positionPanel(pos: number) {
    const coords = this.view.coordsAtPos(pos);
    const host = this.root ?? (this.view.dom as HTMLElement);
    const hostRect = host.getBoundingClientRect();
    const top = coords.bottom - hostRect.top + host.scrollTop + 4;
    const left = Math.min(
      coords.left - hostRect.left + host.scrollLeft,
      hostRect.width - 280,
    );
    this.menu.style.position = "absolute";
    this.menu.style.top = `${Math.max(0, top)}px`;
    this.menu.style.left = `${Math.max(4, left)}px`;
    this.menu.style.zIndex = "61";
  }

  private choose(
    st: Extract<EmojiPluginState, { mode: "pick" }>,
    emoji: string,
  ) {
    const tr = this.view.state.tr.replaceWith(
      st.from,
      st.to,
      this.view.state.schema.text(emoji),
    );
    const pos = st.from + emoji.length;
    this.view.dispatch(
      tr
        .setSelection(TextSelection.create(tr.doc, pos))
        .setMeta(emojiAutocompletePluginKey, { action: "close" }),
    );
    this.menu.style.display = "none";
    this.view.focus();
  }

  private renderPick(st: Extract<EmojiPluginState, { mode: "pick" }>) {
    const list = filterEmojis(st.query);
    this.menu.innerHTML = "";
    if (!list.length) {
      this.menu.style.display = "none";
      return;
    }

    list.forEach((row, i) => {
      const item = document.createElement("div");
      item.className = "article-emoji-menu-item";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === st.selectedIndex ? "true" : "false");
      item.id = `article-emoji-opt-${i}`;
      if (i === st.selectedIndex) item.classList.add("article-emoji-menu-item--active");
      item.innerHTML = `<span class="article-emoji-glyph" aria-hidden="true">${escapeHtml(row.emoji)}</span><span class="article-emoji-name">:${escapeHtml(row.name)}:</span>`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const cur = emojiAutocompletePluginKey.getState(this.view.state);
        if (!cur || cur.mode !== "pick") return;
        this.choose(cur, row.emoji);
      });
      this.menu.appendChild(item);
    });

    this.menu.style.display = "block";
    this.positionPanel(st.to);
    this.menu.setAttribute(
      "aria-activedescendant",
      `article-emoji-opt-${st.selectedIndex}`,
    );
  }

  update(view: EditorView) {
    this.view = view;
    const st = emojiAutocompletePluginKey.getState(view.state);
    if (!st || st.mode !== "pick") {
      this.menu.style.display = "none";
      return;
    }
    this.renderPick(st);
  }

  destroy() {
    this.menu.remove();
  }
}

/**
 * Emoji pick-mode keys. Registered via `editorViewOptionsCtx.handleKeyDown` with slash
 * (`buildArticleEditorKeymapProps`) so ↑/↓ navigate the list in table cells instead of
 * moving the table selection.
 */
export function emojiPickModeHandleKeyDown(
  view: EditorView,
  event: KeyboardEvent,
): boolean {
  const st = emojiAutocompletePluginKey.getState(view.state);
  if (!st || st.mode !== "pick") return false;

  const list = filterEmojis(st.query);
  if (!list.length) return false;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    view.dispatch(
      view.state.tr.setMeta(emojiAutocompletePluginKey, {
        action: "nav",
        delta: 1,
      }),
    );
    return true;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    view.dispatch(
      view.state.tr.setMeta(emojiAutocompletePluginKey, {
        action: "nav",
        delta: -1,
      }),
    );
    return true;
  }
  if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault();
    const row = list[st.selectedIndex];
    if (!row) return true;
    const tr = view.state.tr.replaceWith(
      st.from,
      st.to,
      view.state.schema.text(row.emoji),
    );
    const pos = st.from + row.emoji.length;
    view.dispatch(
      tr
        .setSelection(TextSelection.create(tr.doc, pos))
        .setMeta(emojiAutocompletePluginKey, { action: "close" }),
    );
    return true;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    const tr = view.state.tr.delete(st.from, st.to);
    view.dispatch(
      tr
        .setSelection(TextSelection.create(tr.doc, st.from))
        .setMeta(emojiAutocompletePluginKey, { action: "close" }),
    );
    return true;
  }
  return false;
}

export const emojiAutocompletePlugin = $prose((_ctx) => {
  return new Plugin<EmojiPluginState>({
    key: emojiAutocompletePluginKey,
    state: {
      init: () => ({ mode: "idle" }),
      apply(tr, pluginState, _old, newState): EmojiPluginState {
        const meta = tr.getMeta(emojiAutocompletePluginKey) as
          | EmojiMeta
          | undefined;

        if (meta?.action === "close") {
          return { mode: "idle" };
        }

        if (meta?.action === "nav" && pluginState.mode === "pick") {
          const list = filterEmojis(pluginState.query);
          if (!list.length) return { mode: "idle" };
          const len = list.length;
          const ni =
            (pluginState.selectedIndex + meta.delta + len * 8) % len;
          return { ...pluginState, selectedIndex: ni };
        }

        const hit = findEmojiQuery(newState);
        if (!hit) {
          return { mode: "idle" };
        }

        const slash = findSlashQuery(newState);
        if (slash && slash.from > hit.from) {
          return { mode: "idle" };
        }

        return initialPickState(hit, pluginState);
      },
    },
    view(editorView) {
      return new EmojiAutocompleteView(editorView);
    },
  });
});
