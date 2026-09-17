import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiRequestError, createShipment } from "../api/client";
import FileDropzone from "../components/FileDropzone";
import FlickLabel from "../components/FlickLabel";
import Icon from "../components/Icon";

export default function UploadPage() {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<File | null>(null);
  const [packingList, setPackingList] = useState<File | null>(null);
  const [billOfLading, setBillOfLading] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = invoice && packingList && billOfLading && !submitting;
  const uploadedCount = [invoice, packingList, billOfLading].filter(
    Boolean,
  ).length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice || !packingList || !billOfLading) return;
    setSubmitting(true);
    setError(null);
    try {
      const shipment = await createShipment({
        invoice,
        packingList,
        billOfLading,
      });
      navigate(`/shipments/${shipment.id}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Upload failed. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Upload Shipment Documents</h1>
        <p className="page-subtitle">
          Upload the Commercial Invoice, Packing List, and Bill of Lading for a
          single shipment. We'll extract the data and flag any mismatches
          between them.
        </p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="dropzone-grid">
          <FileDropzone
            label="Commercial Invoice"
            file={invoice}
            onChange={setInvoice}
          />
          <FileDropzone
            label="Packing List"
            file={packingList}
            onChange={setPackingList}
          />
          <FileDropzone
            label="Bill of Lading"
            file={billOfLading}
            onChange={setBillOfLading}
          />
        </div>

        <div className="upload-progress" role="status">
          <div className="upload-progress-track">
            <div
              className="upload-progress-fill"
              style={{ width: `${(uploadedCount / 3) * 100}%` }}
            />
          </div>
          <span className="upload-progress-label">
            {uploadedCount} of 3 documents ready
          </span>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={!canSubmit}
        >
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

      <div className="how-it-works">
        <div className="how-it-works-step">
          <span className="how-it-works-icon">
            <Icon name="upload-cloud" />
          </span>
          <div>
            <h4>1. Upload</h4>
            <p>
              Drop in the invoice, packing list, and bill of lading for one
              shipment.
            </p>
          </div>
        </div>
        <Icon name="chevron-right" className="how-it-works-arrow" />
        <div className="how-it-works-step">
          <span className="how-it-works-icon">
            <Icon name="bolt" />
          </span>
          <div>
            <h4>2. Extract</h4>
            <p>
              We read every field from each PDF automatically, no manual entry.
            </p>
          </div>
        </div>
        <Icon name="chevron-right" className="how-it-works-arrow" />
        <div className="how-it-works-step">
          <span className="how-it-works-icon">
            <Icon name="file-check" />
          </span>
          <div>
            <h4>3. Compare</h4>
            <p>
              Mismatches between documents are flagged instantly on the shipment
              page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
