import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/ui/Card";

export const metadata: Metadata = {
  title: "Sign in — md_editor",
};

export default function LoginPage() {
  return (
    <Card>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
        Sign in
      </h1>
      <p className="mb-6 text-sm text-muted">Welcome back. Use your email and password.</p>
      <LoginForm />
    </Card>
  );
}
