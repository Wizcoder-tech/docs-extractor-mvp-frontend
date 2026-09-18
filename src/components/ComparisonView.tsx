import { useMemo, useState } from "react";
import type { ComparisonReport, FieldCheck } from "../types";
import FlickLabel from "./FlickLabel";
import Icon from "./Icon";
import ResolutionPanel from "./ResolutionPanel";
import StatusBadge from "./StatusBadge";

const DOC_LABELS: Record<string, string> = {
  commercial_invoice: "Invoice",
  packing_list: "Packing List",
  bill_of_lading: "Bill of Lading",
  shipment_date: "Shipment Date",
};

type Filter = "all" | "issues" | "mismatches" | "matched" | "resolved";

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function statusCounts(checks: FieldCheck[]) {
  let matched = 0;
  let mismatched = 0;
  let warnings = 0;
  for (const c of checks) {
    if (c.status === "match") matched++;
    else if (c.status === "mismatch") mismatched++;
    else warnings++;
  }
  return { matched, mismatched, warnings };
}

function GroupSummaryPill({ checks }: { checks: FieldCheck[] }) {
  const { matched, mismatched, warnings } = statusCounts(checks);
  if (mismatched === 0 && warnings === 0) {
    return (
      <span className="group-pill group-pill--ok">✓ all {matched} matched</span>
    );
  }
  return (
    <span className="group-pill group-pill--issue">
      {mismatched > 0 && (
        <span className="group-pill-count group-pill-count--mismatch">
          {mismatched} mismatch{mismatched === 1 ? "" : "es"}
        </span>
      )}
      {warnings > 0 && (
        <span className="group-pill-count group-pill-count--warning">
          {warnings} review
        </span>
      )}
    </span>
  );
}

function CollapsibleGroup({
  title,
  checks,
  children,
  forceOpen = false,
}: {
  title: string;
  checks: FieldCheck[];
  children: React.ReactNode;
  forceOpen?: boolean;
}) {
  const { mismatched, warnings } = statusCounts(checks);
  const hasIssue = mismatched > 0 || warnings > 0;
  return (
    <details className="check-group" open={hasIssue || forceOpen}>
      <summary className="check-group-summary">
        <span className="check-group-summary-left">
          <Icon name="chevron-right" className="check-group-chevron" />
          <span className="check-group-title">{title}</span>
        </span>
        <GroupSummaryPill checks={checks} />
      </summary>
      <div className="check-group-body">{children}</div>
    </details>
  );
}

function CheckItem({
  check,
  onSelect,
}: {
  check: FieldCheck;
  onSelect?: (check: FieldCheck) => void;
}) {
  const isCriticalIssue =
    check.safety_critical &&
    check.status !== "match" &&
    check.status !== "resolved";
  const isClickable = !!onSelect;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(check);
    }
  };

  return (
    <div
      className={`check-item check-item--${check.status}${isCriticalIssue ? " check-item--critical" : ""}${isClickable ? " check-item--clickable" : ""}`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onSelect?.(check) : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="check-item-head">
        <span className="check-item-field">
          {isCriticalIssue && (
            <span
              className="critical-tag"
              title="Safety/regulatory issue — verify before clearance"
            >
              <Icon name="alert-triangle" /> Critical
            </span>
          )}
          {check.field_label}
        </span>
        <span className="edit-button">
          <StatusBadge status={check.status} />
          <div className="edit-icon">
            <Icon name="pen"></Icon>
          </div>
        </span>
      </div>
      <div className="check-item-values">
        <div className="check-value-block">
          <span className="check-value-label">
            {DOC_LABELS[check.doc_a_type] ?? check.doc_a_type}
          </span>
          <span className="check-value-text">
            {check.doc_a_value ?? <em className="muted">missing</em>}
          </span>
        </div>
        <span className="check-value-arrow" aria-hidden>
          vs
        </span>
        <div className="check-value-block">
          <span className="check-value-label">
            {DOC_LABELS[check.doc_b_type] ?? check.doc_b_type}
          </span>
          <span className="check-value-text">
            {check.doc_b_value ?? <em className="muted">missing</em>}
          </span>
        </div>
      </div>
      {check.detail && <p className="check-item-detail">{check.detail}</p>}
      {check.status === "resolved" && (
        <p className="check-item-resolved-summary">
          Resolved to <strong>{check.resolved_value}</strong>
          {check.resolved_by ? ` by ${check.resolved_by}` : ""}
        </p>
      )}
    </div>
  );
}

function CheckList({
  checks,
  onSelect,
}: {
  checks: FieldCheck[];
  onSelect: (check: FieldCheck) => void;
}) {
  const issueChecks = checks.filter((c) => c.status !== "match");
  const matchedChecks = checks.filter((c) => c.status === "match");

  if (issueChecks.length === 0) {
    return (
      <div className="check-list">
        {matchedChecks.map((c, i) => (
          <CheckItem key={`${c.field}-${i}`} check={c} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <div className="check-list">
      {issueChecks.map((c, i) => (
        <CheckItem key={`${c.field}-${i}`} check={c} onSelect={onSelect} />
      ))}
      {matchedChecks.length > 0 && (
        <details className="matched-toggle">
          <summary>
            ✓ {matchedChecks.length} matched field
            {matchedChecks.length === 1 ? "" : "s"}
          </summary>
          <div className="check-list check-list--nested">
            {matchedChecks.map((c, i) => (
              <CheckItem
                key={`${c.field}-${i}`}
                check={c}
                onSelect={onSelect}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function PairSection({
  pairLabel,
  checks,
  forceOpen,
  onSelect,
}: {
  pairLabel: string;
  checks: FieldCheck[];
  forceOpen: boolean;
  onSelect: (check: FieldCheck) => void;
}) {
  const headerChecks = checks.filter((c) => c.scope === "header");
  const lineItemChecks = checks.filter((c) => c.scope === "line_item");
  const lineItemGroups = groupBy(lineItemChecks, (c) => c.line_item_key ?? "");
  const { matched, mismatched, warnings } = statusCounts(checks);

  return (
    <section className="pair-section">
      <div className="pair-section-header">
        <h3>{pairLabel}</h3>
        <span className="pair-section-count">
          {checks.length} checks · {matched} matched
          {mismatched > 0
            ? ` · ${mismatched} mismatch${mismatched === 1 ? "" : "es"}`
            : ""}
          {warnings > 0 ? ` · ${warnings} needs review` : ""}
        </span>
      </div>

      {headerChecks.length > 0 && (
        <CollapsibleGroup
          title="Header fields"
          checks={headerChecks}
          forceOpen={forceOpen}
        >
          <CheckList checks={headerChecks} onSelect={onSelect} />
        </CollapsibleGroup>
      )}

      {lineItemGroups.size > 0 && (
        <div className="line-item-groups">
          {[...lineItemGroups.entries()].map(([lineKey, lineChecks]) => (
            <CollapsibleGroup
              key={lineKey}
              title={`Line item ${lineKey || "(unidentified)"}`}
              checks={lineChecks}
              forceOpen={forceOpen}
            >
              <CheckList checks={lineChecks} onSelect={onSelect} />
            </CollapsibleGroup>
          ))}
        </div>
      )}
    </section>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(val: string | null | undefined): string {
  if (val == null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function escapeHtml(val: string | null | undefined): string {
  if (val == null) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function PreviewModal({
  checks,
  shipmentId,
  onClose,
  onUpdateValue,
}: {
  checks: FieldCheck[];
  shipmentId: string;
  onClose: () => void;
  onUpdateValue: (targetIndex: number, newValue: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const listWithIndex = checks.map((c, originalIndex) => ({ check: c, originalIndex }));
    if (!searchTerm.trim()) return listWithIndex;
    const lower = searchTerm.toLowerCase();
    return listWithIndex.filter(
      ({ check: c }) =>
        c.field_label.toLowerCase().includes(lower) ||
        c.field.toLowerCase().includes(lower) ||
        c.pair_label.toLowerCase().includes(lower) ||
        (c.resolved_value ?? "").toLowerCase().includes(lower) ||
        (c.doc_a_value ?? "").toLowerCase().includes(lower) ||
        (c.doc_b_value ?? "").toLowerCase().includes(lower),
    );
  }, [checks, searchTerm]);

  const getKeyAndValue = (c: FieldCheck) => {
    const key = c.line_item_key ? `${c.field_label} (${c.line_item_key})` : c.field_label;
    const value =
      c.resolved_value != null
        ? c.resolved_value
        : c.status === "match"
          ? (c.doc_a_value ?? c.doc_b_value ?? "")
          : "";
    return { key, value };
  };

  const getExportEntries = () => {
    const entries: { key: string; value: string }[] = [];
    const seen = new Set<string>();

    for (const c of checks) {
      const { key, value } = getKeyAndValue(c);
      const signature = `${key}:::${value}`;
      if (!seen.has(signature)) {
        seen.add(signature);
        entries.push({ key, value });
      }
    }
    return entries;
  };

  const handleExportCSV = () => {
    const headers = ["Key", "Value"];
    const rows = getExportEntries().map(({ key, value }) =>
      [escapeCsvCell(key), escapeCsvCell(value)].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    downloadFile(csvContent, `shipment-${shipmentId.slice(0, 8)}-preview.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportJSON = () => {
    const data: Record<string, string> = {};

    for (const { key: baseKey, value } of getExportEntries()) {
      if (data[baseKey] === undefined) {
        data[baseKey] = value;
      } else {
        let suffix = 2;
        while (data[`${baseKey} (${suffix})`] !== undefined) {
          suffix++;
        }
        data[`${baseKey} (${suffix})`] = value;
      }
    }

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `shipment-${shipmentId.slice(0, 8)}-preview.json`, "application/json");
  };

  const handleExportExcel = () => {
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Comparison Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta charset="utf-8"></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #4f46e5; color: #ffffff; font-weight: bold;">
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const { key, value } of getExportEntries()) {
      tableHtml += `
        <tr>
          <td>${escapeHtml(key)}</td>
          <td>${escapeHtml(value)}</td>
        </tr>
      `;
    }

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    downloadFile(tableHtml, `shipment-${shipmentId.slice(0, 8)}-preview.xls`, "application/vnd.ms-excel;charset=utf-8");
  };

  return (
    <div className="preview-modal-backdrop" onClick={onClose}>
      <div
        className="preview-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="preview-modal-header">
          <h3 className="preview-modal-title">
            <Icon name="file-check" size="1.25rem" />
            Comparison &amp; Extraction Preview
          </h3>
          <button
            type="button"
            className="preview-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="x" />
          </button>
        </div>

        <div className="preview-modal-toolbar">
          <input
            type="search"
            className="preview-search-input"
            placeholder="Search fields or values…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="preview-export-group">
            <button
              type="button"
              className="btn--export btn--export-excel"
              onClick={handleExportExcel}
              title="Export as Excel format"
            >
              <Icon name="download" /> Export Excel
            </button>
            <button
              type="button"
              className="btn--export btn--export-csv"
              onClick={handleExportCSV}
              title="Export as CSV spreadsheet"
            >
              <Icon name="download" /> Export CSV
            </button>
            <button
              type="button"
              className="btn--export btn--export-json"
              onClick={handleExportJSON}
              title="Export as JSON data"
            >
              <Icon name="download" /> Export JSON
            </button>
          </div>
        </div>

        <div className="preview-modal-body">
          <table className="preview-table">
            <thead>
              <tr>
                <th>Document Pair</th>
                <th>Field</th>
                <th>Status</th>
                <th>Document A</th>
                <th>Document B</th>
                <th style={{ minWidth: "220px" }}>Value (Editable)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ check: c, originalIndex }) => {
                const val =
                  c.resolved_value != null
                    ? c.resolved_value
                    : c.status === "match"
                      ? (c.doc_a_value ?? c.doc_b_value ?? "")
                      : "";

                return (
                  <tr key={`check-${originalIndex}`}>
                    <td>
                      <strong>{c.pair_label}</strong>
                      {c.line_item_key && (
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          Line Item: {c.line_item_key}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{c.field_label}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-faint)" }}>
                        {c.field}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                        {DOC_LABELS[c.doc_a_type] ?? c.doc_a_type}
                      </div>
                      <div>{c.doc_a_value ?? <em className="muted">missing</em>}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                        {DOC_LABELS[c.doc_b_type] ?? c.doc_b_type}
                      </div>
                      <div>{c.doc_b_value ?? <em className="muted">missing</em>}</div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className={`preview-table-input${c.resolved_value != null ? " preview-table-input--modified" : ""}`}
                        value={val}
                        placeholder={c.status === "match" ? (c.doc_a_value ?? "") : "Enter value…"}
                        onChange={(e) => onUpdateValue(originalIndex, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="preview-modal-footer">
          <span>
            Showing {filtered.length} of {checks.length} field checks
          </span>
          <button type="button" className="btn btn--primary btn--sm" onClick={onClose}>
            <FlickLabel>Done</FlickLabel>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonView({
  report,
  shipmentId,
  onReportChange,
}: {
  report: ComparisonReport;
  shipmentId: string;
  onReportChange: (report: ComparisonReport) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeCheck, setActiveCheck] = useState<FieldCheck | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { summary } = report;

  const filteredChecks = useMemo(() => {
    if (filter === "all") return report.checks;
    if (filter === "mismatches")
      return report.checks.filter((c) => c.status === "mismatch");
    if (filter === "matched")
      return report.checks.filter((c) => c.status === "match");
    if (filter === "resolved")
      return report.checks.filter((c) => c.status === "resolved");
    return report.checks.filter(
      (c) => c.status === "mismatch" || c.status === "warning",
    );
  }, [report.checks, filter]);

  const pairGroups = groupBy(filteredChecks, (c) => c.pair_label);
  const forceOpen = filter !== "all";

  const selectFilter = (value: Filter) => () => setFilter(value);
  const handleCardKeyDown = (value: Filter) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFilter(value);
    }
  };

  return (
    <div className="comparison-view">
      <div className="summary-cards">
        <div
          className={`summary-card summary-card--total${filter === "all" ? " summary-card--active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={selectFilter("all")}
          onKeyDown={handleCardKeyDown("all")}
        >
          <span className="summary-icon" aria-hidden>
            Σ
          </span>
          <span className="summary-value">{summary.total_checks}</span>
          <span className="summary-label">Total Checks</span>
        </div>
        <div
          className={`summary-card summary-card--match${filter === "matched" ? " summary-card--active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={selectFilter("matched")}
          onKeyDown={handleCardKeyDown("matched")}
        >
          <span className="summary-icon" aria-hidden>
            <Icon name="check" size="1.1rem" />
          </span>
          <span className="summary-value">{summary.matched}</span>
          <span className="summary-label">Matched</span>
        </div>
        <div
          className={`summary-card summary-card--mismatch${filter === "mismatches" ? " summary-card--active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={selectFilter("mismatches")}
          onKeyDown={handleCardKeyDown("mismatches")}
        >
          <span className="summary-icon" aria-hidden>
            <Icon name="x" size="1.1rem" />
          </span>
          <span className="summary-value">{summary.mismatched}</span>
          <span className="summary-label">Mismatches</span>
        </div>
        <div
          className={`summary-card summary-card--warning${filter === "issues" ? " summary-card--active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={selectFilter("issues")}
          onKeyDown={handleCardKeyDown("issues")}
        >
          <span className="summary-icon" aria-hidden>
            <Icon name="alert-triangle" size="1.1rem" />
          </span>
          <span className="summary-value">{summary.warnings}</span>
          <span className="summary-label">Needs Review</span>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={selectFilter("all")}
        >
          <FlickLabel>
            All Checks{" "}
            <span className="filter-tab-count">{summary.total_checks}</span>
          </FlickLabel>
        </button>
        <button
          className={filter === "matched" ? "active" : ""}
          onClick={selectFilter("matched")}
        >
          <FlickLabel>
            Matched Only{" "}
            <span className="filter-tab-count">{summary.matched}</span>
          </FlickLabel>
        </button>
        <button
          className={filter === "mismatches" ? "active" : ""}
          onClick={selectFilter("mismatches")}
        >
          <FlickLabel>
            Mismatches Only{" "}
            <span className="filter-tab-count">{summary.mismatched}</span>
          </FlickLabel>
        </button>
        <button
          className={filter === "issues" ? "active" : ""}
          onClick={selectFilter("issues")}
        >
          <FlickLabel>
            Needs Attention{" "}
            <span className="filter-tab-count">
              {summary.mismatched + summary.warnings}
            </span>
          </FlickLabel>
        </button>
        <button
          className={filter === "resolved" ? "active" : ""}
          onClick={selectFilter("resolved")}
        >
          <FlickLabel>
            Resolved{" "}
            <span className="filter-tab-count">{summary.resolved}</span>
          </FlickLabel>
        </button>
      </div>

      <div className="comparison-header-actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setShowPreview(true)}
          title="Preview all extracted fields and export as Excel, CSV, or JSON"
        >
          <FlickLabel>
            <Icon name="eye" /> Preview &amp; Export
          </FlickLabel>
        </button>
      </div>

      {pairGroups.size === 0 ? (
        <p className="empty-state">
          {filter === "all"
            ? "No checks were run."
            : "No issues found for this filter — everything checked out!"}
        </p>
      ) : (
        [...pairGroups.entries()].map(([pairLabel, checks]) => (
          <PairSection
            key={pairLabel}
            pairLabel={pairLabel}
            checks={checks}
            forceOpen={forceOpen}
            onSelect={setActiveCheck}
          />
        ))
      )}

      {showPreview && (
        <PreviewModal
          checks={report.checks}
          shipmentId={shipmentId}
          onClose={() => setShowPreview(false)}
          onUpdateValue={(targetIndex, newValue) => {
            const updatedChecks = report.checks.map((c, idx) => {
              if (idx === targetIndex) {
                return {
                  ...c,
                  resolved_value: newValue,
                  status: (c.status === "match" ? "match" : "resolved") as FieldCheck["status"],
                };
              }
              return c;
            });
            onReportChange({
              ...report,
              checks: updatedChecks,
            });
          }}
        />
      )}

      {activeCheck && (
        <ResolutionPanel
          key={`${activeCheck.pair}:${activeCheck.field}:${activeCheck.line_item_key ?? ""}:${activeCheck.doc_a_value ?? ""}:${activeCheck.doc_b_value ?? ""}`}
          check={activeCheck}
          shipmentId={shipmentId}
          onClose={() => setActiveCheck(null)}
          onResolved={(updated) => {
            onReportChange(updated);
            setActiveCheck(null);
          }}
        />
      )}
    </div>
  );
}
