"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useActiveArticle } from "@/components/providers/ActiveArticleContext";
import { printArticleMarkdown } from "@/lib/print-article-markdown";
import { Button } from "@/ui/Button";

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
  articleTitle: string;
};

export function ShareMenu({ articleTitle }: Props) {
  const { openArticleMarkdownRef } = useActiveArticle();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const exportPdf = useCallback(() => {
    setOpen(false);
    printArticleMarkdown(articleTitle, openArticleMarkdownRef.current);
  }, [articleTitle, openArticleMarkdownRef]);

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
        </div>
      ) : null}
    </div>
  );
}
