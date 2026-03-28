import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { LibraryPane } from "@/components/library/LibraryPane";
import { AppHeader } from "@/components/layout/AppHeader";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-surface">
        <AppHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <LibraryPane />
          <main className="mx-auto min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-[length:var(--spacing-page)] py-[length:var(--spacing-section)]">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
