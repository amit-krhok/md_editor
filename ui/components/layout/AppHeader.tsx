"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import {
  formatArticleRenameError,
  useActiveArticle,
} from "@/components/providers/ActiveArticleContext";
import { Input } from "@/ui/Input";

import { SettingsMenu } from "./SettingsMenu";

const ARTICLE_PATH_UUID_RE =
  /^\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

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
      className="flex min-w-0 flex-1 flex-col gap-0.5"
    >
      <Input
        ref={inputRef}
        className="h-7 max-w-md py-0.5 font-mono text-xs leading-tight"
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
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  ) : (
    <code
      className="max-w-[min(100%,24rem)] cursor-default truncate rounded border border-border bg-surface px-1.5 py-px font-mono text-xs leading-tight text-foreground"
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
  const { snapshot } = useActiveArticle();

  const pathMatch = pathname.match(ARTICLE_PATH_UUID_RE);
  const articleIdFromPath = pathMatch?.[1] ?? null;
  const showTitleChip =
    articleIdFromPath != null &&
    snapshot != null &&
    snapshot.id === articleIdFromPath;

  return (
    <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-sm">
      <div className="mx-auto flex h-8 items-center justify-between gap-3 px-[length:var(--spacing-page)] py-0">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
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
        <div className="flex shrink-0 items-center">
          <SettingsMenu showSignOut />
        </div>
      </div>
    </header>
  );
}
