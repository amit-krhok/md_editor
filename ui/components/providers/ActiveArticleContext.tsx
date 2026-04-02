"use client";

import { observer } from "mobx-react-lite";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { updateArticle as updateArticleRequest } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/stores/store-context";

export type ActiveArticleSnapshot = {
  id: string;
  title: string;
  isPubliclyAccessible: boolean;
};

export type ArticleContentSaveStatus = "idle" | "saving" | "saved";

export type ArticleEditorMode = "write" | "draw";

type Ctx = {
  snapshot: ActiveArticleSnapshot | null;
  setSnapshot: Dispatch<SetStateAction<ActiveArticleSnapshot | null>>;
  /** LibraryPane assigns: update root + folder article lists by id. */
  syncLibraryTitles: React.MutableRefObject<(id: string, title: string) => void>;
  patchArticleTitle: (
    articleId: string,
    title: string,
  ) => Promise<{ title: string }>;
  contentSaveStatus: ArticleContentSaveStatus;
  setContentSaveStatus: Dispatch<SetStateAction<ArticleContentSaveStatus>>;
  /** ArticleWorkspace keeps this in sync for share / export. */
  openArticleMarkdownRef: React.MutableRefObject<string>;
  articleEditorMode: ArticleEditorMode;
  setArticleEditorMode: Dispatch<SetStateAction<ArticleEditorMode>>;
  /** ProseMirror range captured when entering draw mode (insert replaces this span). */
  drawInsertAnchorRef: React.MutableRefObject<{ from: number; to: number } | null>;
  /** Set by ArticleMarkdownEditor: snapshot current selection into drawInsertAnchorRef. */
  captureDrawInsertAnchorRef: React.MutableRefObject<(() => void) | null>;
  /** Set by ArticleMarkdownEditor: insert markdown at anchor (or current selection). */
  insertMarkdownAtDrawAnchorRef: React.MutableRefObject<
    ((markdown: string) => void) | null
  >;
};

const ActiveArticleContext = createContext<Ctx | null>(null);

export const ActiveArticleProvider = observer(function ActiveArticleProvider({
  children,
}: {
  children: ReactNode;
}) {
  const auth = useAuthStore();
  const token = auth.token;
  const [snapshot, setSnapshot] = useState<ActiveArticleSnapshot | null>(null);
  const [contentSaveStatus, setContentSaveStatus] =
    useState<ArticleContentSaveStatus>("idle");
  const [articleEditorMode, setArticleEditorMode] =
    useState<ArticleEditorMode>("write");
  const syncLibraryTitles = useRef<(id: string, title: string) => void>(() => {});
  const openArticleMarkdownRef = useRef<string>("");
  const drawInsertAnchorRef = useRef<{ from: number; to: number } | null>(null);
  const captureDrawInsertAnchorRef = useRef<(() => void) | null>(null);
  const insertMarkdownAtDrawAnchorRef = useRef<
    ((markdown: string) => void) | null
  >(null);

  const patchArticleTitle = useCallback(
    async (articleId: string, title: string) => {
      if (!token) {
        throw new Error("Not signed in");
      }
      const trimmed = title.trim();
      if (trimmed.length === 0) {
        throw new Error("Title is required");
      }
      const updated = await updateArticleRequest(token, articleId, {
        title: trimmed,
      });
      setSnapshot((s) =>
        s?.id === articleId
          ? {
              id: articleId,
              title: updated.title,
              isPubliclyAccessible: updated.is_publicly_accessible,
            }
          : s,
      );
      syncLibraryTitles.current(articleId, updated.title);
      return { title: updated.title };
    },
    [token],
  );

  const value = useMemo(
    () => ({
      snapshot,
      setSnapshot,
      syncLibraryTitles,
      patchArticleTitle,
      contentSaveStatus,
      setContentSaveStatus,
      openArticleMarkdownRef,
      articleEditorMode,
      setArticleEditorMode,
      drawInsertAnchorRef,
      captureDrawInsertAnchorRef,
      insertMarkdownAtDrawAnchorRef,
    }),
    [snapshot, patchArticleTitle, contentSaveStatus, articleEditorMode],
  );

  return (
    <ActiveArticleContext.Provider value={value}>
      {children}
    </ActiveArticleContext.Provider>
  );
});

export function useActiveArticle(): Ctx {
  const ctx = useContext(ActiveArticleContext);
  if (!ctx) {
    throw new Error("useActiveArticle must be used within ActiveArticleProvider");
  }
  return ctx;
}

/** For surfaces that may render outside `ActiveArticleProvider` (e.g. public read-only article). */
export function useActiveArticleOptional(): Ctx | null {
  return useContext(ActiveArticleContext);
}

export function formatArticleRenameError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Could not rename file";
}
