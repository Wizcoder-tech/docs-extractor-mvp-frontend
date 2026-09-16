import type { CheckStatus, ProcessingStatus, ShipmentStatus } from "../types";

type AnyStatus = ProcessingStatus | ShipmentStatus | CheckStatus;

const LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  success: "Extracted",
  failed: "Failed",
  completed: "Completed",
  match: "Match",
  mismatch: "Mismatch",
  warning: "Needs Review",
};

const ICONS: Record<string, string> = {
  pending: "○",
  processing: "◐",
  success: "✓",
  failed: "✕",
  completed: "✓",
  match: "✓",
  mismatch: "✕",
  warning: "!",
};

export default function StatusBadge({ status }: { status: AnyStatus }) {
  const isSpinning = status === "processing";
  return (
    <span className={`badge badge--${status}`}>
      <span className={`badge-icon${isSpinning ? " badge-icon--spin" : ""}`} aria-hidden>
        {ICONS[status] ?? "•"}
      </span>
      {LABELS[status] ?? status}
    </span>
  );
}
