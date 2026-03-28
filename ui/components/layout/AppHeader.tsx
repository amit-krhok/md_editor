"use client";

import { observer } from "mobx-react-lite";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/store-context";
import { Button } from "@/ui/Button";

import { ThemeToggle } from "./ThemeToggle";

export const AppHeader = observer(function AppHeader() {
  const auth = useAuthStore();
  return (
    <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-[length:var(--spacing-page)]">
        <Link
          href={ROUTES.home}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          md_editor
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {auth.user && (
            <span className="max-w-[200px] truncate text-xs text-muted">
              {auth.user.email}
            </span>
          )}
          <Button variant="ghost" className="h-9 px-3 text-xs" onClick={() => auth.logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
});
