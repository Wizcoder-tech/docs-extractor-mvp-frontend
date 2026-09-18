import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ApiRequestError,
  deleteShipment,
  documentFileUrl,
  getComparison,
  getShipment,
  replaceDocument,
} from "../api/client";
import ComparisonView from "../components/ComparisonView";
import ConfirmButton from "../components/ConfirmButton";
import FlickLabel from "../components/FlickLabel";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import type { ComparisonReport, DocType, ShipmentDetail } from "../types";

const DOC_LABELS: Record<string, string> = {
  commercial_invoice: "Commercial Invoice",
  packing_list: "Packing List",
  bill_of_lading: "Bill of Lading",
};

const ACTIVE_STATUSES = new Set(["pending", "processing"]);
const NOTE_TRUNCATE_LENGTH = 160;

function ExtractionNote({ note }: { note: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.length > NOTE_TRUNCATE_LENGTH;
  const display = expanded || !isLong ? note : `${note.slice(0, NOTE_TRUNCATE_LENGTH).trimEnd()}…`;

  return (
    <div className="extraction-note" title="Flagged by the extraction model — review this document manually">
      <span className="extraction-note-label">
        <Icon name="alert-triangle" /> Needs review
      </span>
      <p className="extraction-note-text">{display}</p>
      {isLong && (
        <button type="button" className="extraction-note-toggle" onClick={() => setExpanded((v) => !v)}>
          <FlickLabel>{expanded ? "Show less" : "Show more"}</FlickLabel>
        </button>
      )}
    </div>
  );
}

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [comparison, setComparison] = useState<ComparisonReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replacingDocType, setReplacingDocType] = useState<DocType | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const fileInputRefs = useRef<Partial<Record<DocType, HTMLInputElement | null>>>({});

  const refresh = useCallback(async () => {
    if (!shipmentId) return;
    try {
      const data = await getShipment(shipmentId);
      setShipment(data);
      if (data.status === "completed") {
        const report = await getComparison(shipmentId);
        setComparison(report);
      }
    } catch {
      setError("Could not load this shipment.");
    }
  }, [shipmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!shipment) return;
    if (ACTIVE_STATUSES.has(shipment.status)) {
      pollRef.current = window.setTimeout(refresh, 2000);
    }
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, [shipment, refresh]);

  const handleDeleteShipment = async () => {
    if (!shipmentId) return;
    await deleteShipment(shipmentId);
    navigate("/shipments");
  };

  const handleReplace = async (docType: DocType, file: File | undefined) => {
    if (!shipmentId || !file) return;
    setReplaceError(null);
    setReplacingDocType(docType);
    try {
      const updated = await replaceDocument(shipmentId, docType, file);
      setShipment(updated);
      setComparison(null); // stale until reprocessing finishes
    } catch (err) {
      setReplaceError(err instanceof ApiRequestError ? err.message : `Could not replace the ${DOC_LABELS[docType]}.`);
    } finally {
      setReplacingDocType(null);
      const input = fileInputRefs.current[docType];
      if (input) input.value = "";
    }
  };

  if (error) return <div className="page alert alert--error">{error}</div>;
  if (!shipment) {
    return (
      <div className="page">
        <div className="page-header page-header--row">
          <div>
            <span className="skeleton" style={{ width: "6rem", height: "0.9rem", marginBottom: "0.6rem" }} />
            <span className="skeleton" style={{ width: "16rem", height: "1.85rem", marginTop: "0.3rem" }} />
          </div>
          <span className="skeleton skeleton-pill" style={{ width: "7rem", height: "2rem" }} />
        </div>
        <div className="document-cards">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <span className="skeleton" style={{ width: "60%", height: "1.1rem" }} />
              <span className="skeleton" style={{ width: "85%", height: "0.9rem" }} />
              <span className="skeleton" style={{ width: "100%", height: "2.6rem" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isReprocessing = ACTIVE_STATUSES.has(shipment.status);

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <Link to="/shipments" className="back-link">
            ← All shipments
          </Link>
          <h1>{shipment.reference ?? `Shipment ${shipment.id.slice(0, 8)}`}</h1>
          <p className="page-subtitle">{shipment.customer_name ?? "Customer not yet identified"}</p>
        </div>
        <div className="page-header-actions">
          <StatusBadge status={shipment.status} />
          <ConfirmButton
            label="Delete shipment"
            confirmLabel="Delete shipment"
            busyLabel="Deleting…"
            className="btn btn--ghost-danger btn--sm"
            title="Delete this shipment, its documents, and its comparison history"
            icon={<Icon name="trash" />}
            dialogTitle="Delete shipment"
            dialogMessage={`Are you sure you want to delete shipment "${shipment.reference ?? shipment.id.slice(0, 8)}"? This will delete all its uploaded documents and comparison results.`}
            onConfirm={handleDeleteShipment}
          />
        </div>
      </div>

      {replaceError && <div className="alert alert--error">{replaceError}</div>}

      <div className="document-cards">
        {shipment.documents.map((doc) => {
          const extractionNotes =
            typeof doc.extracted_data?.extraction_notes === "string" ? doc.extracted_data.extraction_notes : null;
          const isReplacingThis = replacingDocType === doc.doc_type;
          return (
            <div key={doc.id} className="document-card">
              <div className="document-card-header">
                <strong>{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</strong>
                <StatusBadge status={doc.status} />
              </div>
              <a href={documentFileUrl(doc.id)} target="_blank" rel="noreferrer" className="document-filename">
                {doc.original_filename}
              </a>
              {doc.was_cache_hit && (
                <span
                  className="cache-hit-badge"
                  title="Identical file was already extracted previously — the extraction model was not called again"
                >
                  <Icon name="bolt" /> reused cached extraction
                </span>
              )}
              {doc.error_message && <p className="document-error">{doc.error_message}</p>}
              {extractionNotes && <ExtractionNote note={extractionNotes} />}

              <div className="document-card-footer">
                <input
                  ref={(el) => {
                    fileInputRefs.current[doc.doc_type as DocType] = el;
                  }}
                  type="file"
                  accept=".pdf,application/pdf"
                  hidden
                  onChange={(e) => handleReplace(doc.doc_type as DocType, e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={isReplacingThis}
                  onClick={() => fileInputRefs.current[doc.doc_type as DocType]?.click()}
                >
                  {isReplacingThis ? (
                    <>
                      <span className="spinner" aria-hidden /> Uploading…
                    </>
                  ) : (
                    <FlickLabel>
                      <Icon name="pencil" /> Replace &amp; reprocess
                    </FlickLabel>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isReprocessing && (
        <p className="processing-note">
          <span className="spinner" aria-hidden /> Extracting and comparing documents… this page updates
          automatically.
        </p>
      )}

      {shipment.status === "failed" && !shipment.documents.some((d) => d.error_message) && (
        <p className="alert alert--error">Processing failed. Please check the documents and try again.</p>
      )}

      {comparison && !isReprocessing && shipmentId && (
        <ComparisonView report={comparison} shipmentId={shipmentId} onReportChange={setComparison} />
      )}
    </div>
  );
}
