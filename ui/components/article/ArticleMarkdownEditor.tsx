"use client";

import { createSlice } from "@milkdown/kit/ctx";
import {
  Editor,
  editorViewCtx,
  rootCtx,
  defaultValueCtx,
  editorViewOptionsCtx,
} from "@milkdown/kit/core";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { history } from "@milkdown/kit/plugin/history";
import { indent, indentConfig } from "@milkdown/kit/plugin/indent";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { trailing } from "@milkdown/kit/plugin/trailing";
import { TextSelection } from "@milkdown/kit/prose/state";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import {
  Milkdown,
  MilkdownProvider,
  useEditor,
  useInstance,
} from "@milkdown/react";
import { useEffect, useRef, useState } from "react";

import {
  buildLinkEditorProps,
  codeBlockCopyClickCapture,
  codeBlockComponent,
  configureCodeBlock,
  emojiShortcodeInputRule,
  remarkEmojiPlugin,
} from "@/components/article/milkdown-plugins";

import "prosemirror-tables/style/tables.css";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import "@/styles/article-milkdown.css";

const CrepeCtx = createSlice({}, "CrepeCtx");
const FeaturesCtx = createSlice([], "FeaturesCtx");

function createArticleEditor(
  root: HTMLElement,
  defaultValue: string,
  onMarkdownChange: (markdown: string) => void,
) {
  return Editor.make()
    .config((ctx) => {
      ctx.inject(CrepeCtx, {});
      ctx.inject(FeaturesCtx, []);
    })
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, defaultValue);
      ctx.set(editorViewOptionsCtx, {
        editable: () => true,
        ...buildLinkEditorProps(),
      });
      ctx.update(indentConfig.key, (value) => ({
        ...value,
        size: 4,
      }));
    })
    .use(remarkEmojiPlugin)
    .use(commonmark)
    .use(emojiShortcodeInputRule)
    .config((ctx) => configureCodeBlock(ctx))
    .use(codeBlockComponent)
    .use(listener)
    .use(history)
    .use(indent)
    .use(trailing)
    .use(clipboard)
    .use(gfm)
    .config((ctx) => {
      ctx.get(listenerCtx).markdownUpdated((_c, markdown) => {
        onMarkdownChange(markdown);
      });
    });
}

type Props = {
  articleId: string;
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
};

function EditorSurface({
  articleId,
  initialMarkdown,
  onMarkdownChange,
}: Props) {
  const [bootstrapMarkdown] = useState(() => initialMarkdown);
  const onChangeRef = useRef(onMarkdownChange);
  onChangeRef.current = onMarkdownChange;

  const lastFocusedIdRef = useRef<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = surfaceRef.current;
    if (!root) return;
    const onClickCapture = (e: MouseEvent) => codeBlockCopyClickCapture(e);
    root.addEventListener("click", onClickCapture, true);
    return () => root.removeEventListener("click", onClickCapture, true);
  }, []);

  useEditor(
    (root: HTMLElement) =>
      createArticleEditor(root, bootstrapMarkdown, (md) =>
        onChangeRef.current(md),
      ),
    [bootstrapMarkdown],
  );

  const [loading, getEditor] = useInstance();

  useEffect(() => {
    if (loading) return;
    if (lastFocusedIdRef.current === articleId) return;
    lastFocusedIdRef.current = articleId;
    const id = requestAnimationFrame(() => {
      getEditor()?.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        view.focus();
        const doc = view.state.doc;
        const end = doc.content.size;
        try {
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(doc, Math.max(0, end)),
            ),
          );
        } catch {
          /* ignore */
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [articleId, loading, getEditor]);

  return (
    <div ref={surfaceRef} className="article-md-editor w-full">
      <label className="sr-only" htmlFor={`article-editor-${articleId}`}>
        Article content
      </label>
      <div id={`article-editor-${articleId}`} role="textbox" aria-multiline>
        <Milkdown />
      </div>
    </div>
  );
}

export function ArticleMarkdownEditor(props: Props) {
  return (
    <MilkdownProvider key={props.articleId}>
      <EditorSurface {...props} />
    </MilkdownProvider>
  );
}
