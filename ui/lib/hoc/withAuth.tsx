"use client";

import type { ComponentType } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";

/**
 * Wraps a client page/section so it only renders when the user is authenticated.
 * Prefer the `(protected)` layout + {@link AuthGuard} for route-level protection.
 */
export function withAuth<P extends object>(Component: ComponentType<P>) {
  return function WithAuth(props: P) {
    return (
      <AuthGuard>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
