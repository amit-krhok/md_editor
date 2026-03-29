"use client";

import { observer } from "mobx-react-lite";
import { useEffect, type ReactNode } from "react";

import { reconfigureCodeBlockEditorThemes } from "@/components/article/milkdown-plugins";
import { useThemeStore } from "@/stores/store-context";

/**
 * Applies `dark` on <html> from MobX theme (client + localStorage only).
 */
export const ThemeRoot = observer(function ThemeRoot({
  children,
}: {
  children: ReactNode;
}) {
  const theme = useThemeStore();

  useEffect(() => {
    theme.hydrate();
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme.theme === "dark");
    queueMicrotask(() => reconfigureCodeBlockEditorThemes());
  }, [theme.theme]);

  return <>{children}</>;
});
