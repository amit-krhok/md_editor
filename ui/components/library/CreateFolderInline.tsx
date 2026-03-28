"use client";

import { useState } from "react";

import { Input } from "@/ui/Input";

type Props = {
  onSubmit: (name: string) => void | Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
  error: string | null;
};

export function CreateFolderInline({
  onSubmit,
  onCancel,
  disabled,
  error,
}: Props) {
  const [value, setValue] = useState("");

  return (
    <div className="border-b border-border px-2 py-2">
      <Input
        autoFocus
        placeholder="Folder name"
        value={value}
        disabled={disabled}
        aria-invalid={!!error}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
          if (e.key === "Enter") {
            e.preventDefault();
            const name = value.trim();
            if (name.length > 0) void onSubmit(name);
          }
        }}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
