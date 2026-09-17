import { useMemo, useState } from "react";
import type { ComparisonReport, FieldCheck } from "../types";
import FlickLabel from "./FlickLabel";
import Icon from "./Icon";
import StatusBadge from "./StatusBadge";

const DOC_LABELS: Record<string, string> = {
  commercial_invoice: "Invoice",
  packing_list: "Packing List",
  bill_of_lading: "Bill of Lading",
  shipment_date: "Shipment Date",
};

type Filter = "all" | "issues" | "mismatches" | "matched";

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
    return <span className="group-pill group-pill--ok">✓ all {matched} matched</span>;
  }
  return (
    <span className="group-pill group-pill--issue">
      {mismatched > 0 && (
        <span className="group-pill-count group-pill-count--mismatch">
          {mismatched} mismatch{mismatched === 1 ? "" : "es"}
        </span>
      )}
      {warnings > 0 && <span className="group-pill-count group-pill-count--warning">{warnings} review</span>}
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

function CheckItem({ check }: { check: FieldCheck }) {
  const isCriticalIssue = check.safety_critical && check.status !== "match";
  return (
    <div className={`check-item check-item--${check.status}${isCriticalIssue ? " check-item--critical" : ""}`}>
      <div className="check-item-head">
        <span className="check-item-field">
          {isCriticalIssue && (
            <span className="critical-tag" title="Safety/regulatory issue — verify before clearance">
              <Icon name="alert-triangle" /> Critical
            </span>
          )}
          {check.field_label}
        </span>
        <StatusBadge status={check.status} />
      </div>
      <div className="check-item-values">
        <div className="check-value-block">
          <span className="check-value-label">{DOC_LABELS[check.doc_a_type] ?? check.doc_a_type}</span>
          <span className="check-value-text">{check.doc_a_value ?? <em className="muted">missing</em>}</span>
        </div>
        <span className="check-value-arrow" aria-hidden>
          vs
        </span>
        <div className="check-value-block">
          <span className="check-value-label">{DOC_LABELS[check.doc_b_type] ?? check.doc_b_type}</span>
          <span className="check-value-text">{check.doc_b_value ?? <em className="muted">missing</em>}</span>
        </div>
      </div>
      {check.detail && <p className="check-item-detail">{check.detail}</p>}
    </div>
  );
}

function CheckList({ checks }: { checks: FieldCheck[] }) {
  const issueChecks = checks.filter((c) => c.status !== "match");
  const matchedChecks = checks.filter((c) => c.status === "match");

  if (issueChecks.length === 0) {
    return (
      <div className="check-list">
        {matchedChecks.map((c, i) => (
          <CheckItem key={`${c.field}-${i}`} check={c} />
        ))}
      </div>
    );
  }

  return (
    <div className="check-list">
      {issueChecks.map((c, i) => (
        <CheckItem key={`${c.field}-${i}`} check={c} />
      ))}
      {matchedChecks.length > 0 && (
        <details className="matched-toggle">
          <summary>
            ✓ {matchedChecks.length} matched field{matchedChecks.length === 1 ? "" : "s"}
          </summary>
          <div className="check-list check-list--nested">
            {matchedChecks.map((c, i) => (
              <CheckItem key={`${c.field}-${i}`} check={c} />
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
}: {
  pairLabel: string;
  checks: FieldCheck[];
  forceOpen: boolean;
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
          {mismatched > 0 ? ` · ${mismatched} mismatch${mismatched === 1 ? "" : "es"}` : ""}
          {warnings > 0 ? ` · ${warnings} needs review` : ""}
        </span>
      </div>

      {headerChecks.length > 0 && (
        <CollapsibleGroup title="Header fields" checks={headerChecks} forceOpen={forceOpen}>
          <CheckList checks={headerChecks} />
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
              <CheckList checks={lineChecks} />
            </CollapsibleGroup>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ComparisonView({ report }: { report: ComparisonReport }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { summary } = report;

  const filteredChecks = useMemo(() => {
    if (filter === "all") return report.checks;
    if (filter === "mismatches") return report.checks.filter((c) => c.status === "mismatch");
    if (filter === "matched") return report.checks.filter((c) => c.status === "match");
    return report.checks.filter((c) => c.status !== "match");
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
        <button className={filter === "all" ? "active" : ""} onClick={selectFilter("all")}>
          <FlickLabel>
            All Checks <span className="filter-tab-count">{summary.total_checks}</span>
          </FlickLabel>
        </button>
        <button className={filter === "matched" ? "active" : ""} onClick={selectFilter("matched")}>
          <FlickLabel>
            Matched Only <span className="filter-tab-count">{summary.matched}</span>
          </FlickLabel>
        </button>
        <button className={filter === "mismatches" ? "active" : ""} onClick={selectFilter("mismatches")}>
          <FlickLabel>
            Mismatches Only <span className="filter-tab-count">{summary.mismatched}</span>
          </FlickLabel>
        </button>
        <button className={filter === "issues" ? "active" : ""} onClick={selectFilter("issues")}>
          <FlickLabel>
            Needs Attention <span className="filter-tab-count">{summary.mismatched + summary.warnings}</span>
          </FlickLabel>
        </button>
      </div>

      {pairGroups.size === 0 ? (
        <p className="empty-state">
          {filter === "all" ? "No checks were run." : "No issues found for this filter — everything checked out!"}
        </p>
      ) : (
        [...pairGroups.entries()].map(([pairLabel, checks]) => (
          <PairSection key={pairLabel} pairLabel={pairLabel} checks={checks} forceOpen={forceOpen} />
        ))
      )}
    </div>
  );
}
