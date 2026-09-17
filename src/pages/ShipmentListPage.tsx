import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiRequestError, deleteShipment, listShipments } from "../api/client";
import ConfirmButton from "../components/ConfirmButton";
import FlickLabel from "../components/FlickLabel";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import type { ShipmentListItem } from "../types";

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<ShipmentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

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

      {shipments && shipments.length === 0 && (
        <div className="empty-state">
          <Icon name="file-text" className="empty-state-icon" />
          <p>No shipments uploaded yet.</p>
          <Link to="/upload" className="btn btn--primary">
            <FlickLabel>Upload your first document set</FlickLabel>
          </Link>
        </div>
      )}

      {shipments && shipments.length > 0 && (
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
              {shipments.map((s) => (
                <tr
                  key={s.id}
                  className="row-clickable"
                  onClick={() => navigate(`/shipments/${s.id}`)}
                >
                  <td>
                    <span className="row-link">{s.reference ?? `Shipment ${s.id.slice(0, 8)}`}</span>
                  </td>
                  <td>{s.customer_name ?? <span className="muted">—</span>}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="muted">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="shipment-table-actions" onClick={(e) => e.stopPropagation()}>
                    <ConfirmButton
                      label="Delete"
                      confirmLabel="Delete shipment"
                      busyLabel="Deleting…"
                      className="btn btn--ghost-danger btn--sm"
                      title="Delete this shipment and its documents"
                      icon={<Icon name="trash" />}
                      confirmTitle={`Delete ${s.reference ?? `shipment ${s.id.slice(0, 8)}`}?`}
                      confirmMessage="This will permanently delete this shipment and its documents. This can't be undone."
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
