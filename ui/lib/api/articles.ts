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

export async function searchOwnedArticles(
  token: string,
  query: string,
): Promise<ArticlePublic[]> {
  const q = new URLSearchParams({ query });
  return apiJson<ArticlePublic[]>(`/articles/search?${q.toString()}`, { token });
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
  body: {
    title?: string;
    content?: string;
    folder_id?: string | null;
    is_publicly_accessible?: boolean;
  },
): Promise<ArticlePublic> {
  return apiJson<ArticlePublic>(`/articles/${articleId}`, {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getPublicArticle(articleId: string): Promise<ArticlePublic> {
  return apiJson<ArticlePublic>(`/articles/public/${articleId}`);
}

/** Move article into a folder (`POST /articles/{id}/move`). */
export async function moveArticleToFolder(
  token: string,
  articleId: string,
  folderId: string,
): Promise<ArticlePublic> {
  return apiJson<ArticlePublic>(`/articles/${articleId}/move`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId }),
  });
}

/** Remove article from any folder (library root). */
export async function moveArticleToLibraryRoot(
  token: string,
  articleId: string,
): Promise<ArticlePublic> {
  return updateArticle(token, articleId, { folder_id: null });
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
