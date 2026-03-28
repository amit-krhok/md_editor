import type { ReactNode } from "react";

import { GuestGuard } from "@/components/auth/GuestGuard";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface px-[length:var(--spacing-page)] py-[length:var(--spacing-section)]">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </GuestGuard>
  );
}
