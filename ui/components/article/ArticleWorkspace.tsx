"use client";

import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArticleMarkdownEditor } from "@/components/article/ArticleMarkdownEditor";
import { getArticle, updateArticle } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/http";
import { useActiveArticle } from "@/components/providers/ActiveArticleContext";
import { useAuthStore } from "@/stores/store-context";
import type { ArticlePublic } from "@/types/article.types";
import { Spinner } from "@/ui/Spinner";

const SAVE_DEBOUNCE_MS = 850;
const SAVED_INDICATOR_MS = 2000;

type Props = {
  articleId: string;
};

export const ArticleWorkspace = observer(function ArticleWorkspace({
  articleId,
}: Props) {
  const auth = useAuthStore();
  const token = auth.token;
  const {
    snapshot,
    setSnapshot,
    setContentSaveStatus,
    openArticleMarkdownRef,
  } = useActiveArticle();
  const [article, setArticle] = useState<ArticlePublic | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef("");
  const lastSavedRef = useRef("");
  const savedIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  contentRef.current = content;

  useEffect(() => {
    openArticleMarkdownRef.current = content;
    return () => {
      openArticleMarkdownRef.current = "";
    };
  }, [content, openArticleMarkdownRef]);

  const clearSavedIdleTimer = useCallback(() => {
    if (savedIdleTimerRef.current != null) {
      clearTimeout(savedIdleTimerRef.current);
      savedIdleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!token || !articleId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setArticle(null);
    setContent("");
    lastSavedRef.current = "";
    clearSavedIdleTimer();
    setContentSaveStatus("idle");
    void (async () => {
      try {
        const a = await getArticle(token, articleId);
        if (!cancelled) {
          setArticle(a);
          setContent(a.content);
          lastSavedRef.current = a.content;
        }
      } catch (e) {
        if (!cancelled) {
          setArticle(null);
          setContent("");
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
  }, [token, articleId, clearSavedIdleTimer, setContentSaveStatus]);

  useEffect(() => {
    return () => {
      setSnapshot(null);
      clearSavedIdleTimer();
      setContentSaveStatus("idle");
    };
  }, [articleId, setSnapshot, clearSavedIdleTimer, setContentSaveStatus]);

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

  useEffect(() => {
    if (
      !token ||
      !articleId ||
      loading ||
      !article ||
      article.id !== articleId
    ) {
      return;
    }
    if (content === lastSavedRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const toSave = contentRef.current;
      if (toSave === lastSavedRef.current) return;

      clearSavedIdleTimer();
      setContentSaveStatus("saving");

      void (async () => {
        try {
          const updated = await updateArticle(token, articleId, {
            content: toSave,
          });
          if (contentRef.current !== toSave) {
            setContentSaveStatus("idle");
            return;
          }
          lastSavedRef.current = toSave;
          setArticle((prev) =>
            prev && prev.id === articleId
              ? { ...prev, content: updated.content }
              : prev,
          );
          setContentSaveStatus("saved");
          savedIdleTimerRef.current = setTimeout(() => {
            setContentSaveStatus("idle");
            savedIdleTimerRef.current = null;
          }, SAVED_INDICATOR_MS);
        } catch {
          setContentSaveStatus("idle");
        }
      })();
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    content,
    token,
    articleId,
    article,
    loading,
    setContentSaveStatus,
    clearSavedIdleTimer,
  ]);

  const onContentChange = useCallback(
    (value: string) => {
      clearSavedIdleTimer();
      setContent(value);
      setContentSaveStatus((s) => (s === "saved" ? "idle" : s));
    },
    [clearSavedIdleTimer, setContentSaveStatus],
  );

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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col py-4">
      <ArticleMarkdownEditor
        articleId={articleId}
        initialMarkdown={content}
        onMarkdownChange={onContentChange}
      />
    </div>
  );
});
