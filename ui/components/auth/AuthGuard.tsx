"use client";

import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/store-context";
import { Spinner } from "@/ui/Spinner";

export const AuthGuard = observer(function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const auth = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!auth.hydrated) {
      return;
    }
    if (!auth.isAuthenticated) {
      router.replace(ROUTES.login);
    }
  }, [auth.hydrated, auth.isAuthenticated, router]);

  if (!auth.hydrated) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
});
