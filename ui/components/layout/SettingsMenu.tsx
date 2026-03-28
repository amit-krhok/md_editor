"use client";

import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore, useThemeStore } from "@/stores/store-context";
import { Button } from "@/ui/Button";

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

type Props = {
  /** When false, only theme options are shown (e.g. guest auth pages). */
  showSignOut?: boolean;
};

export const SettingsMenu = observer(function SettingsMenu({
  showSignOut = true,
}: Props) {
  const auth = useAuthStore();
  const theme = useThemeStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        className="app-btn--icon h-7 min-w-7 px-1.5"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Settings"
        onClick={() => setOpen((v) => !v)}
      >
        <SettingsIcon className="size-4 text-foreground" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 min-w-40 rounded-md border border-border bg-surface-elevated py-1 shadow-lg"
        >
          {showSignOut && auth.user && (
            <div
              className="max-w-[min(100vw-2rem,16rem)] truncate border-b border-border px-3 py-2 text-xs text-muted"
              role="presentation"
            >
              {auth.user.email}
            </div>
          )}
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={theme.theme === "dark"}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground hover:bg-muted/15"
            onClick={() => theme.toggle()}
          >
            <span>Dark mode</span>
            <span
              className={[
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border p-0.5 transition-colors",
                theme.theme === "dark" ? "bg-foreground/15" : "bg-muted/40",
              ].join(" ")}
              aria-hidden
            >
              <span
                className={[
                  "block size-4 rounded-full bg-foreground shadow-sm transition-transform",
                  theme.theme === "dark" ? "translate-x-4" : "translate-x-0",
                ].join(" ")}
              />
            </span>
          </button>
          {showSignOut && auth.user && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/15"
                onClick={() => {
                  auth.logout();
                  close();
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});
