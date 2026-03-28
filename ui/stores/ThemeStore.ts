import { makeAutoObservable, runInAction } from "mobx";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { ThemeMode } from "@/types/theme.types";

import type { RootStore } from "./RootStore";

function isThemeMode(v: string | null): v is ThemeMode {
  return v === "light" || v === "dark";
}

export class ThemeStore {
  /** Default is light; optional persistence in localStorage only (not backend). */
  theme: ThemeMode = "light";

  constructor(_root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  hydrate(): void {
    if (typeof window === "undefined") {
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    if (isThemeMode(stored)) {
      runInAction(() => {
        this.theme = stored;
      });
    }
  }

  setTheme(mode: ThemeMode): void {
    this.theme = mode;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.theme, mode);
    }
  }

  toggle(): void {
    this.setTheme(this.theme === "light" ? "dark" : "light");
  }
}
