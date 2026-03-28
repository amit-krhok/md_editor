import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent/40 ${className}`}
      {...props}
    />
  );
}
