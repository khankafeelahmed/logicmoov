"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, Eye, ShieldCheck, XCircle } from "lucide-react";
import { getToken } from "@/lib/adminAuth";
import {
  COMPLIANCE_DOCUMENT_DEFINITIONS,
  approveComplianceDocument,
  getAllComplianceRecords,
  getComplianceAuditTrail,
  getComplianceExpiryAlerts,
  rejectComplianceDocument,
  type ComplianceDocumentId,
  type DriverComplianceRecord,
} from "@/lib/complianceDocuments";

const statusClasses = {
  missing: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function AdminCompliancePage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [records, setRecords] = useState<DriverComplianceRecord[]>(() => getAllComplianceRecords());
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

  const loadRecords = () => setRecords(getAllComplianceRecords());

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(`/${locale}/admin/login`);
    }
  }, [locale, router]);

  const expiryAlerts = getComplianceExpiryAlerts();
  const totalDrivers = records.length;
  const pendingDocs = records.reduce((count, record) => {
    return count + Object.values(record.documents).filter((doc) => doc && doc.status === "pending").length;
  }, 0);
  const rejectedDocs = records.reduce((count, record) => {
    return count + Object.values(record.documents).filter((doc) => doc && doc.status === "rejected").length;
  }, 0);
  const expiredDocs = records.reduce((count, record) => {
    return count + Object.values(record.documents).filter((doc) => doc && doc.status === "expired").length;
  }, 0);

  const handleApprove = (driverEmail: string, type: ComplianceDocumentId) => {
    approveComplianceDocument(driverEmail, type, "admin");
    loadRecords();
  };

  const handleReject = (driverEmail: string, type: ComplianceDocumentId) => {
    const key = `${driverEmail}:${type}`;
    const reason = reasonMap[key]?.trim() || "No reason provided.";
    rejectComplianceDocument(driverEmail, type, reason, "admin");
    loadRecords();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-ink-400">Admin portal</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.06em] text-ink-900">Compliance review</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Driver compliance
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Drivers" value={String(totalDrivers)} />
        <SummaryCard label="Pending review" value={String(pendingDocs)} />
        <SummaryCard label="Rejected" value={String(rejectedDocs)} />
        <SummaryCard label="Expired" value={String(expiredDocs)} />
      </div>

      {expiryAlerts.length > 0 && (
        <div className="rounded-[26px] border border-orange-200 bg-orange-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-orange-800">Expiry monitoring</h2>
          </div>
          <div className="space-y-2 text-sm text-orange-800">
            {expiryAlerts.slice(0, 6).map((alert) => (
              <div key={`${alert.driverEmail}-${alert.documentType}`} className="rounded-xl border border-orange-200 bg-white px-3 py-2">
                <span className="font-semibold">{alert.driverEmail}</span> — {getDocumentLabel(alert.documentType)} {alert.document.status === "expired" ? "is expired" : `expires in ${alert.daysRemaining} days`}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="rounded-[24px] border border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
            No driver compliance records have been uploaded yet.
          </div>
        ) : (
          records.map((record) => (
            <div key={record.driverEmail} className="rounded-[28px] border border-ink-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-ink-400">Driver</p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-ink-900">{record.driverEmail}</h2>
                </div>
                <div className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-600">
                  {Object.values(record.documents).filter(Boolean).length} uploaded documents
                </div>
              </div>

              <div className="space-y-3">
                {COMPLIANCE_DOCUMENT_DEFINITIONS.map((definition) => {
                  const document = record.documents[definition.id];
                  const key = `${record.driverEmail}:${definition.id}`;
                  const status = document?.status ?? "missing";

                  return (
                    <div key={key} className="rounded-[22px] border border-ink-200 bg-ink-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink-700 shadow-sm">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-ink-900">{definition.label}</p>
                            <p className="mt-1 text-xs text-ink-500">
                              {document?.documentNumber ? `Document #${document.documentNumber}` : "No document number provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[status]}`}>{formatStatus(status)}</span>
                          {document?.fileDataUrl && (
                            <>
                              <a href={document.fileDataUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100">
                                <Eye className="h-3.5 w-3.5" /> Preview
                              </a>
                              <a href={document.fileDataUrl} download={document.fileName || `${definition.id}.pdf`} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100">
                                <Download className="h-3.5 w-3.5" /> Download
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {document && (
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <Meta label="Issue date" value={document.issueDate || "—"} />
                          <Meta label="Expiry date" value={document.expiryDate || "—"} />
                          <Meta label="Uploaded" value={new Date(document.uploadedAt).toLocaleDateString()} />
                        </div>
                      )}

                      {document?.rejectionReason && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          Rejection reason: {document.rejectionReason}
                        </div>
                      )}

                      {document?.fileDataUrl && (
                        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                          <input
                            value={reasonMap[key] ?? document.rejectionReason ?? ""}
                            onChange={(event) => setReasonMap((current) => ({ ...current, [key]: event.target.value }))}
                            placeholder="Enter rejection reason (required when rejecting)"
                            className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none ring-0 transition focus:border-brand-500"
                          />

                          <button type="button" onClick={() => handleApprove(record.driverEmail, definition.id)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </button>
                          <button type="button" onClick={() => handleReject(record.driverEmail, definition.id)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500">
                            <XCircle className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      )}

                      {!document?.fileDataUrl && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          Awaiting driver upload.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[24px] border border-ink-200 bg-ink-50 p-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-ink-500">Audit trail</h3>
                <div className="mt-3 space-y-2">
                  {getComplianceAuditTrail(record.driverEmail).slice(0, 5).map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-600">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink-800">{entry.action}</span>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">{entry.actor}</span>
                      </div>
                      <p className="mt-1">{entry.details}</p>
                      <p className="mt-1 text-[11px] text-ink-400">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-ink-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-400">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-ink-900">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink-800">{value}</p>
    </div>
  );
}

function getDocumentLabel(type: ComplianceDocumentId) {
  return COMPLIANCE_DOCUMENT_DEFINITIONS.find((definition) => definition.id === type)?.label ?? type;
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
