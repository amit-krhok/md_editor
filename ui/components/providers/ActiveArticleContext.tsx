"use client";

import { observer } from "mobx-react-lite";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { updateArticle as updateArticleRequest } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/stores/store-context";

export type ActiveArticleSnapshot = { id: string; title: string };

type Ctx = {
  snapshot: ActiveArticleSnapshot | null;
  setSnapshot: (s: ActiveArticleSnapshot | null) => void;
  /** LibraryPane assigns: update root + folder article lists by id. */
  syncLibraryTitles: React.MutableRefObject<(id: string, title: string) => void>;
  patchArticleTitle: (
    articleId: string,
    title: string,
  ) => Promise<{ title: string }>;
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
  const syncLibraryTitles = useRef<(id: string, title: string) => void>(() => {});

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
        s?.id === articleId ? { id: articleId, title: updated.title } : s,
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
    }),
    [snapshot, patchArticleTitle],
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

export function formatArticleRenameError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Could not rename file";
}
