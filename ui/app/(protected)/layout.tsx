import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { LibraryPane } from "@/components/library/LibraryPane";
import { AppHeader } from "@/components/layout/AppHeader";
import { ArticleSearchPalette } from "@/components/layout/ArticleSearchPalette";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { GlobalShortcuts } from "@/components/shortcuts/GlobalShortcuts";
import { ActiveArticleProvider } from "@/components/providers/ActiveArticleContext";
import { LibraryPaneUiProvider } from "@/components/providers/LibraryPaneUiContext";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <ActiveArticleProvider>
        <LibraryPaneUiProvider>
          <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-surface">
            <div className="hidden md:block">
              <AppHeader />
            </div>
            <ArticleSearchPalette />
            <GlobalShortcuts />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
              <LibraryPane />
              <main className="mx-auto min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-[length:var(--spacing-page)] pt-[length:var(--spacing-section)] pb-[calc(var(--spacing-section)+4.25rem)] md:py-[length:var(--spacing-section)] scrollbar-hidden">
                {children}
              </main>
            </div>
            <MobileBottomBar />
          </div>
        </LibraryPaneUiProvider>
      </ActiveArticleProvider>
    </AuthGuard>
  );
}
