import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card } from "@/ui/Card";

export const metadata: Metadata = {
  title: "Register — md_editor",
};

export default function RegisterPage() {
  return (
    <Card>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
        Create account
      </h1>
      <p className="mb-6 text-sm text-muted">Start writing with MD Editor.</p>
      <RegisterForm />
    </Card>
  );
}
