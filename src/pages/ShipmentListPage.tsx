import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiRequestError, deleteShipment, listShipments } from "../api/client";
import ConfirmButton from "../components/ConfirmButton";
import FlickLabel from "../components/FlickLabel";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import type { ShipmentListItem, ShipmentStatus } from "../types";

const STATUS_FILTERS: { key: "all" | ShipmentStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
];

function initials(name: string | null, fallback: string): string {
  const source = name?.trim() || fallback;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<ShipmentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ShipmentStatus>("all");

  useEffect(() => {
    listShipments()
      .then(setShipments)
      .catch(() => setError("Could not load shipments."));
  }, []);

  const handleDelete = async (id: string) => {
    setRowError(null);
    try {
      await deleteShipment(id);
      setShipments((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    } catch (err) {
      setRowError(err instanceof ApiRequestError ? err.message : "Could not delete this shipment.");
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: shipments?.length ?? 0 };
    for (const s of shipments ?? []) {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    }
    return counts;
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    if (!shipments) return null;
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      const reference = (s.reference ?? "").toLowerCase();
      const customer = (s.customer_name ?? "").toLowerCase();
      return reference.includes(q) || customer.includes(q);
    });
  }, [shipments, query, statusFilter]);

  const hasAnyShipments = (shipments?.length ?? 0) > 0;
  const isFiltering = query.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1>Shipments</h1>
          <p className="page-subtitle">All uploaded shipment document sets and their comparison status.</p>
        </div>
        <Link to="/upload" className="btn btn--primary">
          <FlickLabel>
            <Icon name="plus" /> New Shipment
          </FlickLabel>
        </Link>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {rowError && <div className="alert alert--error">{rowError}</div>}

      {hasAnyShipments && (
        <div className="list-toolbar">
          <label className="search-field">
            <Icon name="search" className="search-field-icon" />
            <input
              type="search"
              placeholder="Search by reference or customer name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search shipments"
            />
          </label>

          <div className="filter-tabs">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={statusFilter === key ? "active" : ""}
                onClick={() => setStatusFilter(key)}
              >
                {label}
                <span className="filter-tab-count">{statusCounts[key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {shipments === null && !error && (
        <div className="table-scroll">
          <table className="shipment-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <span className="skeleton" style={{ width: "65%", height: "1.1rem" }} />
                  </td>
                  <td>
                    <span className="skeleton" style={{ width: "45%", height: "1.1rem" }} />
                  </td>
                  <td>
                    <span className="skeleton skeleton-pill" style={{ width: "6rem", height: "1.7rem" }} />
                  </td>
                  <td>
                    <span className="skeleton" style={{ width: "55%", height: "1.1rem" }} />
                  </td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shipments && !hasAnyShipments && (
        <div className="empty-state">
          <Icon name="file-text" className="empty-state-icon" />
          <p>No shipments uploaded yet.</p>
          <Link to="/upload" className="btn btn--primary">
            <FlickLabel>Upload your first document set</FlickLabel>
          </Link>
        </div>
      )}

      {shipments && hasAnyShipments && filteredShipments && filteredShipments.length === 0 && (
        <div className="empty-state">
          <Icon name="file-text" className="empty-state-icon" />
          <p>No shipments match{isFiltering ? " your search" : ""}.</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
            }}
          >
            <FlickLabel>Clear filters</FlickLabel>
          </button>
        </div>
      )}

      {shipments && filteredShipments && filteredShipments.length > 0 && (
        <div className="table-scroll">
          <table className="shipment-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s) => (
                <tr
                  key={s.id}
                  className="row-clickable"
                  onClick={() => navigate(`/shipments/${s.id}`)}
                >
                  <td>
                    <span className="row-link">{s.reference ?? `Shipment ${s.id.slice(0, 8)}`}</span>
                  </td>
                  <td>
                    {s.customer_name ? (
                      <span className="customer-cell">
                        <span className="customer-avatar" aria-hidden>
                          {initials(s.customer_name, "?")}
                        </span>
                        {s.customer_name}
                      </span>
                    ) : (
                      <span className="muted">Not yet identified</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="muted">{formatDate(s.created_at)}</td>
                  <td className="shipment-table-actions" onClick={(e) => e.stopPropagation()}>
                    <ConfirmButton
                      label="Delete"
                      confirmLabel="Confirm"
                      busyLabel="Deleting…"
                      className="btn btn--ghost-danger btn--sm"
                      title="Delete this shipment and its documents"
                      icon={<Icon name="trash" />}
                      onConfirm={() => handleDelete(s.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
