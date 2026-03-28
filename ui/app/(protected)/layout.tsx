import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader } from "@/components/layout/AppHeader";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-surface">
        <AppHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-[length:var(--spacing-page)] py-[length:var(--spacing-section)]">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
