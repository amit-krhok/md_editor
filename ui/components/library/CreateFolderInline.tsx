"use client";

import { useState } from "react";

import {
  LibraryNameFieldError,
  LibraryNameInput,
} from "@/components/library/LibraryNameInput";

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
    <div className="border-b border-border px-2 py-0.5">
      <LibraryNameInput
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
      <LibraryNameFieldError>{error}</LibraryNameFieldError>
    </div>
  );
}
