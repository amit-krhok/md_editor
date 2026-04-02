"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CANVAS_BORDER_INSET_CSS_PX,
  CANVAS_HEIGHT_CSS_PX,
  CANVAS_MIN_WIDTH_CSS_PX,
  MAX_DEVICE_PIXEL_RATIO,
  MAX_UNDO,
  RESIZE_DEBOUNCE_MS,
} from "@/components/article/drawing/drawing-constants";
import {
  contentWidthForCanvas,
  fillCanvasPlane,
  flattenCanvasToPngDataUrl,
} from "@/components/article/drawing/canvas-utils";

export type DrawingTool = "pen" | "eraser";

export type UseDrawingCanvasOptions = {
  tool: DrawingTool;
  penColor: string;
  brushPx: number;
  eraserPx: number;
  maxUndo?: number;
};

export function useDrawingCanvas({
  tool,
  penColor,
  brushPx,
  eraserPx,
  maxUndo = MAX_UNDO,
}: UseDrawingCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const layoutCanvas = useCallback((opts?: { preserveDrawing?: boolean }) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const preserve = opts?.preserveDrawing ?? false;
    const prevSnapshot =
      preserve && canvas.width > 0 && canvas.height > 0
        ? canvas.toDataURL("image/png")
        : null;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const inner = contentWidthForCanvas(wrap, CANVAS_BORDER_INSET_CSS_PX);
    const cssW = Math.max(CANVAS_MIN_WIDTH_CSS_PX, Math.floor(inner));
    const cssH = CANVAS_HEIGHT_CSS_PX;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    fillCanvasPlane(ctx, cssW, cssH);

    if (prevSnapshot) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, cssW, cssH);
      };
      img.src = prevSnapshot;
    }

    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const clearCanvas = useCallback(() => {
    layoutCanvas({ preserveDrawing: false });
  }, [layoutCanvas]);

  useEffect(() => {
    layoutCanvas({ preserveDrawing: false });
    const wrap = wrapRef.current;
    if (!wrap) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (t != null) clearTimeout(t);
      t = setTimeout(() => {
        layoutCanvas({ preserveDrawing: true });
        t = null;
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(wrap);
    return () => {
      if (t != null) clearTimeout(t);
      ro.disconnect();
    };
  }, [layoutCanvas]);

  const pushUndoSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => {
      const next = [...prev, snap];
      if (next.length > maxUndo) next.shift();
      return next;
    });
    setRedoStack([]);
  }, [maxUndo]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, current]);
      ctx.putImageData(last, 0, 0);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const last = prev[prev.length - 1];
      setUndoStack((u) => [...u, current]);
      ctx.putImageData(last, 0, 0);
      return prev.slice(0, -1);
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawingRef.current = true;
      lastRef.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
      pushUndoSnapshot();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = eraserPx;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = penColor;
        ctx.lineWidth = brushPx;
      }
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
    },
    [brushPx, eraserPx, penColor, pushUndoSnapshot, tool],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx || !lastRef.current) return;
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      lastRef.current = { x, y };
    },
    [],
  );

  const endStroke = useCallback(() => {
    drawingRef.current = false;
    lastRef.current = null;
  }, []);

  const exportPngDataUrl = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return flattenCanvasToPngDataUrl(canvas) || null;
  }, []);

  return {
    canvasRef,
    wrapRef,
    clearCanvas,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    onPointerDown,
    onPointerMove,
    onPointerUp: endStroke,
    onPointerCancel: endStroke,
    exportPngDataUrl,
  };
}
