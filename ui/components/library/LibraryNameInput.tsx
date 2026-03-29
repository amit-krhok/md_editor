import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { Input } from "@/ui/Input";

/** Shared compact field for library create + rename (overrides default `Input` h-10). */
const libraryNameInputClass =
  "h-5! min-h-0! py-0! px-2! text-xs leading-none shadow-none";

export const LibraryNameInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function LibraryNameInput({ className = "", ...props }, ref) {
  return (
    <Input
      ref={ref}
      className={[libraryNameInputClass, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
});

export function LibraryNameFieldError({ children }: { children: ReactNode }) {
  if (children == null || children === "") return null;
  return (
    <p className="mt-0.5 text-xs text-red-600 dark:text-red-400" role="alert">
      {children}
    </p>
  );
}
