import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import FlickLabel from "./FlickLabel";
import Icon from "./Icon";

interface ConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  label: string;
  confirmLabel?: string;
  busyLabel?: string;
  className?: string;
  title?: string;
  icon?: ReactNode;
  dialogTitle?: string;
  dialogMessage?: string;
}

/**
 * Confirmation action: clicking opens a clear modal dialog popup asking for confirmation,
 * preventing accidental clicks and providing a much better user experience than inline swap.
 */
export default function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  className = "",
  title,
  icon,
  dialogTitle = "Delete confirmation",
  dialogMessage = "Are you sure you want to delete this? This action cannot be undone.",
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, busy]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!busy) setIsOpen(false);
  };

  const handleExecute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className}
        title={title}
        onClick={handleOpen}
      >
        <FlickLabel>
          {icon}
          {label}
        </FlickLabel>
      </button>

      {isOpen && (
        <div
          className="confirm-modal-backdrop"
          onClick={handleClose}
          role="presentation"
        >
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrap" aria-hidden="true">
                <Icon name="alert-triangle" size="1.35rem" />
              </div>
              <div className="confirm-modal-content">
                <h3 id="confirm-modal-title" className="confirm-modal-title">
                  {dialogTitle}
                </h3>
                <p className="confirm-modal-message">{dialogMessage}</p>
              </div>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={busy}
                onClick={handleClose}
              >
                <FlickLabel>Cancel</FlickLabel>
              </button>
              <button
                type="button"
                className="btn btn--danger-solid btn--sm"
                disabled={busy}
                onClick={handleExecute}
                autoFocus
              >
                {busy ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> {busyLabel}
                  </>
                ) : (
                  <FlickLabel>{confirmLabel}</FlickLabel>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
