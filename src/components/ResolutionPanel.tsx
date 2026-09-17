import { useEffect, useState } from "react";
import { ApiRequestError, reopenCheck, resolveCheck } from "../api/client";
import type { ComparisonReport, FieldCheck, ResolutionSource } from "../types";
import FlickLabel from "./FlickLabel";
import Icon from "./Icon";

const DOC_LABELS: Record<string, string> = {
  commercial_invoice: "Invoice",
  packing_list: "Packing List",
  bill_of_lading: "Bill of Lading",
  shipment_date: "Shipment Date",
};

const RESOLVER_NAME_KEY = "docs-extractor:resolver-name";

interface ResolutionPanelProps {
  check: FieldCheck;
  shipmentId: string;
  onClose: () => void;
  onResolved: (report: ComparisonReport) => void;
}

export default function ResolutionPanel({ check, shipmentId, onClose, onResolved }: ResolutionPanelProps) {
  const hasBothValues = check.doc_a_value != null && check.doc_b_value != null;
  const alreadyResolved = check.status === "resolved";

  const [editing, setEditing] = useState(!alreadyResolved);
  const [source, setSource] = useState<ResolutionSource>(
    check.resolution_source ?? (hasBothValues ? "doc_a" : "manual"),
  );
  const [manualValue, setManualValue] = useState(check.resolved_value ?? "");
  const [resolvedBy, setResolvedBy] = useState(
    () => check.resolved_by ?? localStorage.getItem(RESOLVER_NAME_KEY) ?? "",
  );
  const [note, setNote] = useState(check.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const resolvedValue = source === "doc_a" ? check.doc_a_value : source === "doc_b" ? check.doc_b_value : manualValue;
  const canSave = !!resolvedValue?.trim();

  const handleSave = async () => {
    if (!resolvedValue?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (resolvedBy.trim()) localStorage.setItem(RESOLVER_NAME_KEY, resolvedBy.trim());
      const report = await resolveCheck(shipmentId, {
        pair: check.pair,
        field: check.field,
        line_item_key: check.line_item_key,
        resolved_value: resolvedValue.trim(),
        source,
        resolved_by: resolvedBy.trim() || undefined,
        note: note.trim() || undefined,
      });
      onResolved(report);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save this resolution.");
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    setSaving(true);
    setError(null);
    try {
      const report = await reopenCheck(shipmentId, {
        pair: check.pair,
        field: check.field,
        line_item_key: check.line_item_key,
      });
      onResolved(report);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reopen this check.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="resolution-backdrop" onClick={onClose}>
      <div className="resolution-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="resolution-panel-header">
          <div>
            <span className="resolution-panel-eyebrow">{check.pair_label}</span>
            <h3>{check.field_label}</h3>
          </div>
          <button type="button" className="resolution-panel-close" onClick={onClose} aria-label="Close panel">
            <Icon name="x" />
          </button>
        </div>

        <div className="resolution-panel-body">
          {alreadyResolved && !editing ? (
            <>
              <div className="resolution-summary">
                <span className="resolution-summary-label">Resolved value</span>
                <p className="resolution-summary-value">{check.resolved_value}</p>
                {check.resolved_by && (
                  <p className="resolution-summary-meta">
                    Resolved by <strong>{check.resolved_by}</strong>
                    {check.resolved_at ? ` on ${new Date(check.resolved_at).toLocaleString()}` : ""}
                  </p>
                )}
                {check.note && <p className="resolution-summary-note">"{check.note}"</p>}
              </div>
              <div className="resolution-panel-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
                  <FlickLabel>
                    <Icon name="pencil" /> Edit
                  </FlickLabel>
                </button>
                <button
                  type="button"
                  className="btn btn--ghost-danger btn--sm"
                  disabled={saving}
                  onClick={handleReopen}
                >
                  <FlickLabel>{saving ? "Reopening…" : "Reopen"}</FlickLabel>
                </button>
              </div>
            </>
          ) : (
            <>
              {hasBothValues ? (
                <div className="value-card-group">
                  <button
                    type="button"
                    className={`value-card${source === "doc_a" ? " value-card--selected" : ""}`}
                    onClick={() => setSource("doc_a")}
                  >
                    <span className="value-card-label">{DOC_LABELS[check.doc_a_type] ?? check.doc_a_type}</span>
                    <span className="value-card-text">{check.doc_a_value}</span>
                  </button>
                  <button
                    type="button"
                    className={`value-card${source === "doc_b" ? " value-card--selected" : ""}`}
                    onClick={() => setSource("doc_b")}
                  >
                    <span className="value-card-label">{DOC_LABELS[check.doc_b_type] ?? check.doc_b_type}</span>
                    <span className="value-card-text">{check.doc_b_value}</span>
                  </button>
                  <button
                    type="button"
                    className={`value-card value-card--manual${source === "manual" ? " value-card--selected" : ""}`}
                    onClick={() => setSource("manual")}
                  >
                    <span className="value-card-label">Neither — enter manually</span>
                  </button>
                  {source === "manual" && (
                    <input
                      type="text"
                      className="resolution-manual-input"
                      placeholder="Correct value…"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <>
                  <div className="resolution-known-value">
                    <span className="resolution-known-value-label">
                      {check.doc_a_value != null
                        ? DOC_LABELS[check.doc_a_type] ?? check.doc_a_type
                        : DOC_LABELS[check.doc_b_type] ?? check.doc_b_type}
                    </span>
                    <span className="resolution-known-value-text">{check.doc_a_value ?? check.doc_b_value}</span>
                  </div>
                  <label className="resolution-field">
                    <span>
                      Missing on{" "}
                      {check.doc_a_value == null
                        ? DOC_LABELS[check.doc_a_type] ?? check.doc_a_type
                        : DOC_LABELS[check.doc_b_type] ?? check.doc_b_type}
                      — enter the correct value
                    </span>
                    <input
                      type="text"
                      placeholder="Correct value…"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      autoFocus
                    />
                  </label>
                </>
              )}

              <label className="resolution-field">
                <span>Your name (optional)</span>
                <input
                  type="text"
                  placeholder="e.g. Jordan"
                  value={resolvedBy}
                  onChange={(e) => setResolvedBy(e.target.value)}
                />
              </label>

              <label className="resolution-field">
                <span>Note (optional)</span>
                <textarea
                  rows={3}
                  placeholder="Any context for this resolution…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              {error && <div className="alert alert--error">{error}</div>}

              <div className="resolution-panel-actions">
                {alreadyResolved && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>
                    <FlickLabel>Cancel</FlickLabel>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  disabled={!canSave || saving}
                  onClick={handleSave}
                >
                  <FlickLabel>{saving ? "Saving…" : "Save resolution"}</FlickLabel>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
