"use client";

import { useParams } from "next/navigation";

import { ReadOnlyArticleWorkspace } from "@/components/article/ReadOnlyArticleWorkspace";

export default function ReadOnlyArticlePage() {
  const params = useParams<{ articleId: string }>();
  const articleId = params.articleId;

  if (typeof articleId !== "string" || articleId.length === 0) {
    return null;
  }

  return <ReadOnlyArticleWorkspace articleId={articleId} />;
}
