"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ARTICLE_DRAG_MIME } from "@/lib/dnd";
import { ApiError } from "@/lib/api/http";
import type { FolderPublic } from "@/types/folder.types";
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
  IconChevronRight,
  IconFolder,
  IconMoreHorizontal,
  IconPlus,
  IconTrash,
} from "./LibraryIcons";

type Props = {
  folder: FolderPublic;
  expanded: boolean;
  onToggleExpand: () => void;
  onRequestDelete: (folder: FolderPublic) => void;
  onRequestCreateFile: (folder: FolderPublic) => void;
  onRename: (folderId: string, name: string) => Promise<void>;
  onArticleDropped?: (articleId: string) => void | Promise<void>;
};

export function FolderRow({
  folder,
  expanded,
  onToggleExpand,
  onRequestDelete,
  onRequestCreateFile,
  onRename,
  onArticleDropped,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [articleDragOver, setArticleDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folder.name);
  const [submitting, setSubmitting] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(folder.name);
    }
  }, [folder.name, editing]);

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
        setDraft(folder.name);
        setRenameError(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [editing, folder.name, submitting]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft(folder.name);
    setRenameError(null);
  }, [folder.name]);

  const commitRename = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    if (trimmed === folder.name) {
      setEditing(false);
      setRenameError(null);
      return;
    }
    setSubmitting(true);
    setRenameError(null);
    try {
      await onRename(folder.id, trimmed);
      setEditing(false);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not rename folder";
      setRenameError(message);
    } finally {
      setSubmitting(false);
    }
  }, [draft, folder.id, folder.name, onRename, cancelEdit]);

  const canAcceptArticleDrop =
    Boolean(onArticleDropped) && !editing && !submitting;

  return (
    <div
      ref={rowRef}
      className={`group flex min-h-9 min-w-0 items-center gap-1 rounded-md py-0.5 pl-1.5 pr-0.5 hover:bg-muted/10 max-md:min-h-11 ${
        articleDragOver && canAcceptArticleDrop
          ? "bg-accent/10 ring-1 ring-accent/35 ring-inset"
          : ""
      }`}
      onDragEnter={(e) => {
        if (!canAcceptArticleDrop) return;
        if (!e.dataTransfer.types.includes(ARTICLE_DRAG_MIME)) return;
        e.preventDefault();
        setArticleDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!canAcceptArticleDrop) return;
        if (!rowRef.current?.contains(e.relatedTarget as Node)) {
          setArticleDragOver(false);
        }
      }}
      onDragOver={(e) => {
        if (!canAcceptArticleDrop) return;
        if (!e.dataTransfer.types.includes(ARTICLE_DRAG_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        if (!canAcceptArticleDrop || !onArticleDropped) return;
        setArticleDragOver(false);
        if (!e.dataTransfer.types.includes(ARTICLE_DRAG_MIME)) return;
        e.preventDefault();
        const id = e.dataTransfer.getData(ARTICLE_DRAG_MIME);
        if (id) void onArticleDropped(id);
      }}
    >
      <button
        type="button"
        className="library-toolbar-btn library-toolbar-btn--sm shrink-0 rounded-md"
        aria-expanded={expanded}
        aria-label={expanded ? "Hide files in folder" : "Show files in folder"}
        title="Show or hide files"
        onClick={onToggleExpand}
      >
        <IconChevronRight
          className={`size-3 transition-transform max-md:size-3.5 ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>
      <div
        className="flex min-w-0 flex-1 items-center gap-1.5"
        onDoubleClick={(e) => {
          e.preventDefault();
          if (!editing && !submitting) {
            setRenameError(null);
            setDraft(folder.name);
            setEditing(true);
          }
        }}
      >
        <IconFolder
          className="size-3 shrink-0 text-accent max-md:size-3.5"
          aria-hidden
        />
        {editing ? (
          <div className="min-w-0 flex-1">
            <LibraryNameInput
              ref={inputRef}
              value={draft}
              disabled={submitting}
              aria-label="Folder name"
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
        ) : (
          <span
            className="min-w-0 flex-1 cursor-default truncate text-xs leading-tight text-foreground select-none max-md:text-sm"
            title={`${folder.name} — double-click to rename`}
          >
            {folder.name}
          </span>
        )}
      </div>
      {!editing ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            plain
            className="library-toolbar-btn--sm"
            ariaLabel={`Actions for folder ${folder.name}`}
          >
            <IconMoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRequestCreateFile(folder)}>
              <IconPlus className="size-4 shrink-0" />
              Create file
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => onRequestDelete(folder)}
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
