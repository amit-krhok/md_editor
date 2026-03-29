import type { Ctx } from "@milkdown/kit/ctx";
import {
  Plugin,
  PluginKey,
  TextSelection,
  type EditorState,
} from "@milkdown/prose/state";
import type {
  DirectEditorProps,
  EditorView,
} from "@milkdown/prose/view";
import { $prose, replaceRange } from "@milkdown/kit/utils";

import { findEmojiQuery } from "@/components/article/emoji-autocomplete/find-emoji-query";

import { findSlashQuery } from "./find-slash";
import { filterSlashCommands } from "./registry";
import type { SlashCommand } from "./types";

export const slashCommandPluginKey = new PluginKey("articleSlashCommands");

type SlashPluginState =
  | { mode: "idle" }
  | {
      mode: "pick";
      from: number;
      to: number;
      query: string;
      selectedIndex: number;
    }
  | {
      mode: "fields";
      command: SlashCommand;
      from: number;
      to: number;
      fieldIndex: number;
      values: Record<string, string>;
    };

type SlashMeta =
  | { action: "close" }
  | {
      action: "openFields";
      command: SlashCommand;
      from: number;
      to: number;
    }
  | { action: "nav"; delta: number }
  | {
      action: "fieldsStep";
      values: Record<string, string>;
      fieldIndex: number;
    };

function pickList(query: string, state: EditorState) {
  return filterSlashCommands(query, state);
}

function initialPickState(
  slash: { from: number; to: number; query: string },
  prev: SlashPluginState,
  docState: EditorState,
): SlashPluginState {
  const list = pickList(slash.query, docState);
  if (!list.length) return { mode: "idle" };

  let selectedIndex = 0;
  if (prev.mode === "pick") {
    const sameSlash = prev.from === slash.from && prev.query === slash.query;
    const extended =
      prev.from === slash.from &&
      slash.query.startsWith(prev.query) &&
      slash.query.length > prev.query.length;
    if (sameSlash || extended) {
      selectedIndex = Math.min(prev.selectedIndex, list.length - 1);
    }
  }

  return {
    mode: "pick",
    from: slash.from,
    to: slash.to,
    query: slash.query,
    selectedIndex,
  };
}

class SlashCommandView {
  private menu: HTMLDivElement;
  private fields: HTMLDivElement;
  private fieldLabel: HTMLDivElement;
  private fieldInput: HTMLInputElement;
  private fieldError: HTMLDivElement;
  private view: EditorView;
  private ctx: Ctx;
  private root: HTMLElement | null = null;

  constructor(view: EditorView, ctx: Ctx) {
    this.view = view;
    this.ctx = ctx;
    this.menu = document.createElement("div");
    this.menu.className = "article-slash-menu";
    this.menu.setAttribute("role", "listbox");
    this.menu.style.display = "none";

    this.fields = document.createElement("div");
    this.fields.className = "article-slash-fields";
    this.fields.style.display = "none";
    this.fieldLabel = document.createElement("div");
    this.fieldLabel.className = "article-slash-fields-label";
    const inputWrap = document.createElement("div");
    inputWrap.className = "article-slash-fields-input-wrap";
    this.fieldInput = document.createElement("input");
    this.fieldInput.className = "article-slash-fields-input";
    this.fieldInput.type = "text";
    this.fieldInput.autocomplete = "off";
    this.fieldError = document.createElement("div");
    this.fieldError.className = "article-slash-fields-error";
    this.fieldError.setAttribute("role", "alert");
    inputWrap.appendChild(this.fieldInput);
    this.fields.appendChild(this.fieldLabel);
    this.fields.appendChild(inputWrap);
    this.fields.appendChild(this.fieldError);

    this.fieldInput.addEventListener("keydown", this.onFieldKeydown);
    this.mount(view);
  }

  private mount(view: EditorView) {
    const dom = view.dom as HTMLElement;
    this.root = dom.closest(".article-md-editor") ?? dom.parentElement;
    this.root?.appendChild(this.menu);
    this.root?.appendChild(this.fields);
  }

  private onFieldKeydown = (e: KeyboardEvent) => {
    const st = slashCommandPluginKey.getState(this.view.state);
    if (!st || st.mode !== "fields") return;

    if (e.key === "Escape") {
      e.preventDefault();
      this.cancelFields(st);
      return;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      this.commitField(st);
    }
  };

  private cancelFields(st: Extract<SlashPluginState, { mode: "fields" }>) {
    this.hideFields();
    const tr = this.view.state.tr.delete(st.from, st.to);
    this.view.dispatch(
      tr
        .setSelection(TextSelection.create(tr.doc, st.from))
        .setMeta(slashCommandPluginKey, { action: "close" }),
    );
    this.view.focus();
  }

  private commitField(st: Extract<SlashPluginState, { mode: "fields" }>) {
    const field = st.command.fields[st.fieldIndex];
    if (!field) return;

    let raw = this.fieldInput.value.trim();
    if (!raw && field.defaultValue !== undefined) {
      raw = field.defaultValue;
    }

    if (field.validate) {
      const err = field.validate(raw);
      if (err) {
        this.fieldError.textContent = err;
        return;
      }
    }

    if (field.type === "number") {
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) {
        this.fieldError.textContent = "Enter a number";
        return;
      }
      if (field.min !== undefined && n < field.min) {
        this.fieldError.textContent = `Min ${field.min}`;
        return;
      }
      if (field.max !== undefined && n > field.max) {
        this.fieldError.textContent = `Max ${field.max}`;
        return;
      }
      raw = String(n);
    }

    this.fieldError.textContent = "";
    const values = { ...st.values, [field.key]: raw };
    const nextIndex = st.fieldIndex + 1;

    if (nextIndex >= st.command.fields.length) {
      if (st.command.execute) {
        const ok = st.command.execute({
          ctx: this.ctx,
          view: this.view,
          from: st.from,
          to: st.to,
        });
        if (!ok) return;
      } else {
        const md = st.command.buildMarkdown(values);
        replaceRange(md, { from: st.from, to: st.to })(this.ctx);
      }
      this.hideFields();
      this.view.dispatch(
        this.view.state.tr.setMeta(slashCommandPluginKey, { action: "close" }),
      );
      this.view.focus();
      return;
    }

    this.view.dispatch(
      this.view.state.tr.setMeta(slashCommandPluginKey, {
        action: "fieldsStep",
        values,
        fieldIndex: nextIndex,
      }),
    );
  }

  private hideFields() {
    this.fields.style.display = "none";
  }

  private showFields(
    st: Extract<SlashPluginState, { mode: "fields" }>,
  ) {
    const field = st.command.fields[st.fieldIndex];
    if (!field) return;
    this.fieldLabel.textContent = field.label;
    this.fieldInput.placeholder = field.placeholder ?? "";
    this.fieldInput.value = st.values[field.key] ?? "";
    this.fieldInput.type = field.type === "number" ? "text" : "text";
    this.fieldInput.inputMode = field.type === "number" ? "numeric" : "text";
    this.fieldError.textContent = "";
    this.fields.style.display = "block";
    this.positionPanel(this.fields, st.to);
    requestAnimationFrame(() => {
      this.fieldInput.focus();
      this.fieldInput.select();
    });
  }

  private positionPanel(el: HTMLElement, pos: number) {
    const coords = this.view.coordsAtPos(pos);
    const host = this.root ?? (this.view.dom as HTMLElement);
    const hostRect = host.getBoundingClientRect();
    const top = coords.bottom - hostRect.top + host.scrollTop + 4;
    const left = Math.min(
      coords.left - hostRect.left + host.scrollLeft,
      hostRect.width - 280,
    );
    el.style.position = "absolute";
    el.style.top = `${Math.max(0, top)}px`;
    el.style.left = `${Math.max(4, left)}px`;
    el.style.zIndex = "60";
  }

  private renderPick(
    st: Extract<SlashPluginState, { mode: "pick" }>,
  ) {
    const list = pickList(st.query, this.view.state);
    this.menu.innerHTML = "";
    if (!list.length) {
      this.menu.style.display = "none";
      return;
    }

    list.forEach((cmd, i) => {
      const item = document.createElement("div");
      item.className = "article-slash-menu-item";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === st.selectedIndex ? "true" : "false");
      item.id = `article-slash-opt-${i}`;
      item.innerHTML = `<span class="article-slash-menu-title">${escapeHtml(cmd.title)}</span><span class="article-slash-menu-desc">/${escapeHtml(cmd.id)}</span>`;
      if (i === st.selectedIndex) item.classList.add("article-slash-menu-item--active");
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.chooseCommand(st, cmd);
      });
      this.menu.appendChild(item);
    });

    this.menu.style.display = "block";
    this.positionPanel(this.menu, st.to);
    this.menu.setAttribute(
      "aria-activedescendant",
      `article-slash-opt-${st.selectedIndex}`,
    );
  }

  private chooseCommand(
    st: Extract<SlashPluginState, { mode: "pick" }>,
    cmd: SlashCommand,
  ) {
    if (cmd.fields.length === 0) {
      if (cmd.execute) {
        const ok = cmd.execute({
          ctx: this.ctx,
          view: this.view,
          from: st.from,
          to: st.to,
        });
        if (!ok) return;
      } else {
        const md = cmd.buildMarkdown({});
        replaceRange(md, { from: st.from, to: st.to })(this.ctx);
      }
      this.menu.style.display = "none";
      this.view.dispatch(
        this.view.state.tr.setMeta(slashCommandPluginKey, { action: "close" }),
      );
      this.view.focus();
      return;
    }
    this.menu.style.display = "none";
    this.view.dispatch(
      this.view.state.tr.setMeta(slashCommandPluginKey, {
        action: "openFields",
        command: cmd,
        from: st.from,
        to: st.to,
      }),
    );
  }

  update(view: EditorView) {
    this.view = view;
    const st = slashCommandPluginKey.getState(view.state);
    if (!st || st.mode === "idle") {
      this.menu.style.display = "none";
      this.hideFields();
      return;
    }
    if (st.mode === "pick") {
      this.hideFields();
      this.renderPick(st);
    } else {
      this.menu.style.display = "none";
      this.showFields(st);
    }
  }

  destroy() {
    this.fieldInput.removeEventListener("keydown", this.onFieldKeydown);
    this.menu.remove();
    this.fields.remove();
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Slash menu pick-mode keys. Registered via `editorViewOptionsCtx.handleKeyDown` so this
 * runs before plugin handlers (notably prosemirror-tables ArrowUp/ArrowDown in cells).
 */
export function slashPickModeHandleKeyDown(
  view: EditorView,
  event: KeyboardEvent,
  ctx: Ctx,
): boolean {
  const st = slashCommandPluginKey.getState(view.state);
  if (!st || st.mode !== "pick") return false;

  const list = pickList(st.query, view.state);
  if (!list.length) return false;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    view.dispatch(
      view.state.tr.setMeta(slashCommandPluginKey, {
        action: "nav",
        delta: 1,
      }),
    );
    return true;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    view.dispatch(
      view.state.tr.setMeta(slashCommandPluginKey, {
        action: "nav",
        delta: -1,
      }),
    );
    return true;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const cmd = list[st.selectedIndex];
    if (!cmd) return true;
    if (cmd.fields.length === 0) {
      if (cmd.execute) {
        const ok = cmd.execute({
          ctx,
          view,
          from: st.from,
          to: st.to,
        });
        if (!ok) return true;
      } else {
        replaceRange(cmd.buildMarkdown({}), {
          from: st.from,
          to: st.to,
        })(ctx);
      }
      view.dispatch(
        view.state.tr.setMeta(slashCommandPluginKey, { action: "close" }),
      );
    } else {
      view.dispatch(
        view.state.tr.setMeta(slashCommandPluginKey, {
          action: "openFields",
          command: cmd,
          from: st.from,
          to: st.to,
        }),
      );
    }
    return true;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    const tr = view.state.tr.delete(st.from, st.to);
    view.dispatch(
      tr
        .setSelection(TextSelection.create(tr.doc, st.from))
        .setMeta(slashCommandPluginKey, { action: "close" }),
    );
    return true;
  }
  return false;
}

export function slashEditorKeymapProps(
  ctx: Ctx,
): Pick<DirectEditorProps, "handleKeyDown"> {
  return {
    handleKeyDown(view, event) {
      return slashPickModeHandleKeyDown(view, event, ctx);
    },
  };
}

export const slashCommandPlugin = $prose((ctx: Ctx) => {
  return new Plugin<SlashPluginState>({
    key: slashCommandPluginKey,
    state: {
      init: () => ({ mode: "idle" }),
      apply(tr, pluginState, _old, newState): SlashPluginState {
        const meta = tr.getMeta(slashCommandPluginKey) as SlashMeta | undefined;

        if (meta?.action === "close") {
          return { mode: "idle" };
        }

        if (meta?.action === "openFields") {
          return {
            mode: "fields",
            command: meta.command,
            from: meta.from,
            to: meta.to,
            fieldIndex: 0,
            values: {},
          };
        }

        if (meta?.action === "fieldsStep" && pluginState.mode === "fields") {
          return {
            ...pluginState,
            values: meta.values,
            fieldIndex: meta.fieldIndex,
          };
        }

        if (meta?.action === "nav" && pluginState.mode === "pick") {
          const list = pickList(pluginState.query, newState);
          if (!list.length) return { mode: "idle" };
          const len = list.length;
          const ni =
            (pluginState.selectedIndex + meta.delta + len * 8) % len;
          return { ...pluginState, selectedIndex: ni };
        }

        if (pluginState.mode === "fields") {
          if (tr.docChanged) {
            return { mode: "idle" };
          }
          return pluginState;
        }

        const slash = findSlashQuery(newState);
        if (!slash) {
          return { mode: "idle" };
        }

        const emojiHit = findEmojiQuery(newState);
        if (emojiHit && emojiHit.from > slash.from) {
          return { mode: "idle" };
        }

        return initialPickState(slash, pluginState, newState);
      },
    },
    view(editorView) {
      return new SlashCommandView(editorView, ctx);
    },
  });
});
