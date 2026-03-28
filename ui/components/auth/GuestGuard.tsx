"use client";

import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/store-context";
import { Spinner } from "@/ui/Spinner";

export const GuestGuard = observer(function GuestGuard({
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
    if (auth.isAuthenticated) {
      router.replace(ROUTES.home);
    }
  }, [auth.hydrated, auth.isAuthenticated, router]);

  if (!auth.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
});
