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
import type { Node as PMNode } from "@milkdown/kit/prose/model";
import type {
  DirectEditorProps,
  EditorView as ProseEditorView,
} from "@milkdown/kit/prose/view";
import type { Ctx } from "@milkdown/kit/ctx";
import { $inputRule, $remark } from "@milkdown/kit/utils";

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

function linkHrefAt(view: ProseEditorView, pos: number): string | null {
  const link = view.state.schema.marks.link;
  if (!link) return null;
  const $pos = view.state.doc.resolve(
    Math.min(pos, view.state.doc.content.size),
  );
  const fromMarks = $pos.marks();
  const m = fromMarks.find((x) => x.type === link);
  if (m?.attrs.href && typeof m.attrs.href === "string") return m.attrs.href;
  const after = $pos.nodeAfter;
  if (after?.isText) {
    const lm = link.isInSet(after.marks);
    if (lm?.attrs.href && typeof lm.attrs.href === "string")
      return lm.attrs.href;
  }
  return null;
}

export function buildLinkEditorProps(): Pick<
  DirectEditorProps,
  "handleClickOn" | "handleDOMEvents"
> {
  return {
    handleClickOn(
      view,
      _pos,
      node: PMNode,
      _nodePos,
      event: MouseEvent,
      direct: boolean,
    ) {
      if (!(event.metaKey || event.ctrlKey)) return false;
      if (!direct || !node.isText) return false;
      const linkMark = node.marks.find((m) => m.type.name === "link");
      const href = linkMark?.attrs.href;
      if (typeof href === "string" && href.length > 0) {
        window.open(href, "_blank", "noopener,noreferrer");
        return true;
      }
      return false;
    },
    handleDOMEvents: {
      mousemove(view, event) {
        const el = view.dom as HTMLElement;
        if (event.metaKey || event.ctrlKey) {
          const coords = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          const href = coords ? linkHrefAt(view, coords.pos) : null;
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
