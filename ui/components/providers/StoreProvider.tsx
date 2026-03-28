"use client";

import { useState, type ReactNode } from "react";

import { StoreContext } from "@/stores/store-context";
import { RootStore } from "@/stores/RootStore";

import { AuthHydration } from "./AuthHydration";
import { ThemeRoot } from "./ThemeRoot";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new RootStore());
  return (
    <StoreContext.Provider value={store}>
      <ThemeRoot>
        <AuthHydration>{children}</AuthHydration>
      </ThemeRoot>
    </StoreContext.Provider>
  );
}
