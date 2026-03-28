"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  libraryCollapsed: boolean;
  expandLibrary: () => void;
  collapseLibrary: () => void;
};

const LibraryPaneUiContext = createContext<Ctx | null>(null);

export function LibraryPaneUiProvider({ children }: { children: ReactNode }) {
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const expandLibrary = useCallback(() => setLibraryCollapsed(false), []);
  const collapseLibrary = useCallback(() => setLibraryCollapsed(true), []);

  const value = useMemo(
    () => ({
      libraryCollapsed,
      expandLibrary,
      collapseLibrary,
    }),
    [libraryCollapsed, expandLibrary, collapseLibrary],
  );

  return (
    <LibraryPaneUiContext.Provider value={value}>
      {children}
    </LibraryPaneUiContext.Provider>
  );
}

export function useLibraryPaneUi(): Ctx {
  const ctx = useContext(LibraryPaneUiContext);
  if (!ctx) {
    throw new Error("useLibraryPaneUi must be used within LibraryPaneUiProvider");
  }
  return ctx;
}
