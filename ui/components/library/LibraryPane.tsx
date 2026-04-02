"use client";

import { observer } from "mobx-react-lite";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { useActiveArticle } from "@/components/providers/ActiveArticleContext";
import { useLibraryPaneUi } from "@/components/providers/LibraryPaneUiContext";
import {
  createArticle,
  deleteArticle,
  listArticlesInFolder,
  listArticlesWithoutFolder,
  moveArticleToFolder,
  moveArticleToLibraryRoot,
} from "@/lib/api/articles";
import { ARTICLE_DRAG_MIME } from "@/lib/dnd";
import { createFolder, listFolders, updateFolder } from "@/lib/api/folders";
import { ApiError } from "@/lib/api/http";
import {
  OPEN_ARTICLE_SEARCH_EVENT,
  OPEN_CREATE_FILE_EVENT,
  type ShortcutCreateFileDetail,
} from "@/lib/shortcuts/shortcutRegistry";
import { useAuthStore } from "@/stores/store-context";
import type { ArticlePublic } from "@/types/article.types";
import type { FolderPublic } from "@/types/folder.types";
import { Spinner } from "@/ui/Spinner";

import { ArticleRow } from "./ArticleRow";
import { CreateFileInline } from "./CreateFileInline";
import { CreateFolderInline } from "./CreateFolderInline";
import { DeleteArticleModal } from "./DeleteArticleModal";
import { DeleteFolderModal } from "./DeleteFolderModal";
import { FolderRow } from "./FolderRow";
import { LibraryPaneHeader } from "./LibraryPaneHeader";

type CreateFileContext = {
  folderId: string | null;
  initialTitle?: string;
};

export const LibraryPane = observer(function LibraryPane() {
  const auth = useAuthStore();
  const token = auth.token;
  const router = useRouter();
  const pathname = usePathname();
  const { syncLibraryTitles } = useActiveArticle();
  const {
    libraryCollapsed: collapsed,
    collapseLibrary,
    expandLibrary,
  } = useLibraryPaneUi();
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [createFileContext, setCreateFileContext] =
    useState<CreateFileContext | null>(null);
  const [articles, setArticles] = useState<ArticlePublic[]>([]);
  const [folders, setFolders] = useState<FolderPublic[]>([]);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [folderArticles, setFolderArticles] = useState<
    Record<string, ArticlePublic[]>
  >({});
  const [loadingFolderId, setLoadingFolderId] = useState<string | null>(null);
  const loadedFolderIdsRef = useRef<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFileBusy, setCreateFileBusy] = useState(false);
  const [createFileError, setCreateFileError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderPublic | null>(null);
  const [deleteArticleTarget, setDeleteArticleTarget] =
    useState<ArticlePublic | null>(null);
  const [deleteArticleBusy, setDeleteArticleBusy] = useState(false);
  const [movingArticleId, setMovingArticleId] = useState<string | null>(null);
  const [libraryMoveError, setLibraryMoveError] = useState<string | null>(null);
  const [rootDropActive, setRootDropActive] = useState(false);

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
      setFolderArticles({});
      loadedFolderIdsRef.current.clear();
      setExpandedFolderIds(new Set());
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

  useEffect(() => {
    syncLibraryTitles.current = (id, title) => {
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, title } : a)),
      );
      setFolderArticles((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].map((a) =>
            a.id === id ? { ...a, title } : a,
          );
        }
        return next;
      });
    };
    return () => {
      syncLibraryTitles.current = () => {};
    };
  }, [syncLibraryTitles]);

  const ensureFolderArticlesLoaded = useCallback(
    async (folderId: string) => {
      if (!token) return;
      if (loadedFolderIdsRef.current.has(folderId)) return;
      loadedFolderIdsRef.current.add(folderId);
      setLoadingFolderId(folderId);
      try {
        const list = await listArticlesInFolder(token, folderId);
        setFolderArticles((p) => ({ ...p, [folderId]: list }));
      } catch {
        loadedFolderIdsRef.current.delete(folderId);
      } finally {
        setLoadingFolderId((id) => (id === folderId ? null : id));
      }
    },
    [token],
  );

  const toggleFolder = useCallback(
    (folderId: string) => {
      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        if (next.has(folderId)) {
          next.delete(folderId);
        } else {
          next.add(folderId);
          void ensureFolderArticlesLoaded(folderId);
        }
        return next;
      });
    },
    [ensureFolderArticlesLoaded],
  );

  async function handleCreateFolder(name: string) {
    if (!token) return;
    setCreateBusy(true);
    setCreateError(null);
    try {
      const created = await createFolder(token, name);
      setCreatingFolder(false);
      setFolders((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
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

  const handleRenameFolder = useCallback(
    async (folderId: string, name: string) => {
      if (!token) return;
      const updated = await updateFolder(token, folderId, name);
      setFolders((prev) =>
        [...prev.map((f) => (f.id === updated.id ? updated : f))].sort(
          (a, b) => a.name.localeCompare(b.name),
        ),
      );
    },
    [token],
  );

  const handleCreateFile = useCallback(
    async (title: string) => {
      if (!token || !createFileContext) return;
      setCreateFileBusy(true);
      setCreateFileError(null);
      try {
        const created = await createArticle(token, {
          title,
          folderId: createFileContext.folderId,
        });
        const fid = createFileContext.folderId;
        if (fid) {
          setExpandedFolderIds((prev) => new Set(prev).add(fid));
          loadedFolderIdsRef.current.add(fid);
          const list = await listArticlesInFolder(token, fid);
          setFolderArticles((prev) => ({ ...prev, [fid]: list }));
        } else {
          setArticles((prev) => [created, ...prev]);
        }
        setCreateFileContext(null);
        router.push(ROUTES.article(created.id));
      } catch (e) {
        const message =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not create file";
        setCreateFileError(message);
      } finally {
        setCreateFileBusy(false);
      }
    },
    [token, createFileContext, router],
  );

  const removeArticleFromLocalState = useCallback((articleId: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    setFolderArticles((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((a) => a.id !== articleId);
      }
      return next;
    });
  }, []);

  /** Apply server response after moving an article between root and folders. */
  const applyArticleMove = useCallback((updated: ArticlePublic) => {
    const id = updated.id;
    setArticles((prev) => {
      const rest = prev.filter((a) => a.id !== id);
      return updated.folder_id ? rest : [updated, ...rest];
    });
    setFolderArticles((prev) => {
      const next: Record<string, ArticlePublic[]> = {};
      for (const [k, list] of Object.entries(prev)) {
        next[k] = list.filter((a) => a.id !== id);
      }
      if (updated.folder_id) {
        const fid = updated.folder_id;
        next[fid] = [updated, ...(next[fid] ?? [])];
      }
      return next;
    });
  }, []);

  const findArticleById = useCallback(
    (articleId: string): ArticlePublic | undefined => {
      for (const a of articles) {
        if (a.id === articleId) return a;
      }
      for (const list of Object.values(folderArticles)) {
        const a = list.find((x) => x.id === articleId);
        if (a) return a;
      }
      return undefined;
    },
    [articles, folderArticles],
  );

  const handleArticleDroppedOnFolder = useCallback(
    async (folderId: string, articleId: string) => {
      if (!token) return;
      const src = findArticleById(articleId);
      if (!src || src.folder_id === folderId) return;
      setLibraryMoveError(null);
      setMovingArticleId(articleId);
      try {
        const updated = await moveArticleToFolder(token, articleId, folderId);
        applyArticleMove(updated);
        setExpandedFolderIds((prev) => new Set(prev).add(folderId));
        loadedFolderIdsRef.current.add(folderId);
      } catch (e) {
        setLibraryMoveError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not move file",
        );
      } finally {
        setMovingArticleId(null);
      }
    },
    [token, findArticleById, applyArticleMove],
  );

  const handleArticleDroppedOnLibraryRoot = useCallback(
    async (articleId: string) => {
      if (!token) return;
      const src = findArticleById(articleId);
      if (!src || src.folder_id == null) return;
      setLibraryMoveError(null);
      setMovingArticleId(articleId);
      try {
        const updated = await moveArticleToLibraryRoot(token, articleId);
        applyArticleMove(updated);
      } catch (e) {
        setLibraryMoveError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not move file to library",
        );
      } finally {
        setMovingArticleId(null);
      }
    },
    [token, findArticleById, applyArticleMove],
  );

  useEffect(() => {
    if (!libraryMoveError) return;
    const t = window.setTimeout(() => setLibraryMoveError(null), 5000);
    return () => window.clearTimeout(t);
  }, [libraryMoveError]);

  useEffect(() => {
    const onOpenCreateFile = (e: Event) => {
      const detail = (e as CustomEvent<ShortcutCreateFileDetail | undefined>)
        .detail;
      const folderId = detail?.folderId ?? null;
      const initialTitle = detail?.initialTitle ?? "new file";

      // Ensure the inline create UI is visible.
      expandLibrary();

      setCreateError(null);
      setCreateFileError(null);
      setCreatingFolder(false);

      setCreateFileContext({ folderId, initialTitle });

      if (folderId) {
        setExpandedFolderIds((prev) => new Set(prev).add(folderId));
        void ensureFolderArticlesLoaded(folderId);
      }
    };

    window.addEventListener(
      OPEN_CREATE_FILE_EVENT,
      onOpenCreateFile as EventListener,
    );
    return () => {
      window.removeEventListener(
        OPEN_CREATE_FILE_EVENT,
        onOpenCreateFile as EventListener,
      );
    };
  }, [expandLibrary, ensureFolderArticlesLoaded]);

  const handleConfirmDeleteArticle = useCallback(async () => {
    if (!token || !deleteArticleTarget) return;
    const id = deleteArticleTarget.id;
    setDeleteArticleBusy(true);
    try {
      await deleteArticle(token, id);
      removeArticleFromLocalState(id);
      setDeleteArticleTarget(null);
      if (pathname === ROUTES.article(id)) {
        router.push(ROUTES.home);
      }
    } catch {
      /* keep modal open; could set error */
    } finally {
      setDeleteArticleBusy(false);
    }
  }, [token, deleteArticleTarget, pathname, router, removeArticleFromLocalState]);

  const asideClass =
    "flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-border bg-surface-elevated max-md:max-h-[min(24rem,50vh)] md:h-full md:w-[12.6rem] md:max-h-none md:border-r md:border-t-0";

  return (
    <>
      {!collapsed ? (
        <aside className={asideClass}>
          <LibraryPaneHeader
            onCollapse={() => {
              collapseLibrary();
              setCreatingFolder(false);
              setCreateError(null);
              setCreateFileContext(null);
              setCreateFileError(null);
            }}
            onStartCreateFolder={() => {
              setCreateError(null);
              setCreatingFolder(true);
              setCreateFileContext(null);
              setCreateFileError(null);
            }}
            onStartCreateFile={() => {
              setCreateFileError(null);
              setCreateFileContext({ folderId: null });
              setCreatingFolder(false);
              setCreateError(null);
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
          {createFileContext?.folderId === null ? (
            <CreateFileInline
              key="create-file-root"
              initialTitle={createFileContext.initialTitle}
              onSubmit={handleCreateFile}
              onCancel={() => {
                setCreateFileContext(null);
                setCreateFileError(null);
              }}
              disabled={createFileBusy}
              error={createFileError}
            />
          ) : null}
          {libraryMoveError ? (
            <p className="px-2 pb-1 text-xs text-red-600 dark:text-red-400">
              {libraryMoveError}
            </p>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-1 py-0.5 scrollbar-hidden">
            {loading ? (
              <div className="flex justify-center py-6">
                <Spinner className="size-5" />
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
              <ul className="space-y-0">
                <li className="list-none">
                  <div
                    className={`rounded-md transition-colors ${
                      rootDropActive
                        ? "bg-accent/10 ring-1 ring-accent/35 ring-inset"
                        : ""
                    } ${
                      articles.length === 0 && folders.length > 0
                        ? "min-h-7 py-0.5"
                        : ""
                    }`}
                    onDragEnter={(e) => {
                      if (!e.dataTransfer.types.includes(ARTICLE_DRAG_MIME))
                        return;
                      e.preventDefault();
                      setRootDropActive(true);
                    }}
                    onDragLeave={(e) => {
                      if (
                        !(e.currentTarget as HTMLElement).contains(
                          e.relatedTarget as Node,
                        )
                      ) {
                        setRootDropActive(false);
                      }
                    }}
                    onDragOver={(e) => {
                      if (!e.dataTransfer.types.includes(ARTICLE_DRAG_MIME))
                        return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      setRootDropActive(false);
                      if (!e.dataTransfer.types.includes(ARTICLE_DRAG_MIME))
                        return;
                      e.preventDefault();
                      const id = e.dataTransfer.getData(ARTICLE_DRAG_MIME);
                      if (id) void handleArticleDroppedOnLibraryRoot(id);
                    }}
                  >
                    <ul className="m-0 list-none space-y-0 p-0">
                      {articles.map((article) => (
                        <li key={article.id}>
                          <ArticleRow
                            article={article}
                            onRequestDelete={setDeleteArticleTarget}
                            moveBusy={movingArticleId === article.id}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
                {folders.map((folder) => (
                  <li key={folder.id}>
                    <FolderRow
                      folder={folder}
                      expanded={expandedFolderIds.has(folder.id)}
                      onToggleExpand={() => toggleFolder(folder.id)}
                      onRequestDelete={setDeleteTarget}
                      onRequestCreateFile={(f) => {
                        setCreateFileContext({ folderId: f.id });
                        setCreateFileError(null);
                        setCreatingFolder(false);
                        setCreateError(null);
                        setExpandedFolderIds((prev) => new Set(prev).add(f.id));
                        void ensureFolderArticlesLoaded(f.id);
                      }}
                      onRename={handleRenameFolder}
                      onArticleDropped={(articleId) =>
                        void handleArticleDroppedOnFolder(folder.id, articleId)
                      }
                    />
                    {expandedFolderIds.has(folder.id) ? (
                      <ul className="ml-3 border-l border-border py-0 pl-1.5">
                        {createFileContext?.folderId === folder.id ? (
                          <li className="list-none">
                            <CreateFileInline
                              key={`create-file-${folder.id}`}
                              initialTitle={createFileContext.initialTitle}
                              onSubmit={handleCreateFile}
                              onCancel={() => {
                                setCreateFileContext(null);
                                setCreateFileError(null);
                              }}
                              disabled={createFileBusy}
                              error={createFileError}
                            />
                          </li>
                        ) : null}
                        {loadingFolderId === folder.id ? (
                          <li className="flex justify-center py-1">
                            <Spinner className="size-4" />
                          </li>
                        ) : (
                          (folderArticles[folder.id] ?? []).map((article) => (
                            <li key={article.id}>
                              <ArticleRow
                                article={article}
                                onRequestDelete={setDeleteArticleTarget}
                                moveBusy={movingArticleId === article.id}
                              />
                            </li>
                          ))
                        )}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="shrink-0 border-t border-border px-2 py-1.5">
            <button
              type="button"
              className="w-full rounded px-1 py-1 text-left text-xs text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
              onClick={() => window.dispatchEvent(new Event(OPEN_ARTICLE_SEARCH_EVENT))}
            >
              Search (Cmd+K)
            </button>
          </div>
        </aside>
      ) : null}

      <DeleteFolderModal
        folder={deleteTarget}
        open={deleteTarget != null}
        token={token}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void loadLibrary()}
      />

      <DeleteArticleModal
        article={deleteArticleTarget}
        open={deleteArticleTarget != null}
        busy={deleteArticleBusy}
        onClose={() => {
          if (!deleteArticleBusy) setDeleteArticleTarget(null);
        }}
        onConfirm={() => void handleConfirmDeleteArticle()}
      />
    </>
  );
});
