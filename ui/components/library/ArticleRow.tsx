"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import {
  formatArticleRenameError,
  useActiveArticle,
} from "@/components/providers/ActiveArticleContext";
import type { ArticlePublic } from "@/types/article.types";
import {
  LibraryNameFieldError,
  LibraryNameInput,
} from "@/components/library/LibraryNameInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";

import {
  IconFileText,
  IconMoreHorizontal,
  IconPencil,
  IconTrash,
} from "./LibraryIcons";

type Props = {
  article: ArticlePublic;
  onRequestDelete: (article: ArticlePublic) => void;
};

export function ArticleRow({ article, onRequestDelete }: Props) {
  const pathname = usePathname();
  const { patchArticleTitle } = useActiveArticle();
  const href = ROUTES.article(article.id);
  const active = pathname === href;

  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(article.title);
  const [submitting, setSubmitting] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(article.title);
    }
  }, [article.title, editing]);

  useEffect(() => {
    if (!editing) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        rowRef.current &&
        !rowRef.current.contains(e.target as Node) &&
        !submitting
      ) {
        setEditing(false);
        setDraft(article.title);
        setRenameError(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [editing, article.title, submitting]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft(article.title);
    setRenameError(null);
  }, [article.title]);

  const commitRename = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    if (trimmed === article.title) {
      setEditing(false);
      setRenameError(null);
      return;
    }
    setSubmitting(true);
    setRenameError(null);
    try {
      await patchArticleTitle(article.id, trimmed);
      setEditing(false);
    } catch (e) {
      setRenameError(formatArticleRenameError(e));
    } finally {
      setSubmitting(false);
    }
  }, [draft, article.id, article.title, patchArticleTitle, cancelEdit]);

  return (
    <div
      ref={rowRef}
      className={`group flex min-w-0 items-center gap-0.5 rounded-md py-0 pl-1.5 pr-0.5 text-xs leading-tight hover:bg-muted/10 ${
        active ? "bg-muted/15" : ""
      }`}
    >
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <IconFileText className="size-3 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <LibraryNameInput
              ref={inputRef}
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
                  cancelEdit();
                }
              }}
            />
            <LibraryNameFieldError>{renameError}</LibraryNameFieldError>
          </div>
        </div>
      ) : (
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-1 text-foreground"
          title={article.title}
        >
          <IconFileText className="size-3 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 truncate">{article.title}</span>
        </Link>
      )}
      {!editing ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            plain
            className="library-toolbar-btn--sm"
            ariaLabel={`Actions for ${article.title}`}
          >
            <IconMoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setRenameError(null);
                setDraft(article.title);
                setEditing(true);
              }}
            >
              <IconPencil className="size-4 shrink-0" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => onRequestDelete(article)}
            >
              <IconTrash className="size-4 shrink-0" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
