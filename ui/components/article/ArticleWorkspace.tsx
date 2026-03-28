"use client";

import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { getArticle } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/http";
import { useActiveArticle } from "@/components/providers/ActiveArticleContext";
import { useAuthStore } from "@/stores/store-context";
import type { ArticlePublic } from "@/types/article.types";
import { Spinner } from "@/ui/Spinner";

type Props = {
  articleId: string;
};

export const ArticleWorkspace = observer(function ArticleWorkspace({
  articleId,
}: Props) {
  const auth = useAuthStore();
  const token = auth.token;
  const { snapshot, setSnapshot } = useActiveArticle();
  const [article, setArticle] = useState<ArticlePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !articleId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setArticle(null);
    void (async () => {
      try {
        const a = await getArticle(token, articleId);
        if (!cancelled) setArticle(a);
      } catch (e) {
        if (!cancelled) {
          setArticle(null);
          setError(
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not load file",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, articleId]);

  useEffect(() => {
    return () => {
      setSnapshot(null);
    };
  }, [articleId, setSnapshot]);

  useEffect(() => {
    if (!article || article.id !== articleId) return;
    setSnapshot({ id: article.id, title: article.title });
  }, [article, articleId, setSnapshot]);

  useEffect(() => {
    if (snapshot == null || snapshot.id !== articleId) return;
    setArticle((a) => {
      if (!a || a.id !== snapshot.id) return a;
      if (a.title === snapshot.title) return a;
      return { ...a, title: snapshot.title };
    });
  }, [articleId, snapshot]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-xl flex-1 py-12 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 py-6">
      <div className="min-h-[12rem] flex-1 p-4">
        {article.content ? (
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
            {article.content}
          </pre>
        ) : (
          <p className="text-sm text-muted">No content yet.</p>
        )}
      </div>
    </div>
  );
});
