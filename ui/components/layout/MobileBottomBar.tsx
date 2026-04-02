"use client";

import { usePathname } from "next/navigation";

import { IconFileText, IconPlus } from "@/components/library/LibraryIcons";
import {
  useActiveArticle,
  type ActiveArticleSnapshot,
} from "@/components/providers/ActiveArticleContext";
import { useLibraryPaneUi } from "@/components/providers/LibraryPaneUiContext";
import {
  OPEN_ARTICLE_SEARCH_EVENT,
  OPEN_CREATE_FILE_EVENT,
} from "@/lib/shortcuts/shortcutRegistry";

import { SettingsMenu } from "./SettingsMenu";
import { ShareMenu } from "./ShareMenu";

const ARTICLE_PATH_UUID_RE =
  /^\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function itemClass(active = false) {
  return [
    "inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl border px-2",
    active
      ? "border-accent/45 bg-accent/10 text-foreground"
      : "border-transparent text-muted",
  ].join(" ");
}

function showShare(snapshot: ActiveArticleSnapshot | null, pathname: string) {
  const articleIdFromPath = pathname.match(ARTICLE_PATH_UUID_RE)?.[1] ?? null;
  return (
    articleIdFromPath != null && snapshot != null && snapshot.id === articleIdFromPath
  );
}

export function MobileBottomBar() {
  const pathname = usePathname() ?? "";
  const { snapshot, setSnapshot } = useActiveArticle();
  const { libraryCollapsed, expandLibrary, collapseLibrary } = useLibraryPaneUi();
  const hasShare = showShare(snapshot, pathname);
  const shareSnapshot = hasShare && snapshot ? snapshot : null;

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-border/90 bg-surface-elevated/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      aria-label="Mobile actions"
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-1.5">
        <button
          type="button"
          className={itemClass(!libraryCollapsed)}
          aria-label={libraryCollapsed ? "Open library" : "Close library"}
          onClick={() => (libraryCollapsed ? expandLibrary() : collapseLibrary())}
        >
          <IconFileText className="size-4" />
        </button>
        <button
          type="button"
          className={itemClass()}
          aria-label="Search"
          onClick={() => window.dispatchEvent(new Event(OPEN_ARTICLE_SEARCH_EVENT))}
        >
          <SearchIcon className="size-4" />
        </button>
        <button
          type="button"
          className={itemClass()}
          aria-label="Create file"
          onClick={() => window.dispatchEvent(new Event(OPEN_CREATE_FILE_EVENT))}
        >
          <IconPlus className="size-4" />
        </button>
        {shareSnapshot ? (
          <div className="flex flex-1 justify-center">
            <ShareMenu
              articleId={shareSnapshot.id}
              articleTitle={shareSnapshot.title}
              initialIsPubliclyAccessible={shareSnapshot.isPubliclyAccessible}
              onPublicAccessibilityChange={(isPublic) =>
                setSnapshot((prev) =>
                  prev && prev.id === shareSnapshot.id
                    ? { ...prev, isPubliclyAccessible: isPublic }
                    : prev,
                )
              }
              triggerClassName="!h-11 !w-full !max-w-none rounded-xl border border-transparent text-muted"
            />
          </div>
        ) : null}
        <div className="flex flex-1 justify-center">
          <SettingsMenu
            showSignOut
            triggerClassName="!h-11 !w-full !max-w-none rounded-xl border border-transparent text-muted"
          />
        </div>
      </div>
    </nav>
  );
}
