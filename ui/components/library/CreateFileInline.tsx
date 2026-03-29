"use client";

import { useState } from "react";

import {
  LibraryNameFieldError,
  LibraryNameInput,
} from "@/components/library/LibraryNameInput";

type Props = {
  onSubmit: (title: string) => void | Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
  error: string | null;
};

export function CreateFileInline({
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
        placeholder="File name"
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
            const title = value.trim();
            if (title.length > 0) void onSubmit(title);
          }
        }}
      />
      <LibraryNameFieldError>{error}</LibraryNameFieldError>
    </div>
  );
}
