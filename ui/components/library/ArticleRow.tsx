"use client";

import type { ArticlePublic } from "@/types/article.types";

import { IconFileText } from "./LibraryIcons";

type Props = {
  article: ArticlePublic;
};

export function ArticleRow({ article }: Props) {
  return (
    <div
      className="flex min-w-0 items-center gap-2 rounded-md py-1.5 pl-2 pr-2 text-sm text-foreground hover:bg-muted/10"
      title={article.title}
    >
      <IconFileText className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 truncate">{article.title}</span>
    </div>
  );
}
