"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";

import { IconChevronLeft, IconPlus } from "./LibraryIcons";

type Props = {
  onCollapse: () => void;
  onStartCreateFolder: () => void;
};

export function LibraryPaneHeader({ onCollapse, onStartCreateFolder }: Props) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-border px-1">
      <button
        type="button"
        className="library-toolbar-btn"
        aria-label="Hide library"
        onClick={onCollapse}
      >
        <IconChevronLeft />
      </button>
      <span className="min-w-0 flex-1 truncate px-1 text-xs font-semibold uppercase tracking-wide text-muted"></span>
      <DropdownMenu>
        <DropdownMenuTrigger plain ariaLabel="Create item">
          <IconPlus />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onStartCreateFolder}>
            Create folder
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <span>Create file</span>
            <span className="ml-auto text-xs text-muted">Soon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
