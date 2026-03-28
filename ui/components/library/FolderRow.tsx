"use client";

import type { FolderPublic } from "@/types/folder.types";
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
};

export function FolderRow({ folder, onRequestDelete }: Props) {
  return (
    <div className="group flex min-w-0 items-center gap-1 rounded-md py-1.5 pl-2 pr-1 hover:bg-muted/10">
      <IconFolder className="size-4 shrink-0 text-muted" aria-hidden />
      <span
        className="min-w-0 flex-1 truncate text-sm text-foreground"
        title={folder.name}
      >
        {folder.name}
      </span>
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
    </div>
  );
}
