import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import FlickLabel from "./FlickLabel";

interface ConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  label: string;
  confirmLabel?: string;
  busyLabel?: string;
  className?: string;
  title?: string;
  icon?: ReactNode;
}

/**
 * Two-step destructive action: first click arms it (swaps to an explicit
 * Confirm/Cancel pair for a few seconds), second click actually fires. Avoids
 * both an easy-to-mis-click single button and a jarring native confirm().
 */
export default function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Confirm",
  busyLabel = "Working…",
  className = "",
  title,
  icon,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const disarm = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setArmed(false);
  };

  if (busy) {
    return (
      <button type="button" className={className} disabled>
        <span className="spinner" aria-hidden />
        {busyLabel}
      </button>
    );
  }

  if (armed) {
    return (
      <span className="confirm-group">
        <button
          type="button"
          className="btn btn--danger-solid btn--sm"
          onClick={async () => {
            disarm();
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
            }
          }}
        >
          <FlickLabel>{confirmLabel}</FlickLabel>
        </button>
        <button type="button" className="btn-link" onClick={disarm}>
          <FlickLabel>Cancel</FlickLabel>
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      title={title}
      onClick={() => {
        setArmed(true);
        timerRef.current = window.setTimeout(disarm, 4000);
      }}
    >
      <FlickLabel>
        {icon}
        {label}
      </FlickLabel>
    </button>
  );
}
