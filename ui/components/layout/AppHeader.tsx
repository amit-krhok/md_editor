"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  IconCheck,
  IconChevronRight,
} from "@/components/library/LibraryIcons";
import {
  formatArticleRenameError,
  useActiveArticle,
  type ArticleContentSaveStatus,
} from "@/components/providers/ActiveArticleContext";
import { useLibraryPaneUi } from "@/components/providers/LibraryPaneUiContext";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/ui/Input";
import { Spinner } from "@/ui/Spinner";

import { SettingsMenu } from "./SettingsMenu";
import { ShareMenu } from "./ShareMenu";

const ARTICLE_PATH_UUID_RE =
  /^\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

function ArticleSaveIndicator({ status }: { status: ArticleContentSaveStatus }) {
  if (status === "saving") {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Saving"
      >
        <Spinner
          className="!size-2.5 !border !border-border !border-t-accent"
          label="Saving"
        />
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-emerald-600 dark:text-emerald-400"
        role="status"
        aria-live="polite"
        aria-label="Saved"
      >
        <IconCheck className="size-3" />
      </span>
    );
  }
  return null;
}

function ArticleTitleChip({
  articleId,
  title,
}: {
  articleId: string;
  title: string;
}) {
  const { patchArticleTitle } = useActiveArticle();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!renaming) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [renaming]);

  const cancelRename = useCallback(() => {
    setRenaming(false);
    setError(null);
    setDraft(title);
  }, [title]);

  useEffect(() => {
    if (!renaming) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        editContainerRef.current &&
        !editContainerRef.current.contains(e.target as Node) &&
        !submitting
      ) {
        cancelRename();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [renaming, submitting, cancelRename]);

  const commitRename = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelRename();
      return;
    }
    if (trimmed === title) {
      setRenaming(false);
      setError(null);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await patchArticleTitle(articleId, trimmed);
      setRenaming(false);
    } catch (e) {
      setError(formatArticleRenameError(e));
    } finally {
      setSubmitting(false);
    }
  }, [articleId, draft, title, patchArticleTitle, cancelRename]);

  return renaming ? (
    <div
      ref={editContainerRef}
      className="relative flex min-h-0 min-w-0 max-h-8 flex-1 items-center"
    >
      <Input
        ref={inputRef}
        className="max-h-7 min-h-0 max-w-md py-0 font-mono text-xs leading-none shadow-none focus:ring-1 !h-7"
        value={draft}
        disabled={submitting}
        aria-label="File name"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commitRename();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancelRename();
          }
        }}
      />
      {error ? (
        <p
          className="absolute top-full left-0 z-50 mt-0.5 max-w-[min(100%,18rem)] rounded border border-border bg-surface-elevated px-2 py-1 text-xs leading-tight text-red-600 shadow-md dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  ) : (
    <code
      className="max-h-7 max-w-[min(100%,24rem)] cursor-default truncate rounded border border-border bg-surface px-1.5 py-0 font-mono text-xs leading-none text-foreground"
      title="Double-click to rename"
      onDoubleClick={(e) => {
        e.preventDefault();
        setError(null);
        setDraft(title);
        setRenaming(true);
      }}
    >
      {title}
    </code>
  );
}

export function AppHeader() {
  const pathname = usePathname() ?? "";
  const { snapshot, contentSaveStatus } = useActiveArticle();
  const { libraryCollapsed, expandLibrary } = useLibraryPaneUi();

  const pathMatch = pathname.match(ARTICLE_PATH_UUID_RE);
  const articleIdFromPath = pathMatch?.[1] ?? null;
  const showTitleChip =
    articleIdFromPath != null &&
    snapshot != null &&
    snapshot.id === articleIdFromPath;

  return (
    <header className="relative z-40 border-b border-border bg-surface-elevated/80 backdrop-blur-sm">
      <div className="mx-auto flex h-8 max-h-8 min-h-8 items-center justify-between gap-3 overflow-visible px-[length:var(--spacing-page)] py-0">
        <div className="flex min-h-0 min-w-0 max-h-8 flex-1 items-center gap-1.5">
          {libraryCollapsed ? (
            <button
              type="button"
              className="library-toolbar-btn shrink-0 rounded-md"
              aria-label="Show library"
              title="Show library"
              onClick={expandLibrary}
            >
              <IconChevronRight />
            </button>
          ) : null}
          <Link
            href={ROUTES.home}
            className="shrink-0 text-xs font-semibold leading-none tracking-tight text-foreground"
          >
            MD Editor
          </Link>
          {showTitleChip ? (
            <>
              <span className="shrink-0 text-muted" aria-hidden>
                /
              </span>
              <ArticleTitleChip
                key={snapshot.id}
                articleId={snapshot.id}
                title={snapshot.title}
              />
            </>
          ) : null}
        </div>
        <div className="flex h-8 max-h-8 shrink-0 items-center gap-1 overflow-visible">
          {showTitleChip ? (
            <ArticleSaveIndicator status={contentSaveStatus} />
          ) : null}
          {showTitleChip ? (
            <ShareMenu
              key={snapshot.id}
              articleId={snapshot.id}
              articleTitle={snapshot.title}
            />
          ) : null}
          <SettingsMenu showSignOut />
        </div>
      </div>
    </header>
  );
}
