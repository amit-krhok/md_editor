"use client";

import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/stores/store-context";

/**
 * Loads persisted token from localStorage once on the client.
 */
export function AuthHydration({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  useEffect(() => {
    auth.hydrate();
  }, [auth]);
  return <>{children}</>;
}
