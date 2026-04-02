"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const [mobileInitDone, setMobileInitDone] = useState(false);

  useEffect(() => {
    if (mobileInitDone) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setLibraryCollapsed(true);
    }
    setMobileInitDone(true);
  }, [mobileInitDone]);

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
