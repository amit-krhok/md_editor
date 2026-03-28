import type { ArticlePublic } from "@/types/article.types";

import { apiJson } from "./http";

/** Articles not assigned to any folder (root library list). */
export async function listArticlesWithoutFolder(
  token: string,
): Promise<ArticlePublic[]> {
  return apiJson<ArticlePublic[]>("/articles/?without_folder=true", { token });
}

export async function listArticlesInFolder(
  token: string,
  folderId: string,
): Promise<ArticlePublic[]> {
  const q = new URLSearchParams({ folder_id: folderId });
  return apiJson<ArticlePublic[]>(`/articles/?${q.toString()}`, { token });
}

export async function createArticle(
  token: string,
  payload: { title: string; folderId?: string | null },
): Promise<ArticlePublic> {
  return apiJson<ArticlePublic>("/articles/", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title,
      content: "",
      folder_id: payload.folderId ?? null,
    }),
  });
}

export async function getArticle(
  token: string,
  articleId: string,
): Promise<ArticlePublic> {
  return apiJson<ArticlePublic>(`/articles/${articleId}`, { token });
}

export async function updateArticle(
  token: string,
  articleId: string,
  body: { title?: string; content?: string },
): Promise<ArticlePublic> {
  return apiJson<ArticlePublic>(`/articles/${articleId}`, {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteArticle(
  token: string,
  articleId: string,
): Promise<void> {
  await apiJson<void>(`/articles/${articleId}`, {
    method: "DELETE",
    token,
  });
}
