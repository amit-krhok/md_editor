"use client";

import { observer } from "mobx-react-lite";

import { useThemeStore } from "@/stores/store-context";
import { Button } from "@/ui/Button";

export const ThemeToggle = observer(function ThemeToggle() {
  const theme = useThemeStore();
  const isDark = theme.theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-9 min-w-9 px-2"
      onClick={() => theme.toggle()}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="text-base leading-none" aria-hidden>
        {isDark ? "☀" : "☾"}
      </span>
    </Button>
  );
});
