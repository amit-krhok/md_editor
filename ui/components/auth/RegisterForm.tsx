"use client";

import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/store-context";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export const RegisterForm = observer(function RegisterForm() {
  const auth = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await auth.register({ email: email.trim(), password });
      router.replace(ROUTES.home);
    } catch {
      /* auth.error */
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {auth.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-200">
          {auth.error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-email" className="text-xs font-medium text-muted">
          Email
        </label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-password" className="text-xs font-medium text-muted">
          Password
        </label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          minLength={12}
        />
        <p className="text-xs text-muted">
          Use at least 12 characters with upper, lower, number, and punctuation.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={auth.loading}>
        {auth.loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </form>
  );
});
