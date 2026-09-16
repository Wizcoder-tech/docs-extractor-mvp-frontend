import type { ComparisonReport, DocType, ShipmentDetail, ShipmentListItem } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.detail ?? message;
    } catch {
      // response body wasn't JSON; fall back to statusText
    }
    throw new ApiRequestError(res.status, message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export interface CreateShipmentInput {
  customerName?: string;
  invoice: File;
  packingList: File;
  billOfLading: File;
}

export async function createShipment(input: CreateShipmentInput): Promise<ShipmentDetail> {
  const formData = new FormData();
  if (input.customerName) formData.append("customer_name", input.customerName);
  formData.append("invoice", input.invoice);
  formData.append("packing_list", input.packingList);
  formData.append("bill_of_lading", input.billOfLading);

  return request<ShipmentDetail>("/api/shipments", { method: "POST", body: formData });
}

export function listShipments(): Promise<ShipmentListItem[]> {
  return request<ShipmentListItem[]>("/api/shipments");
}

export function getShipment(id: string): Promise<ShipmentDetail> {
  return request<ShipmentDetail>(`/api/shipments/${id}`);
}

export function getComparison(id: string): Promise<ComparisonReport> {
  return request<ComparisonReport>(`/api/shipments/${id}/comparison`);
}

export function documentFileUrl(id: string): string {
  return `${API_BASE}/api/documents/${id}/file`;
}

export function deleteShipment(id: string): Promise<void> {
  return request<void>(`/api/shipments/${id}`, { method: "DELETE" });
}

export function replaceDocument(shipmentId: string, docType: DocType, file: File): Promise<ShipmentDetail> {
  const formData = new FormData();
  formData.append("file", file);
  return request<ShipmentDetail>(`/api/shipments/${shipmentId}/documents/${docType}`, {
    method: "PUT",
    body: formData,
  });
}

export { ApiRequestError };
