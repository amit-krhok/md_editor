import { marked } from "marked";

marked.setOptions({ gfm: true });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Opens the system print dialog with rendered markdown (use “Save as PDF” on macOS).
 */
export function printArticleMarkdown(title: string, markdown: string): void {
  const bodyHtml = marked.parse(markdown || "", { async: false }) as string;
  const safeTitle = escapeHtml(title || "Untitled");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12mm 14mm;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #111827;
      background: #fff;
    }
    h1.doc-title {
      margin: 0 0 1rem;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    .md-content { max-width: 48rem; margin: 0 auto; }
    .md-content h1, .md-content h2, .md-content h3 { margin: 1.1em 0 0.45em; font-weight: 600; }
    .md-content h1 { font-size: 1.35rem; }
    .md-content h2 { font-size: 1.15rem; }
    .md-content h3 { font-size: 1.05rem; }
    .md-content p { margin: 0.55em 0; }
    .md-content a { color: #2563eb; text-decoration: underline; }
    .md-content code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      padding: 0.12em 0.35em;
      background: #f3f4f6;
      border-radius: 0.25rem;
    }
    .md-content pre {
      margin: 0.75em 0;
      padding: 0.75rem 0.85rem;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 0.35rem;
      overflow-x: auto;
      font-size: 0.82rem;
      line-height: 1.45;
    }
    .md-content pre code { padding: 0; background: none; font-size: inherit; }
    .md-content blockquote {
      margin: 0.65em 0;
      padding-left: 0.85rem;
      border-left: 3px solid #d1d5db;
      color: #4b5563;
    }
    .md-content ul, .md-content ol { margin: 0.5em 0; padding-left: 1.35rem; }
    .md-content li { margin: 0.2em 0; }
    .md-content table { border-collapse: collapse; width: 100%; margin: 0.75em 0; font-size: 0.92em; }
    .md-content th, .md-content td { border: 1px solid #e5e7eb; padding: 0.35rem 0.5rem; text-align: left; }
    .md-content th { background: #f9fafb; font-weight: 600; }
    .md-content img { max-width: 100%; max-height: 280px; height: auto; }
    .md-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.25em 0; }
    .md-content input[type="checkbox"] { margin-right: 0.35em; vertical-align: middle; }
    @page { margin: 14mm; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <main>
    <h1 class="doc-title">${safeTitle}</h1>
    <div class="md-content">${bodyHtml}</div>
  </main>
</body>
</html>`);
  doc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    win.removeEventListener("afterprint", cleanup);
    iframe.remove();
  };

  win.addEventListener("afterprint", cleanup);
  window.setTimeout(cleanup, 120_000);

  win.focus();
  requestAnimationFrame(() => {
    win.print();
  });
}
