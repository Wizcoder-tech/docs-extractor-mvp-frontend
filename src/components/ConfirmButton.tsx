import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  label: string;
  confirmLabel?: string;
  busyLabel?: string;
  className?: string;
  title?: string;
  icon?: ReactNode;
  confirmTitle?: string;
  confirmMessage?: string;
}

/**
 * Destructive action gated behind a modal confirmation dialog (rendered via
 * a portal so it always sits above the page regardless of where the button
 * lives -- a table row, a page header, etc). A modal blocks the rest of the
 * UI until explicitly dismissed, so unlike an inline "are you sure" toggle
 * it needs no auto-dismiss timer -- there's no "left armed and mis-clicked
 * later" risk once the action requires a deliberate dialog interaction.
 */
export default function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Confirm",
  busyLabel = "Working…",
  className = "",
  title,
  icon,
  confirmTitle = "Are you sure?",
  confirmMessage = "This action cannot be undone.",
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleConfirm = async () => {
    setOpen(false);
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <button type="button" className={className} disabled>
        <span className="spinner" aria-hidden />
        {busyLabel}
      </button>
    );
  }

  return (
    <>
      <button type="button" className={className} title={title} onClick={() => setOpen(true)}>
        {icon}
        {label}
      </button>
      {open &&
        createPortal(
          <div className="modal-overlay" onClick={() => setOpen(false)}>
            <div
              className="modal-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="confirm-dialog-title" className="modal-title">
                {confirmTitle}
              </h2>
              <p className="modal-message">{confirmMessage}</p>
              <div className="modal-actions">
                <button ref={cancelRef} type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn--danger-solid btn--sm" onClick={handleConfirm}>
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
