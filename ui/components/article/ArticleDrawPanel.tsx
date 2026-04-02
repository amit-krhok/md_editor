"use client";

import { useState } from "react";

import {
  BRUSH_PX,
  ERASER_PX,
} from "@/components/article/drawing/drawing-constants";
import {
  useDrawingCanvas,
  type DrawingTool,
} from "@/components/article/drawing/useDrawingCanvas";
import {
  IconEraser,
  IconPencil,
  IconRedo,
  IconUndo,
  IconX,
} from "@/components/library/LibraryIcons";
import { useActiveArticle } from "@/components/providers/ActiveArticleContext";

/** Bright, modern swatches; default (0) is orange. */
const PEN_COLORS = [
  "#f97316",
  "#38bdf8",
  "#a78bfa",
  "#4ade80",
  "#fb7185",
] as const;

function drawToolButtonClass(active: boolean): string {
  return [
    "library-toolbar-btn !h-7 !w-7 !min-h-0 !min-w-0 !p-0 rounded",
    active
      ? "bg-accent/15 text-accent ring-1 ring-accent/35"
      : "text-muted",
  ].join(" ");
}

export function ArticleDrawPanel() {
  const { insertMarkdownAtDrawAnchorRef, setArticleEditorMode } =
    useActiveArticle();
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [colorIndex, setColorIndex] = useState(0);

  const penColor = PEN_COLORS[colorIndex] ?? PEN_COLORS[0];

  const draw = useDrawingCanvas({
    tool,
    penColor,
    brushPx: BRUSH_PX,
    eraserPx: ERASER_PX,
  });

  const insertDrawing = () => {
    const dataUrl = draw.exportPngDataUrl();
    if (!dataUrl) return;
    const md = `![drawing](${dataUrl})`;
    insertMarkdownAtDrawAnchorRef.current?.(md);
    setArticleEditorMode("write");
  };

  return (
    <div className="mb-6 rounded-lg border border-border bg-surface-elevated/60 shadow-sm dark:bg-surface-elevated/40">
      <div className="flex flex-col gap-2 border-b border-border/80 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pb-0.5 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
          <div className="flex items-center gap-1 rounded-md border border-border/90 bg-surface p-0.5">
            <button
              type="button"
              className={drawToolButtonClass(tool === "pen")}
              aria-pressed={tool === "pen"}
              aria-label="Pen"
              title="Pen"
              onClick={() => setTool("pen")}
            >
              <IconPencil className="size-3.5" />
            </button>
            <button
              type="button"
              className={drawToolButtonClass(tool === "eraser")}
              aria-pressed={tool === "eraser"}
              aria-label="Eraser"
              title="Eraser"
              onClick={() => setTool("eraser")}
            >
              <IconEraser className="size-3.5" />
            </button>
          </div>

          <div
            className="flex items-center gap-1.5"
            role="group"
            aria-label="Pen colors"
          >
            {PEN_COLORS.map((hex, i) => (
              <button
                key={hex}
                type="button"
                className={[
                  "size-6 shrink-0 rounded-full border-2 transition-[box-shadow,transform]",
                  colorIndex === i
                    ? "border-accent shadow-[0_0_0_1px_var(--accent)] scale-105"
                    : "border-white/25 ring-1 ring-black/10 dark:ring-white/15",
                ].join(" ")}
                style={{ backgroundColor: hex }}
                aria-label={`Pen color ${i + 1}`}
                title={hex}
                onClick={() => {
                  setColorIndex(i);
                  setTool("pen");
                }}
              />
            ))}
          </div>

          <div className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="library-toolbar-btn !h-7 !min-h-0 rounded px-2 text-xs"
              disabled={!draw.canUndo}
              aria-label="Undo stroke"
              title="Undo"
              onClick={draw.undo}
            >
              <IconUndo className="size-3.5" />
            </button>
            <button
              type="button"
              className="library-toolbar-btn !h-7 !min-h-0 rounded px-2 text-xs"
              disabled={!draw.canRedo}
              aria-label="Redo stroke"
              title="Redo"
              onClick={draw.redo}
            >
              <IconRedo className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-stretch gap-2 sm:ml-auto sm:w-auto sm:items-center sm:justify-start">
          <button
            type="button"
            className="app-btn app-btn--secondary min-h-8 flex-1 px-2 text-xs sm:flex-initial sm:px-3"
            onClick={draw.clearCanvas}
          >
            Clear
          </button>
          <button
            type="button"
            className="app-btn app-btn--primary min-h-8 flex-[2] px-2 text-xs sm:flex-initial sm:px-3"
            onClick={insertDrawing}
            aria-label="Insert drawing into document"
          >
            <span className="sm:hidden">Insert</span>
            <span className="hidden sm:inline">Insert into document</span>
          </button>
          <button
            type="button"
            className="library-toolbar-btn !h-8 !w-8 !min-h-0 !min-w-0 shrink-0 rounded-md text-muted hover:text-foreground"
            aria-label="Close draw mode"
            title="Close draw mode"
            onClick={() => setArticleEditorMode("write")}
          >
            <IconX className="size-4" />
          </button>
        </div>
      </div>

      <div ref={draw.wrapRef} className="w-full px-3 pb-3 pt-2">
        <canvas
          ref={draw.canvasRef}
          className="touch-none cursor-crosshair rounded-md border border-border/70 bg-[var(--surface-elevated)]"
          onPointerDown={draw.onPointerDown}
          onPointerMove={draw.onPointerMove}
          onPointerUp={draw.onPointerUp}
          onPointerCancel={draw.onPointerCancel}
        />
        <p className="mt-2 text-center text-[11px] leading-snug text-muted">
          Place the cursor in the article, then open draw mode. Inserts as{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[10px]">
            ![drawing](data:image/png;…)
          </code>
        </p>
      </div>
    </div>
  );
}
