"use client";

import { useParams } from "next/navigation";

import { ArticleWorkspace } from "@/components/article/ArticleWorkspace";

export default function ArticlePage() {
  const params = useParams<{ articleId: string }>();
  const articleId = params.articleId;

  if (typeof articleId !== "string" || articleId.length === 0) {
    return null;
  }

  return <ArticleWorkspace articleId={articleId} />;
}
