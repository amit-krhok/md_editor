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

import { IconFolder, IconMoreHorizontal, IconTrash } from "./LibraryIcons";

type Props = {
  folder: FolderPublic;
  onRequestDelete: (folder: FolderPublic) => void;
  onRename: (folderId: string, name: string) => Promise<void>;
};

export function FolderRow({ folder, onRequestDelete, onRename }: Props) {
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
    <div ref={rowRef} className="group flex min-w-0 items-center gap-1 rounded-md py-1.5 pl-2 pr-1 hover:bg-muted/10">
      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        onDoubleClick={(e) => {
          e.preventDefault();
          if (!editing && !submitting) {
            setRenameError(null);
            setDraft(folder.name);
            setEditing(true);
          }
        }}
      >
        <IconFolder className="size-4 shrink-0 text-muted" aria-hidden />
        {editing ? (
          <div className="min-w-0 flex-1">
            <Input
              ref={inputRef}
              className="h-8 py-1 text-sm"
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
            className="min-w-0 flex-1 cursor-default truncate text-sm text-foreground select-none"
            title={`${folder.name} — double-click to rename`}
          >
            {folder.name}
          </span>
        )}
      </div>
      {!editing ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="app-btn--icon h-8 min-w-8 shrink-0 px-0 text-foreground"
            ariaLabel={`Actions for folder ${folder.name}`}
          >
            <IconMoreHorizontal className="mx-auto size-[18px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
