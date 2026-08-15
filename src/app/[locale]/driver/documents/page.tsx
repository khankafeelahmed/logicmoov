"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import {
  COMPLIANCE_DOCUMENT_DEFINITIONS,
  type ComplianceDocumentId,
  type ComplianceDocumentRecord,
  getDriverComplianceRecord,
  getDriverEligibilityStatus,
  upsertComplianceDocument,
} from "@/lib/complianceDocuments";
import { getCurrentDriverApplication } from "@/lib/driverOnboarding";

const STATUS_STYLES: Record<ComplianceDocumentRecord["status"], string> = {
  missing: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function DriverDocumentsPage() {
  const { locale } = useParams<{ locale: string }>();
  const draft = useMemo(() => getCurrentDriverApplication(), []);
  const driverEmail = draft?.email ?? "";
  const initialRecords = useMemo(
    () => (driverEmail ? getDriverComplianceRecord(driverEmail).documents : {}),
    [driverEmail],
  );
  const [records, setRecords] = useState<Record<ComplianceDocumentId, ComplianceDocumentRecord | undefined>>(
    initialRecords as Record<ComplianceDocumentId, ComplianceDocumentRecord | undefined>,
  );
  const [notice, setNotice] = useState<string>("");

  const eligibility = getDriverEligibilityStatus(driverEmail);

  const updateDocumentField = (type: ComplianceDocumentId, field: keyof ComplianceDocumentRecord, value: string) => {
    setRecords((current) => {
      const existing = current[type] ?? {
        id: `${type}-${Date.now()}`,
        type,
        driverEmail,
        status: "missing",
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...current,
        [type]: {
          ...existing,
          [field]: value,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const handleFileUpload = async (type: ComplianceDocumentId, file?: File | null) => {
    if (!file || !driverEmail) return;
    const dataUrl = await readFileAsDataUrl(file);
    setRecords((current) => {
      const existing = current[type] ?? {
        id: `${type}-${Date.now()}`,
        type,
        driverEmail,
        status: "pending",
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...current,
        [type]: {
          ...existing,
          driverEmail,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileDataUrl: dataUrl,
          status: "pending",
          uploadedAt: existing.uploadedAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });
    setNotice(`${getDocumentLabel(type)} file added. Save to submit it for review.`);
  };

  const handleSave = (type: ComplianceDocumentId) => {
    const doc = records[type];
    if (!driverEmail) {
      setNotice("Please sign in to a driver account before saving compliance documents.");
      return;
    }
    if (!doc?.fileDataUrl) {
      setNotice(`Please upload ${getDocumentLabel(type)} before saving.`);
      return;
    }

    const saved = upsertComplianceDocument(driverEmail, type, {
      ...doc,
      driverEmail,
      documentNumber: doc.documentNumber ?? "",
      issueDate: doc.issueDate ?? "",
      expiryDate: doc.expiryDate ?? "",
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

    setRecords((current) => ({ ...current, [type]: saved }));
    setNotice(`${getDocumentLabel(type)} saved successfully. Admin review is pending.`);
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="documents" title="Documents & Compliance" subtitle="Upload the mandatory compliance documents required to remain eligible for new bookings.">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Booking eligibility</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.06em] text-[#111827]">{eligibility.summary}</h2>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${eligibility.eligible ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {eligibility.eligible ? "Eligible" : "Blocked"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatusTile label="Approved" value={Object.values(eligibility.statuses).filter((value) => value === "approved").length.toString()} />
            <StatusTile label="Missing" value={eligibility.missing.length.toString()} />
            <StatusTile label="Expired or rejected" value={(eligibility.expired.length + eligibility.rejected.length).toString()} />
          </div>
        </div>

        {notice && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{notice}</div>
        )}

        <div className="grid gap-5">
          {COMPLIANCE_DOCUMENT_DEFINITIONS.map((definition) => {
            const doc = records[definition.id];
            const status = doc?.status ?? "missing";
            return (
              <div key={definition.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xl font-black tracking-[-0.04em] text-[#111827]">{definition.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{definition.mandatory ? "Mandatory" : "Optional"} compliance document</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>{toLabel(status)}</span>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
                  <label className="flex min-h-[190px] cursor-pointer flex-col justify-between rounded-[22px] border border-dashed border-slate-200 bg-[#f9fafb] p-4 transition hover:border-[#111827]">
                    <span className="text-sm font-semibold text-slate-700">{doc?.fileName ? doc.fileName : "Upload document"}</span>
                    <span className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">Browse file</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(event) => {
                        void handleFileUpload(definition.id, event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    {doc?.fileDataUrl && (
                      <button type="button" onClick={() => window.open(doc.fileDataUrl, "_blank", "noopener,noreferrer")} className="text-left text-xs font-medium text-[#1d4ed8] underline-offset-2 hover:underline">
                        Preview uploaded file
                      </button>
                    )}
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Document number" value={doc?.documentNumber ?? ""} onChange={(value) => updateDocumentField(definition.id, "documentNumber", value)} />
                    <Field label="Issue date" type="date" value={doc?.issueDate ?? ""} onChange={(value) => updateDocumentField(definition.id, "issueDate", value)} />
                    <Field label="Expiry date" type="date" value={doc?.expiryDate ?? ""} onChange={(value) => updateDocumentField(definition.id, "expiryDate", value)} />
                    <div className="rounded-[18px] border border-slate-200 bg-[#f8fafc] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Status</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{toLabel(status)}</p>
                    </div>
                  </div>
                </div>

                {(status === "rejected" || status === "expired") && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    This document was {status === "rejected" ? "rejected" : "expired"}. Upload a replacement to restore eligibility for new bookings.
                  </div>
                )}

                {doc?.rejectionReason && (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Rejection reason: {doc.rejectionReason}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  {doc?.fileDataUrl && (
                    <a href={doc.fileDataUrl} download={doc.fileName || `${definition.id}.pdf`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Download
                    </a>
                  )}
                  <button type="button" onClick={() => handleSave(definition.id)} className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                    {status === "rejected" || status === "expired" ? "Replace document" : "Save document"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DriverPortalLayout>
  );
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-[18px] border border-slate-200 bg-[#f8fafc] p-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border-0 bg-transparent text-sm font-medium text-slate-800 outline-none"
      />
    </label>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#f8fafc] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.06em] text-[#111827]">{value}</p>
    </div>
  );
}

function getDocumentLabel(type: ComplianceDocumentId) {
  return COMPLIANCE_DOCUMENT_DEFINITIONS.find((definition) => definition.id === type)?.label ?? "Document";
}

function toLabel(status: ComplianceDocumentRecord["status"] | undefined) {
  if (!status) return "Missing";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}
