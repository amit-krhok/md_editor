"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/ui/Button";

type DropdownMenuContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
  null,
);

function useDropdownMenu(): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error("DropdownMenu components must be used inside DropdownMenu");
  }
  return ctx;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-flex" ref={containerRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className = "",
  ariaLabel,
  /** Use pane-style native button (visible strokes); avoids app-btn + utility fights. */
  plain = false,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  plain?: boolean;
}) {
  const { open, toggle } = useDropdownMenu();
  if (plain) {
    return (
      <button
        type="button"
        className={["library-toolbar-btn", className].filter(Boolean).join(" ")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={toggle}
      >
        {children}
      </button>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={ariaLabel}
      onClick={toggle}
    >
      {children}
    </Button>
  );
}

export function DropdownMenuContent({
  align = "end",
  className = "",
  children,
}: {
  align?: "start" | "end";
  className?: string;
  children: ReactNode;
}) {
  const { open } = useDropdownMenu();
  if (!open) return null;
  const alignClass = align === "end" ? "right-0" : "left-0";
  return (
    <div
      role="menu"
      className={`absolute top-full z-50 mt-1 min-w-40 rounded-md border border-border bg-surface-elevated py-1 shadow-lg ${alignClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className = "",
  disabled,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const { close } = useDropdownMenu();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted/15 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      onClick={() => {
        if (disabled) return;
        onClick?.();
        close();
      }}
    >
      {children}
    </button>
  );
}
