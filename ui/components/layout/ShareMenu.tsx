"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useActiveArticle } from "@/components/providers/ActiveArticleContext";
import { ROUTES } from "@/constants/routes";
import { getArticle, updateArticle } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/http";
import { printArticleMarkdown } from "@/lib/print-article-markdown";
import { useAuthStore } from "@/stores/store-context";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";

/** macOS-style “square and arrow up” share glyph (stroke, SF-like). */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3v9.5" />
      <path d="m7.5 8 4.5-4.5L16.5 8" />
      <rect x="4" y="14" width="16" height="7" rx="2" ry="2" />
    </svg>
  );
}

type Props = {
  articleId: string;
  articleTitle: string;
  initialIsPubliclyAccessible: boolean;
  onPublicAccessibilityChange?: (isPublic: boolean) => void;
};

export function ShareMenu({
  articleId,
  articleTitle,
  initialIsPubliclyAccessible,
  onPublicAccessibilityChange,
}: Props) {
  const auth = useAuthStore();
  const token = auth.token;
  const { openArticleMarkdownRef } = useActiveArticle();
  const [open, setOpen] = useState(false);
  const [publicEnabled, setPublicEnabled] = useState(initialIsPubliclyAccessible);
  const [publicStateLoading, setPublicStateLoading] = useState(false);
  const [publicStateBusy, setPublicStateBusy] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [confirmEnableOpen, setConfirmEnableOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onPublicAccessibilityChangeRef = useRef(onPublicAccessibilityChange);

  useEffect(() => {
    onPublicAccessibilityChangeRef.current = onPublicAccessibilityChange;
  }, [onPublicAccessibilityChange]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setPublicEnabled(initialIsPubliclyAccessible);
  }, [initialIsPubliclyAccessible, articleId]);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setPublicStateLoading(true);
    setPublicError(null);
    void (async () => {
      try {
        const article = await getArticle(token, articleId);
        if (!cancelled) {
          setPublicEnabled(article.is_publicly_accessible);
          onPublicAccessibilityChangeRef.current?.(
            article.is_publicly_accessible,
          );
        }
      } catch (e) {
        if (!cancelled) {
          setPublicError(
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not load sharing state",
          );
        }
      } finally {
        if (!cancelled) {
          setPublicStateLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, token, articleId]);

  const exportPdf = useCallback(() => {
    setOpen(false);
    printArticleMarkdown(articleTitle, openArticleMarkdownRef.current);
  }, [articleTitle, openArticleMarkdownRef]);

  const setPublicReadable = useCallback(
    async (nextPublicState: boolean) => {
      if (!token || publicStateBusy) return;
      setPublicStateBusy(true);
      setPublicError(null);
      try {
        const updated = await updateArticle(token, articleId, {
          is_publicly_accessible: nextPublicState,
        });
        setPublicEnabled(updated.is_publicly_accessible);
        onPublicAccessibilityChangeRef.current?.(updated.is_publicly_accessible);
      } catch (e) {
        setPublicError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not update sharing settings",
        );
      } finally {
        setPublicStateBusy(false);
      }
    },
    [token, publicStateBusy, articleId],
  );

  const togglePublicReadable = useCallback(async () => {
    if (!token || publicStateBusy) return;
    const nextPublicState = !publicEnabled;
    if (nextPublicState) {
      setOpen(false);
      setConfirmEnableOpen(true);
      return;
    }
    await setPublicReadable(false);
  }, [token, publicStateBusy, publicEnabled, setPublicReadable]);

  const copyPublicUrl = useCallback(async () => {
    const url = `${window.location.origin}${ROUTES.readOnlyArticle(articleId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setOpen(false);
    } catch {
      setPublicError("Could not copy URL");
    }
  }, [articleId]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        className="app-btn--icon !h-7 !max-h-7 !min-h-0 !min-w-7 !w-7 !max-w-7 !p-0"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Share"
        title="Share"
        onClick={() => setOpen((v) => !v)}
      >
        <ShareIcon className="size-3.5 text-foreground" />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[300] mt-1 min-w-44 rounded-md border border-border bg-surface-elevated py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/15"
            onClick={exportPdf}
          >
            Export to PDF
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/15 disabled:opacity-60"
            disabled={publicStateLoading || publicStateBusy}
            onClick={() => void togglePublicReadable()}
          >
            {publicStateBusy
              ? "Updating..."
              : publicEnabled
                ? "Disable public read access"
                : "Make publicly readable"}
          </button>
          {publicEnabled ? (
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/15"
              onClick={() => void copyPublicUrl()}
            >
              Copy public URL
            </button>
          ) : null}
          {publicError ? (
            <p className="px-3 py-1 text-xs text-red-600 dark:text-red-400">
              {publicError}
            </p>
          ) : null}
        </div>
      ) : null}
      <Modal
        open={confirmEnableOpen}
        onClose={() => {
          if (!publicStateBusy) {
            setConfirmEnableOpen(false);
          }
        }}
        title="Make file public?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={publicStateBusy}
              onClick={() => setConfirmEnableOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={publicStateBusy}
              onClick={() => {
                void (async () => {
                  await setPublicReadable(true);
                  setConfirmEnableOpen(false);
                })();
              }}
            >
              Make public
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Anyone with this link can view{" "}
          <span className="font-medium text-foreground">{articleTitle}</span>.
        </p>
      </Modal>
    </div>
  );
}
