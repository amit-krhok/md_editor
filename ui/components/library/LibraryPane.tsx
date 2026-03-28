"use client";

import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";

import { listArticlesWithoutFolder } from "@/lib/api/articles";
import { createFolder, listFolders } from "@/lib/api/folders";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/stores/store-context";
import type { ArticlePublic } from "@/types/article.types";
import type { FolderPublic } from "@/types/folder.types";
import { Spinner } from "@/ui/Spinner";

import { ArticleRow } from "./ArticleRow";
import { CreateFolderInline } from "./CreateFolderInline";
import { DeleteFolderModal } from "./DeleteFolderModal";
import { FolderRow } from "./FolderRow";
import { LibraryExpandFab } from "./LibraryExpandFab";
import { LibraryPaneHeader } from "./LibraryPaneHeader";

export const LibraryPane = observer(function LibraryPane() {
  const auth = useAuthStore();
  const token = auth.token;

  const [collapsed, setCollapsed] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [articles, setArticles] = useState<ArticlePublic[]>([]);
  const [folders, setFolders] = useState<FolderPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderPublic | null>(null);

  const loadLibrary = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [a, f] = await Promise.all([
        listArticlesWithoutFolder(token),
        listFolders(token),
      ]);
      setArticles(a);
      setFolders(f);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load library";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  async function handleCreateFolder(name: string) {
    if (!token) return;
    setCreateBusy(true);
    setCreateError(null);
    try {
      await createFolder(token, name);
      setCreatingFolder(false);
      await loadLibrary();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not create folder";
      setCreateError(message);
    } finally {
      setCreateBusy(false);
    }
  }

  const asideClass =
    "flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-border bg-surface-elevated max-md:max-h-[min(24rem,50vh)] md:h-full md:w-72 md:max-h-none md:border-r md:border-t-0";

  return (
    <>
      {!collapsed ? (
        <aside className={asideClass}>
          <LibraryPaneHeader
            onCollapse={() => {
              setCollapsed(true);
              setCreatingFolder(false);
              setCreateError(null);
            }}
            onStartCreateFolder={() => {
              setCreateError(null);
              setCreatingFolder(true);
            }}
          />
          {creatingFolder ? (
            <CreateFolderInline
              onSubmit={handleCreateFolder}
              onCancel={() => {
                setCreatingFolder(false);
                setCreateError(null);
              }}
              disabled={createBusy}
              error={createError}
            />
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-1 py-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-6" />
              </div>
            ) : loadError ? (
              <p className="px-2 text-sm text-red-600 dark:text-red-400">
                {loadError}
              </p>
            ) : articles.length === 0 && folders.length === 0 ? (
              <p className="px-2 text-sm text-muted">
                No articles or folders yet.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {articles.map((article) => (
                  <li key={article.id}>
                    <ArticleRow article={article} />
                  </li>
                ))}
                {folders.map((folder) => (
                  <li key={folder.id}>
                    <FolderRow
                      folder={folder}
                      onRequestDelete={setDeleteTarget}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      ) : (
        <LibraryExpandFab onExpand={() => setCollapsed(false)} />
      )}

      <DeleteFolderModal
        folder={deleteTarget}
        open={deleteTarget != null}
        token={token}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void loadLibrary()}
      />
    </>
  );
});
