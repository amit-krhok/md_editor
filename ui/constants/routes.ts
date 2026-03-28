export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
