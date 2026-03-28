"use client";

import { createPortal } from "react-dom";

import { IconChevronRight } from "./LibraryIcons";

type Props = {
  onExpand: () => void;
};

/**
 * Portals to document.body so parent `overflow-hidden` (protected layout shell)
 * cannot clip the control. Sits top-left under the app header (`h-10` + gap + safe-area).
 */
export function LibraryExpandFab({ onExpand }: Props) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <button
      type="button"
      className="library-fab fixed z-[90]"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 2.5rem + 0.5rem)",
        left: "max(0.5rem, env(safe-area-inset-left, 0px))",
      }}
      aria-label="Show library"
      onClick={onExpand}
    >
      <IconChevronRight />
    </button>,
    document.body,
  );
}
