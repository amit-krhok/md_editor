export function readSurfaceElevatedRgb(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--surface-elevated")
    .trim();
  if (raw.startsWith("#") && (raw.length === 4 || raw.length === 7)) {
    return raw;
  }
  return "#ffffff";
}

export function fillCanvasPlane(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = readSurfaceElevatedRgb();
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.restore();
}

export function flattenCanvasToPngDataUrl(source: HTMLCanvasElement): string {
  const w = source.width;
  const h = source.height;
  const flat = document.createElement("canvas");
  flat.width = w;
  flat.height = h;
  const fctx = flat.getContext("2d");
  if (!fctx) return "";
  fctx.fillStyle = readSurfaceElevatedRgb();
  fctx.fillRect(0, 0, w, h);
  fctx.drawImage(source, 0, 0);
  return flat.toDataURL("image/png");
}

/** Width available for the canvas inside a padded wrapper, minus border slack. */
export function contentWidthForCanvas(
  wrap: HTMLElement,
  borderInsetCssPx: number,
): number {
  const cs = getComputedStyle(wrap);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const inner = wrap.clientWidth - pl - pr;
  return Math.max(0, inner - borderInsetCssPx);
}
