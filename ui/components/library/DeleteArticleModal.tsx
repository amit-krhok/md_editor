"use client";

import type { ArticlePublic } from "@/types/article.types";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";

type Props = {
  article: ArticlePublic | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteArticleModal({
  article,
  open,
  busy,
  onClose,
  onConfirm,
}: Props) {
  function handleClose() {
    if (busy) return;
    onClose();
  }

  return (
    <Modal
      open={open && article != null}
      onClose={handleClose}
      title="Delete file?"
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
            disabled={busy}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        Permanently delete{" "}
        <span className="font-medium text-foreground">{article?.title}</span>?
        This cannot be undone.
      </p>
    </Modal>
  );
}
