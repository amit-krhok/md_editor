"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { searchOwnedArticles } from "@/lib/api/articles";
import { useArrowListNavigation } from "@/lib/useArrowListNavigation";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/stores/store-context";
import type { ArticlePublic } from "@/types/article.types";
import { OPEN_ARTICLE_SEARCH_EVENT } from "@/lib/shortcuts/shortcutRegistry";
import { Input } from "@/ui/Input";
import { Modal } from "@/ui/Modal";
import { Spinner } from "@/ui/Spinner";

export function ArticleSearchPalette() {
  const auth = useAuthStore();
  const token = auth.token;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticlePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
  }, []);

  const navigateToResult = useCallback(
    (articleId: string) => {
      router.push(ROUTES.article(articleId));
      closeSearch();
    },
    [router, closeSearch],
  );

  const {
    activeIndex,
    setActiveIndex,
    onKeyDown: onSearchKeyDown,
  } = useArrowListNavigation({
    itemCount: results.length,
    onEnter: (index) => {
      const hit = results[index];
      if (hit) {
        navigateToResult(hit.id);
      }
    },
    onEscape: closeSearch,
  });

  useEffect(() => {
    const onOpen = () => openSearch();
    window.addEventListener(OPEN_ARTICLE_SEARCH_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ARTICLE_SEARCH_EVENT, onOpen);
  }, [openSearch]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open || !token) return;
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const debounceId = window.setTimeout(() => {
      void (async () => {
        try {
          const list = await searchOwnedArticles(token, trimmed);
          if (!cancelled) {
            setResults(list);
            setActiveIndex(0);
          }
        } catch (e) {
          if (!cancelled) {
            setError(
              e instanceof ApiError
                ? e.message
                : e instanceof Error
                  ? e.message
                  : "Could not search articles",
            );
            setResults([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(debounceId);
    };
  }, [open, token, query, setActiveIndex]);

  return (
    <Modal open={open} onClose={closeSearch} title="Search articles">
      <div className="space-y-2">
        <Input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Type to search..."
          className="h-9"
        />
        <div className="max-h-80 overflow-y-auto rounded-md border border-border bg-surface scrollbar-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-5">
              <Spinner className="size-4" />
            </div>
          ) : error ? (
            <p className="px-3 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : query.trim().length === 0 ? (
            <></>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">No results</p>
          ) : (
            <ul className="py-1">
              {results.map((article, index) => (
                <li key={article.id}>
                  <button
                    type="button"
                    className={`w-full truncate px-3 py-2 text-left text-sm ${
                      index === activeIndex
                        ? "bg-accent/10 text-foreground"
                        : "text-foreground hover:bg-muted/15"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateToResult(article.id)}
                  >
                    {article.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
