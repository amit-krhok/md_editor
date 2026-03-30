import { highlightMarkdownHandler } from "@/components/article/highlight-support";

type MarkdownHandlers = Record<string, unknown>;

export function buildArticleMarkdownHandlers(
  existing?: MarkdownHandlers,
): MarkdownHandlers {
  return {
    ...existing,
    highlight: highlightMarkdownHandler,
  };
}
