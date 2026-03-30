export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  /** Article editor/view by id (UUID path segment). */
  article: (articleId: string) => `/${articleId}` as const,
  readOnlyArticle: (articleId: string) =>
    `/read-only/article/${articleId}` as const,
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
