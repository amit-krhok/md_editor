"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/http";
import { deleteFolder } from "@/lib/api/folders";
import type { FolderPublic } from "@/types/folder.types";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Modal } from "@/ui/Modal";

const CONFIRM_PHRASE = "DELETE";

type Props = {
  folder: FolderPublic | null;
  open: boolean;
  token: string | null;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteFolderModal({
  folder,
  open,
  token,
  onClose,
  onDeleted,
}: Props) {
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhrase("");
      setError(null);
      setBusy(false);
    }
  }, [open, folder?.id]);

  const canDelete =
    phrase === CONFIRM_PHRASE && folder != null && token != null && !busy;

  async function handleDelete() {
    if (!folder || !token || phrase !== CONFIRM_PHRASE) return;
    setBusy(true);
    setError(null);
    try {
      await deleteFolder(token, folder.id);
      onDeleted();
      onClose();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not delete folder";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  return (
    <Modal
      open={open && folder != null}
      onClose={handleClose}
      title="Delete folder?"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!canDelete}
            onClick={() => void handleDelete()}
          >
            Delete folder
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        This will permanently delete{" "}
        <span className="font-medium text-foreground">{folder?.name}</span> and
        all articles inside it. This cannot be undone.
      </p>
      <p className="mt-3 text-sm text-foreground">
        Type{" "}
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs">
          {CONFIRM_PHRASE}
        </kbd>{" "}
        to confirm.
      </p>
      <Input
        className="mt-2"
        value={phrase}
        disabled={busy}
        autoComplete="off"
        placeholder={CONFIRM_PHRASE}
        aria-label="Type DELETE to confirm"
        onChange={(e) => setPhrase(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (canDelete) {
              void handleDelete();
            }
          }
        }}
      />
      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </Modal>
  );
}
