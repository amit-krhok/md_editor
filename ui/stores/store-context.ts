"use client";

import { createContext, useContext } from "react";

import type { RootStore } from "./RootStore";

export const StoreContext = createContext<RootStore | null>(null);

export function useStore(): RootStore {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}

export function useAuthStore() {
  return useStore().authStore;
}

export function useThemeStore() {
  return useStore().themeStore;
}
