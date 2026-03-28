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
