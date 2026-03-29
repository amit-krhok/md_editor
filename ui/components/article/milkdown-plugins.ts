import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { languages } from "@codemirror/language-data";
import { Compartment } from "@codemirror/state";
import { EditorView as CodeMirrorEditorView, keymap } from "@codemirror/view";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { basicSetup } from "codemirror";
import { get as emojiByName } from "node-emoji";
import remarkEmoji from "remark-emoji";
import {
  codeBlockComponent,
  codeBlockConfig,
  type CodeBlockConfig,
} from "@milkdown/kit/component/code-block";
import { InputRule } from "@milkdown/kit/prose/inputrules";
import type { Mark, MarkType } from "@milkdown/kit/prose/model";
import type {
  DirectEditorProps,
  EditorView as ProseEditorView,
} from "@milkdown/kit/prose/view";
import type { Ctx } from "@milkdown/kit/ctx";
import { $inputRule, $remark } from "@milkdown/kit/utils";

import { emojiPickModeHandleKeyDown } from "@/components/article/emoji-autocomplete/emoji-autocomplete-plugin";
import { slashPickModeHandleKeyDown } from "@/components/article/slash-commands/slash-plugin";

function readLinkHref(marks: readonly Mark[], link: MarkType): string | null {
  const m = marks.find((mk) => mk.type === link);
  const h = m?.attrs?.href;
  return typeof h === "string" && h.length > 0 ? h : null;
}

/** Document position → link href (boundaries inside marked text). */
function linkHrefAtDocPos(view: ProseEditorView, pos: number): string | null {
  const link = view.state.schema.marks.link;
  if (!link) return null;
  const doc = view.state.doc;
  const size = doc.content.size;
  if (size === 0) return null;
  const p = Math.max(0, Math.min(pos, size));
  const $p = doc.resolve(p);

  let h = readLinkHref($p.marks(), link);
  if (h) return h;
  const after = $p.nodeAfter;
  if (after?.isText) {
    h = readLinkHref(after.marks, link);
    if (h) return h;
  }
  const before = $p.nodeBefore;
  if (before?.isText) {
    h = readLinkHref(before.marks, link);
    if (h) return h;
  }
  if (p > 0) {
    h = readLinkHref(doc.resolve(p - 1).marks(), link);
    if (h) return h;
  }
  return null;
}

/**
 * First `<a href>` in the pointer stack inside the editor — matches native hit-testing
 * (avoids ProseMirror pos/caret drift on tall line-height).
 */
function linkHrefFromDom(
  view: ProseEditorView,
  clientX: number,
  clientY: number,
): string | null {
  const root = view.dom.ownerDocument ?? document;
  const stack =
    typeof root.elementsFromPoint === "function"
      ? Array.from(root.elementsFromPoint(clientX, clientY))
      : [];
  if (stack.length === 0) {
    const hit = root.elementFromPoint(clientX, clientY);
    if (hit instanceof Element && view.dom.contains(hit)) {
      const a = hit.closest("a");
      if (a && view.dom.contains(a)) {
        const href = a.getAttribute("href");
        return typeof href === "string" && href.length > 0 ? href : null;
      }
    }
    return null;
  }
  for (let i = 0; i < stack.length; i++) {
    const el = stack[i];
    if (!(el instanceof Element) || !view.dom.contains(el)) continue;
    const a = el.closest("a");
    if (!a || !view.dom.contains(a)) continue;
    const href = a.getAttribute("href");
    if (typeof href === "string" && href.length > 0) return href;
  }
  return null;
}

function hrefAllowedForOpen(href: string): boolean {
  const t = href.trim();
  const lower = t.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return false;
  }
  try {
    const base =
      typeof window !== "undefined" ? window.location.href : "https://example.com/";
    const u = new URL(t, base);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:";
  } catch {
    return /^(\.\.?\/|\/|#)/.test(t);
  }
}

function resolveLinkHref(
  view: ProseEditorView,
  clientX: number,
  clientY: number,
  /** From `handleClick`; omitted on `mousemove` so we never guess position `0`. */
  docFallbackPos?: number,
): string | null {
  const fromDom = linkHrefFromDom(view, clientX, clientY);
  if (fromDom && hrefAllowedForOpen(fromDom)) return fromDom;

  const coords = view.posAtCoords({ left: clientX, top: clientY });
  const pos = coords?.pos ?? docFallbackPos;
  if (pos === undefined) return null;
  const fromDoc = linkHrefAtDocPos(view, pos);
  if (fromDoc && hrefAllowedForOpen(fromDoc)) return fromDoc;

  return null;
}

/**
 * ⌘-click / Ctrl-click opens link href in a new tab; optional pointer cursor when the
 * modifier is held. Milkdown link marks render as `<a href>`, so DOM hit-testing is primary.
 */
export function buildLinkEditorProps(): Pick<
  DirectEditorProps,
  "handleClick" | "handleDOMEvents"
> {
  return {
    handleClick(view, pos, event) {
      if (!(event.metaKey || event.ctrlKey) || event.button !== 0) return false;
      const href = resolveLinkHref(
        view,
        event.clientX,
        event.clientY,
        pos,
      );
      if (!href) return false;
      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
      return true;
    },
    handleDOMEvents: {
      mousemove(view, event) {
        const el = view.dom as HTMLElement;
        if (event.metaKey || event.ctrlKey) {
          const href = resolveLinkHref(
            view,
            event.clientX,
            event.clientY,
          );
          el.style.cursor = href ? "pointer" : "";
        } else {
          el.style.cursor = "";
        }
        return false;
      },
      mouseleave(view) {
        (view.dom as HTMLElement).style.cursor = "";
        return false;
      },
    },
  };
}

/** GitHub-style :emoji: in markdown on load. */
export const remarkEmojiPlugin = $remark("remarkEmoji", () => remarkEmoji);

/** Live `:name:` → unicode when the closing `:` is typed at end of line / word. */
export const emojiShortcodeInputRule = $inputRule(
  () =>
    new InputRule(/:([a-zA-Z0-9_+-]+):$/, (state, match, start, end) => {
      const glyph = emojiByName(match[1]);
      if (!glyph) return null;
      return state.tr.replaceWith(start, end, state.schema.text(glyph));
    }),
);

/** Set on click (capture) when target is a code-block copy control; consumed in onCopy. */
let codeBlockCopyFeedbackEl: HTMLElement | null = null;

/** Register on the article editor root (capture) so onCopy can show the tick on the correct button. */
export function codeBlockCopyClickCapture(e: MouseEvent) {
  const btn = (e.target as HTMLElement | null)?.closest?.(
    ".milkdown-code-block .copy-button",
  );
  codeBlockCopyFeedbackEl = (btn as HTMLElement) ?? null;
}

function flashCodeBlockCopyButton() {
  const el = codeBlockCopyFeedbackEl;
  codeBlockCopyFeedbackEl = null;
  if (!el?.classList.contains("copy-button")) return;
  el.classList.add("code-block-copy-done");
  window.setTimeout(() => el.classList.remove("code-block-copy-done"), 2200);
}

/** Shared so all Milkdown code-block editors can swap VS Code light/dark together. */
const codeBlockThemeCompartment = new Compartment();

/** VS Code–style CodeMirror theme from current `html.dark` class. */
function vscodeSyntaxThemeExtension() {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return dark ? vscodeDark : vscodeLight;
}

/**
 * Call after toggling app light/dark (e.g. from ThemeRoot) so open code blocks
 * pick up `vscodeLight` / `vscodeDark` without reload.
 */
export function reconfigureCodeBlockEditorThemes() {
  if (typeof document === "undefined") return;
  const ext = vscodeSyntaxThemeExtension();
  document
    .querySelectorAll(".milkdown-code-block .cm-editor")
    .forEach((node) => {
      const view = CodeMirrorEditorView.findFromDOM(node as HTMLElement);
      if (!view) return;
      view.dispatch({
        effects: codeBlockThemeCompartment.reconfigure(ext),
      });
    });
}

/**
 * Slash and `:emoji:` pick modes use `editorViewOptionsCtx.handleKeyDown` so ↑/↓ run
 * before prosemirror-tables cell navigation (including inside table cells).
 */
export function buildArticleEditorKeymapProps(
  ctx: Ctx,
): Pick<DirectEditorProps, "handleKeyDown"> {
  return {
    handleKeyDown(view, event) {
      return (
        slashPickModeHandleKeyDown(view, event, ctx) ||
        emojiPickModeHandleKeyDown(view, event)
      );
    },
  };
}

/** CodeMirror-backed fenced blocks + syntax highlighting. */
export function configureCodeBlock(ctx: Ctx) {
  ctx.update(codeBlockConfig.key, (prev: CodeBlockConfig) => ({
    ...prev,
    languages,
    copyText: "",
    expandIcon: "",
    searchIcon: "",
    clearSearchIcon: "",
    /* Icon is drawn in CSS (mask) so we keep an empty span from <Icon /> */
    copyIcon: "",

    onCopy: (text: string) => {
      flashCodeBlockCopyButton();
      prev.onCopy?.(text);
    },
    extensions: [
      keymap.of(defaultKeymap.concat(indentWithTab)),
      basicSetup,
      codeBlockThemeCompartment.of(vscodeSyntaxThemeExtension()),
    ],
  }));
}

export { codeBlockComponent };
