import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiRequestError, createShipment } from "../api/client";
import FileDropzone from "../components/FileDropzone";
import FlickLabel from "../components/FlickLabel";
import Icon from "../components/Icon";

export default function UploadPage() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [invoice, setInvoice] = useState<File | null>(null);
  const [packingList, setPackingList] = useState<File | null>(null);
  const [billOfLading, setBillOfLading] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = invoice && packingList && billOfLading && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice || !packingList || !billOfLading) return;
    setSubmitting(true);
    setError(null);
    try {
      const shipment = await createShipment({
        customerName: customerName || undefined,
        invoice,
        packingList,
        billOfLading,
      });
      navigate(`/shipments/${shipment.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Upload Shipment Documents</h1>
        <p className="page-subtitle">
          Upload the Commercial Invoice, Packing List, and Bill of Lading for a single shipment. We'll extract the
          data and flag any mismatches between them.
        </p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="text-field">
          <span>Customer / Buyer name (optional)</span>
          <input
            type="text"
            placeholder="e.g. C.W. Mackie PLC"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </label>

        <div className="dropzone-grid">
          <FileDropzone label="Commercial Invoice" file={invoice} onChange={setInvoice} />
          <FileDropzone label="Packing List" file={packingList} onChange={setPackingList} />
          <FileDropzone label="Bill of Lading" file={billOfLading} onChange={setBillOfLading} />
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <button type="submit" className="btn btn--primary btn--block" disabled={!canSubmit}>
          {submitting ? (
            <>
              <span className="spinner" aria-hidden /> Uploading…
            </>
          ) : (
            <FlickLabel>
              <Icon name="upload-cloud" /> Upload &amp; Compare
            </FlickLabel>
          )}
        </button>
      </form>
    </div>
  );
}
