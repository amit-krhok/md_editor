"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import type { ArticlePublic } from "@/types/article.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";

import { IconFileText, IconMoreHorizontal, IconTrash } from "./LibraryIcons";

type Props = {
  article: ArticlePublic;
  onRequestDelete: (article: ArticlePublic) => void;
};

export function ArticleRow({ article, onRequestDelete }: Props) {
  const pathname = usePathname();
  const href = ROUTES.article(article.id);
  const active = pathname === href;

  return (
    <div
      className={`group flex min-w-0 items-center gap-1 rounded-md py-1.5 pl-2 pr-1 text-sm hover:bg-muted/10 ${
        active ? "bg-muted/15" : ""
      }`}
    >
      <Link
        href={href}
        className="flex min-w-0 flex-1 items-center gap-2 text-foreground"
        title={article.title}
      >
        <IconFileText className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 truncate">{article.title}</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="app-btn--icon h-8 min-w-8 shrink-0 px-0 text-foreground"
          ariaLabel={`Actions for ${article.title}`}
        >
          <IconMoreHorizontal className="mx-auto size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400"
            onClick={() => onRequestDelete(article)}
          >
            <IconTrash className="size-4 shrink-0" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
