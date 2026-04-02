import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { ArticleEditorMode } from "@/components/providers/ActiveArticleContext";

export type DrawModeToggleDeps = {
  articleEditorMode: ArticleEditorMode;
  setArticleEditorMode: Dispatch<SetStateAction<ArticleEditorMode>>;
  captureDrawInsertAnchorRef: MutableRefObject<(() => void) | null>;
};

export function toggleDrawMode(deps: DrawModeToggleDeps): void {
  if (deps.articleEditorMode === "write") {
    deps.captureDrawInsertAnchorRef.current?.();
    deps.setArticleEditorMode("draw");
  } else {
    deps.setArticleEditorMode("write");
  }
}
