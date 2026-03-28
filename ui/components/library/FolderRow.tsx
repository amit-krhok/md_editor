"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/http";
import type { FolderPublic } from "@/types/folder.types";
import { Input } from "@/ui/Input";
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
};

export function FolderRow({
  folder,
  expanded,
  onToggleExpand,
  onRequestDelete,
  onRequestCreateFile,
  onRename,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={rowRef} className="group flex min-w-0 items-center gap-0.5 rounded-md py-0.5 pl-1.5 pr-0.5 hover:bg-muted/10">
      <button
        type="button"
        className="library-toolbar-btn shrink-0 rounded-md"
        aria-expanded={expanded}
        aria-label={expanded ? "Hide files in folder" : "Show files in folder"}
        title="Show or hide files"
        onClick={onToggleExpand}
      >
        <IconChevronRight
          className={`mx-auto size-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
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
        <IconFolder className="size-3.5 shrink-0 text-muted" aria-hidden />
        {editing ? (
          <div className="min-w-0 flex-1">
            <Input
              ref={inputRef}
              className="h-7 py-0.5 text-xs leading-tight"
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
            {renameError ? (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                {renameError}
              </p>
            ) : null}
          </div>
        ) : (
          <span
            className="min-w-0 flex-1 cursor-default truncate text-xs leading-snug text-foreground select-none"
            title={`${folder.name} — double-click to rename`}
          >
            {folder.name}
          </span>
        )}
      </div>
      {!editing ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="app-btn--icon h-7 min-w-7 shrink-0 px-0 text-foreground"
            ariaLabel={`Actions for folder ${folder.name}`}
          >
            <IconMoreHorizontal className="mx-auto size-4" />
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
