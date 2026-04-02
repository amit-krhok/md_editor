"use client";

import { useEffect } from "react";

import { SHORTCUT_DEFINITIONS } from "@/lib/shortcuts/shortcutRegistry";

export function GlobalShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (!(e.metaKey || e.ctrlKey)) return;

      const keyLower = e.key.toLowerCase();
      const matched = SHORTCUT_DEFINITIONS.find((d) => d.keyLower === keyLower);
      if (!matched) return;

      if (matched.requireAlt && !e.altKey) return;
      if (matched.requireShift && !e.shiftKey) return;

      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent(matched.eventName, { detail: matched.detail }),
      );
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
