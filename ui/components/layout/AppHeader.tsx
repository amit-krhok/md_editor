"use client";

import Link from "next/link";

import { ROUTES } from "@/constants/routes";

import { SettingsMenu } from "./SettingsMenu";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-sm">
      <div className="mx-auto flex h-10 items-center justify-between px-[length:var(--spacing-page)]">
        <Link
          href={ROUTES.home}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          MD Editor
        </Link>
        <div className="flex items-center">
          <SettingsMenu showSignOut />
        </div>
      </div>
    </header>
  );
}
