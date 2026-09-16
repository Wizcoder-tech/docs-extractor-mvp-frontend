export type DocType = "commercial_invoice" | "packing_list" | "bill_of_lading";

export type ProcessingStatus = "pending" | "processing" | "success" | "failed";
export type ShipmentStatus = "pending" | "processing" | "completed" | "failed";
export type CheckStatus = "match" | "mismatch" | "warning";

export interface DocumentDetail {
  id: string;
  doc_type: DocType;
  original_filename: string;
  file_hash: string;
  file_size: number;
  status: ProcessingStatus;
  error_message: string | null;
  was_cache_hit: boolean;
  created_at: string;
  extracted_data: Record<string, unknown> | null;
}

export interface ShipmentListItem {
  id: string;
  reference: string | null;
  customer_name: string | null;
  status: ShipmentStatus;
  created_at: string;
  updated_at: string;
}

export interface ShipmentDetail extends ShipmentListItem {
  documents: DocumentDetail[];
}

export interface FieldCheck {
  pair: string;
  pair_label: string;
  field: string;
  field_label: string;
  scope: "header" | "line_item";
  line_item_key: string | null;
  doc_a_type: DocType;
  doc_a_value: string | null;
  doc_b_type: DocType;
  doc_b_value: string | null;
  status: CheckStatus;
  detail: string | null;
  safety_critical: boolean;
}

export interface ComparisonSummary {
  total_checks: number;
  matched: number;
  mismatched: number;
  warnings: number;
}

export interface ComparisonReport {
  id: string;
  shipment_id: string;
  summary: ComparisonSummary;
  checks: FieldCheck[];
  created_at: string;
}

export interface ApiError {
  detail: string;
}
