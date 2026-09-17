import Icon from "./Icon";
import type { IconName } from "./Icon";
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
  resolved: "Resolved",
};

const ICON_NAMES: Record<string, IconName> = {
  pending: "circle",
  success: "check",
  completed: "check",
  match: "check",
  failed: "x",
  mismatch: "x",
  warning: "alert-triangle",
  resolved: "check",
};

export default function StatusBadge({ status }: { status: AnyStatus }) {
  const isProcessing = status === "processing";
  return (
    <span className={`badge badge--${status}`}>
      {isProcessing ? (
        <span className="spinner badge-icon" aria-hidden />
      ) : (
        <Icon name={ICON_NAMES[status] ?? "circle"} className="badge-icon" />
      )}
      {LABELS[status] ?? status}
    </span>
  );
}
