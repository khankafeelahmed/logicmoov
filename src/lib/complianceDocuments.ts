export type ComplianceDocumentId =
  | "transport_licence"
  | "fleet_insurance"
  | "taxi_registration"
  | "mechanical_inspection";

export type ComplianceDocumentStatus = "missing" | "pending" | "approved" | "rejected" | "expired";

export type ComplianceDocumentRecord = {
  id: string;
  type: ComplianceDocumentId;
  driverEmail: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status: ComplianceDocumentStatus;
  fileName?: string;
  mimeType?: string;
  fileDataUrl?: string;
  uploadedAt: string;
  updatedAt: string;
  reviewerId?: string;
  rejectionReason?: string;
  replacementOf?: string;
};

import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";

export type DriverComplianceRecord = {
  driverEmail: string;
  documents: Partial<Record<ComplianceDocumentId, ComplianceDocumentRecord>>;
  updatedAt: string;
};

export type ComplianceAuditEntry = {
  id: string;
  driverEmail: string;
  documentType?: ComplianceDocumentId;
  action: "upload" | "replace" | "approve" | "reject" | "status_changed";
  actor: "driver" | "admin";
  timestamp: string;
  details: string;
  metadata?: Record<string, string | number | boolean | undefined>;
};

export const COMPLIANCE_DOCUMENT_DEFINITIONS = [
  {
    id: "transport_licence",
    label: "Transport Operating Licence / SAAQ Taxi Licence",
    mandatory: true,
    requiresDocumentNumber: true,
    requiresExpiry: true,
  },
  {
    id: "fleet_insurance",
    label: "Fleet / Vehicle Insurance Certificate",
    mandatory: true,
    requiresDocumentNumber: true,
    requiresExpiry: true,
  },
  {
    id: "taxi_registration",
    label: "Taxi Registration Certificate from SAAQ",
    mandatory: true,
    requiresDocumentNumber: true,
    requiresExpiry: true,
  },
  {
    id: "mechanical_inspection",
    label: "SAAQ Mechanical Inspection Certificate",
    mandatory: true,
    requiresDocumentNumber: true,
    requiresExpiry: true,
  },
] as const;

const DRIVER_COMPLIANCE_KEY = "taxi_logicmoov_driver_compliance_v1";
const COMPLIANCE_AUDIT_KEY = "taxi_logicmoov_compliance_audit_v1";
const DRIVER_COMPLIANCE_BUCKET = "driver-documents";
const DRIVER_DOCUMENTS_TABLE = "driver_documents";
const DRIVER_DOCUMENT_AUDIT_TABLE = "driver_document_audit_log";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readComplianceRecords(): DriverComplianceRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DRIVER_COMPLIANCE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as DriverComplianceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function syncToSupabase(record: ComplianceDocumentRecord) {
  if (!hasSupabaseConfig()) return;

  try {
    let fileUrl = record.fileDataUrl ?? "";
    if (fileUrl.startsWith("data:")) {
      const fileName = record.fileName || `${record.type}-${Date.now()}.pdf`;
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${record.driverEmail}/${safeName}`;
      const match = fileUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        const mimeType = match[1] || record.mimeType || "application/octet-stream";
        const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
        const uploadFile = new File([bytes], safeName, { type: mimeType });
        const { error } = await supabase.storage.from(DRIVER_COMPLIANCE_BUCKET).upload(path, uploadFile, { contentType: mimeType, upsert: true });
        if (!error) {
          const signed = await supabase.storage.from(DRIVER_COMPLIANCE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
          fileUrl = signed.data?.signedUrl || signed.data?.publicUrl || fileUrl;
        }
      }
    }

    const payload = {
      driver_email: record.driverEmail,
      document_type: record.type,
      document_number: record.documentNumber ?? null,
      issue_date: record.issueDate || null,
      expiry_date: record.expiryDate || null,
      status: record.status,
      file_name: record.fileName ?? null,
      mime_type: record.mimeType ?? null,
      file_path: fileUrl ? fileUrl : null,
      public_url: fileUrl || null,
      uploaded_at: record.uploadedAt,
      updated_at: record.updatedAt,
      reviewer_id: record.reviewerId ?? null,
      rejection_reason: record.rejectionReason ?? null,
      replacement_of: record.replacementOf ?? null,
    };

    const { error } = await supabase
      .from(DRIVER_DOCUMENTS_TABLE)
      .upsert(payload, { onConflict: "driver_email,document_type" });

    if (!error) {
      await supabase.from(DRIVER_DOCUMENT_AUDIT_TABLE).insert({
        driver_email: record.driverEmail,
        document_type: record.type,
        action: record.status === "rejected" ? "reject" : "upload",
        actor: "driver",
        details: `${record.type} record synced to Supabase.`,
        metadata: { status: record.status, file_name: record.fileName ?? "" },
      });
    }
  } catch {
    // Ignore Supabase sync failures and fall back to local storage persistence.
  }
}

function writeComplianceRecords(records: DriverComplianceRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRIVER_COMPLIANCE_KEY, JSON.stringify(records));
}

function readAuditEntries(): ComplianceAuditEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(COMPLIANCE_AUDIT_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ComplianceAuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAuditEntries(entries: ComplianceAuditEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPLIANCE_AUDIT_KEY, JSON.stringify(entries));
}

function parseExpiryDate(value?: string) {
  if (!value) return null;
  const time = new Date(`${value}T23:59:59`).getTime();
  if (Number.isNaN(time)) return null;
  return time;
}

function hasFile(doc?: ComplianceDocumentRecord) {
  return Boolean(doc && doc.fileDataUrl);
}

export function deriveComplianceDocumentStatus(doc?: ComplianceDocumentRecord): ComplianceDocumentStatus {
  if (!doc || !hasFile(doc)) {
    return "missing";
  }

  if (doc.status === "rejected") {
    return "rejected";
  }

  const expiryAt = parseExpiryDate(doc.expiryDate);
  if (expiryAt !== null && expiryAt < Date.now()) {
    return "expired";
  }

  if (doc.status === "approved") {
    return "approved";
  }

  return doc.status === "pending" ? "pending" : "pending";
}

export function syncComplianceDocumentStatuses(driverEmail: string) {
  const email = normalizeEmail(driverEmail);
  if (!email) return null;

  const records = readComplianceRecords();
  const record = records.find((item) => normalizeEmail(item.driverEmail) === email) ?? null;
  if (!record) return null;

  let changed = false;
  for (const type of Object.keys(record.documents) as ComplianceDocumentId[]) {
    const current = record.documents[type];
    if (!current) continue;
    const nextStatus = deriveComplianceDocumentStatus(current);
    if (current.status !== nextStatus) {
      current.status = nextStatus;
      current.updatedAt = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    record.updatedAt = new Date().toISOString();
    writeComplianceRecords(records.map((item) => (normalizeEmail(item.driverEmail) === email ? record : item)));
  }

  return record;
}

export function getDriverComplianceRecord(driverEmail: string): DriverComplianceRecord {
  const email = normalizeEmail(driverEmail);
  if (!email) {
    return {
      driverEmail: "",
      documents: {},
      updatedAt: new Date().toISOString(),
    };
  }

  const records = readComplianceRecords();
  const existing = records.find((item) => normalizeEmail(item.driverEmail) === email);

  if (!existing) {
    const fallback: DriverComplianceRecord = {
      driverEmail: email,
      documents: {},
      updatedAt: new Date().toISOString(),
    };
    writeComplianceRecords([...records, fallback]);
    return fallback;
  }

  for (const doc of Object.values(existing.documents)) {
    if (doc) {
      doc.status = deriveComplianceDocumentStatus(doc);
    }
  }

  existing.updatedAt = new Date().toISOString();
  writeComplianceRecords(records.map((item) => (normalizeEmail(item.driverEmail) === email ? existing : item)));
  return existing;
}

export function getComplianceDocument(driverEmail: string, type: ComplianceDocumentId) {
  const record = getDriverComplianceRecord(driverEmail);
  return record.documents[type];
}

export function upsertComplianceDocument(
  driverEmail: string,
  type: ComplianceDocumentId,
  input: Partial<ComplianceDocumentRecord> & { status?: ComplianceDocumentStatus },
): ComplianceDocumentRecord {
  const email = normalizeEmail(driverEmail);
  if (!email) {
    return {
      id: `${type}-${Date.now()}`,
      type,
      driverEmail: "",
      status: "missing",
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const records = readComplianceRecords();
  const record = records.find((item) => normalizeEmail(item.driverEmail) === email) ?? {
    driverEmail: email,
    documents: {},
    updatedAt: new Date().toISOString(),
  };

  const existingDoc = record.documents[type];
  const now = new Date().toISOString();
  const nextDoc: ComplianceDocumentRecord = {
    id: existingDoc?.id ?? `${type}-${Date.now()}`,
    type,
    driverEmail: email,
    documentNumber: input.documentNumber ?? existingDoc?.documentNumber ?? "",
    issueDate: input.issueDate ?? existingDoc?.issueDate ?? "",
    expiryDate: input.expiryDate ?? existingDoc?.expiryDate ?? "",
    status: input.status ?? existingDoc?.status ?? "pending",
    fileName: input.fileName ?? existingDoc?.fileName,
    mimeType: input.mimeType ?? existingDoc?.mimeType,
    fileDataUrl: input.fileDataUrl ?? existingDoc?.fileDataUrl,
    uploadedAt: input.uploadedAt ?? existingDoc?.uploadedAt ?? now,
    updatedAt: now,
    reviewerId: input.reviewerId ?? existingDoc?.reviewerId,
    rejectionReason: input.rejectionReason ?? existingDoc?.rejectionReason,
    replacementOf: input.replacementOf ?? existingDoc?.replacementOf,
  };

  if (!nextDoc.fileDataUrl) {
    nextDoc.status = "missing";
  } else {
    nextDoc.status = deriveComplianceDocumentStatus(nextDoc);
  }

  record.documents[type] = nextDoc;
  record.updatedAt = now;

  const existingIndex = records.findIndex((item) => normalizeEmail(item.driverEmail) === email);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }

  writeComplianceRecords(records);
  void syncToSupabase(nextDoc);

  const action = existingDoc && existingDoc.fileDataUrl && input.fileDataUrl ? "replace" : "upload";
  logComplianceAudit({
    driverEmail: email,
    documentType: type,
    action,
    actor: "driver",
    timestamp: now,
    details: `${action === "replace" ? "Replaced" : "Uploaded"} ${COMPLIANCE_DOCUMENT_DEFINITIONS.find((item) => item.id === type)?.label ?? type}.`,
    metadata: {
      fileName: nextDoc.fileName ?? "",
      status: nextDoc.status,
    },
  });

  return nextDoc;
}

export function approveComplianceDocument(driverEmail: string, type: ComplianceDocumentId, reviewerId?: string) {
  const email = normalizeEmail(driverEmail);
  const current = getComplianceDocument(email, type);
  const now = new Date().toISOString();
  const next = upsertComplianceDocument(email, type, {
    ...current,
    status: "approved",
    reviewerId: reviewerId ?? current?.reviewerId ?? "admin",
    rejectionReason: "",
    updatedAt: now,
  });

  logComplianceAudit({
    driverEmail: email,
    documentType: type,
    action: "approve",
    actor: "admin",
    timestamp: now,
    details: `Approved ${COMPLIANCE_DOCUMENT_DEFINITIONS.find((item) => item.id === type)?.label ?? type}.`,
    metadata: { reviewerId: reviewerId ?? "admin" },
  });
  void syncToSupabase(next);

  return next;
}

export function rejectComplianceDocument(
  driverEmail: string,
  type: ComplianceDocumentId,
  reason: string,
  reviewerId?: string,
) {
  const email = normalizeEmail(driverEmail);
  const current = getComplianceDocument(email, type);
  const now = new Date().toISOString();
  const next = upsertComplianceDocument(email, type, {
    ...current,
    status: "rejected",
    reviewerId: reviewerId ?? current?.reviewerId ?? "admin",
    rejectionReason: reason,
    updatedAt: now,
  });

  logComplianceAudit({
    driverEmail: email,
    documentType: type,
    action: "reject",
    actor: "admin",
    timestamp: now,
    details: `Rejected ${COMPLIANCE_DOCUMENT_DEFINITIONS.find((item) => item.id === type)?.label ?? type}: ${reason || "No reason provided."}`,
    metadata: { reviewerId: reviewerId ?? "admin", reason },
  });
  void syncToSupabase(next);

  return next;
}

export function logComplianceAudit(entry: Omit<ComplianceAuditEntry, "id">) {
  if (typeof window === "undefined") return;
  const entries = readAuditEntries();
  const nextEntry: ComplianceAuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  };
  writeAuditEntries([nextEntry, ...entries]);
  return nextEntry;
}

export function getComplianceAuditTrail(driverEmail?: string, documentType?: ComplianceDocumentId) {
  const entries = readAuditEntries();
  return entries.filter((entry) => {
    if (driverEmail && normalizeEmail(entry.driverEmail) !== normalizeEmail(driverEmail)) return false;
    if (documentType && entry.documentType !== documentType) return false;
    return true;
  });
}

export function getAllComplianceRecords() {
  const records = readComplianceRecords();
  return records.map((record) => {
    for (const key of Object.keys(record.documents) as ComplianceDocumentId[]) {
      const doc = record.documents[key];
      if (doc) {
        doc.status = deriveComplianceDocumentStatus(doc);
      }
    }
    return record;
  });
}

export function getComplianceExpiryAlerts() {
  const records = getAllComplianceRecords();
  const alerts: Array<{ driverEmail: string; documentType: ComplianceDocumentId; document: ComplianceDocumentRecord; daysRemaining: number }> = [];

  for (const record of records) {
    for (const [type, document] of Object.entries(record.documents) as [ComplianceDocumentId, ComplianceDocumentRecord | undefined][]) {
      if (!document || !document.expiryDate || !document.fileDataUrl) continue;
      const expiryStamp = parseExpiryDate(document.expiryDate);
      if (expiryStamp === null) continue;
      const daysRemaining = Math.ceil((expiryStamp - Date.now()) / 86400000);
      if (document.status === "expired" || daysRemaining <= 30) {
        alerts.push({
          driverEmail: record.driverEmail,
          documentType: type,
          document,
          daysRemaining,
        });
      }
    }
  }

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function getDriverEligibilityStatus(driverEmail: string) {
  const email = normalizeEmail(driverEmail);
  const record = email ? getDriverComplianceRecord(email) : { driverEmail: "", documents: {}, updatedAt: new Date().toISOString() };
  const missing: string[] = [];
  const rejected: string[] = [];
  const expired: string[] = [];
  const statuses: Record<string, ComplianceDocumentStatus> = {};

  for (const definition of COMPLIANCE_DOCUMENT_DEFINITIONS) {
    const document = record.documents[definition.id];
    const status = deriveComplianceDocumentStatus(document);
    statuses[definition.id] = status;

    if (status === "missing") {
      missing.push(definition.label);
    }
    if (status === "rejected") {
      rejected.push(definition.label);
    }
    if (status === "expired") {
      expired.push(definition.label);
    }
  }

  const eligible =
    COMPLIANCE_DOCUMENT_DEFINITIONS.every((definition) => {
      const status = statuses[definition.id];
      return status === "approved";
    }) && missing.length === 0 && rejected.length === 0 && expired.length === 0;

  return {
    eligible,
    missing,
    rejected,
    expired,
    statuses,
    summary: eligible
      ? "Eligible for new bookings"
      : missing.length || rejected.length || expired.length
        ? "Blocked from new bookings"
        : "Compliance review required",
  };
}

export function clearComplianceStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRIVER_COMPLIANCE_KEY);
  window.localStorage.removeItem(COMPLIANCE_AUDIT_KEY);
}
