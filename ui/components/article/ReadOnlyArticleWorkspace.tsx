"use client";

import { useEffect, useState } from "react";

import { ArticleMarkdownEditor } from "@/components/article/ArticleMarkdownEditor";
import { getPublicArticle } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/http";
import { Spinner } from "@/ui/Spinner";

type Props = {
  articleId: string;
};

export function ReadOnlyArticleWorkspace({ articleId }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent("");
    void (async () => {
      try {
        const article = await getPublicArticle(articleId);
        if (!cancelled) {
          setContent(article.content);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not load article",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-0 w-full min-w-0 max-w-5xl px-(--spacing-page) py-(--spacing-section)">
      <ArticleMarkdownEditor
        articleId={`readonly-${articleId}`}
        initialMarkdown={content}
        onMarkdownChange={() => {}}
        readOnly
      />
    </main>
  );
}
