"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import {
  DRIVER_DOCUMENT_DEFINITIONS,
  getDriverPortalSession,
  getDriverDocuments,
  getSignedDocumentUrl,
  normalizeDocumentStatus,
  upsertDriverDocument,
} from "@/lib/driverPortal";

export default function DriverDocumentsPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string>("image/jpeg");

  const documentLookup = useMemo(() => {
    return Object.fromEntries(documents.map((document) => [String(document.document_type), document]));
  }, [documents]);

  useEffect(() => {
    if (!getDriverPortalSession()) {
      router.replace(`/${locale}/driver/login`);
      return;
    }

    void loadDocuments();
  }, [locale, router]);

  const loadDocuments = async () => {
    const rows = await getDriverDocuments();
    setDocuments(rows);
  };

  const handleUpload = async (definitionId: string, file?: File | null) => {
    if (!file) return;
    setError(null);
    setNotice(null);

    try {
      await upsertDriverDocument(definitionId, file);
      await loadDocuments();
      setNotice("Document uploaded successfully. Status: Uploaded - Pending Review");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the document.");
    }
  };

  const handleView = async (path: string) => {
    if (!path) return;

    try {
      const url = await getSignedDocumentUrl(path);
      if (!url) {
        setError("This document cannot be opened right now.");
        return;
      }

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        setPreviewUrl(null);
        setError("The uploaded document is not available right now. Please re-upload it or try again.");
        return;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewMimeType(blob.type || "image/jpeg");
      setPreviewUrl(blobUrl);
      setError(null);
    } catch {
      setPreviewUrl(null);
      setError("This document cannot be opened right now.");
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewMimeType("image/jpeg");
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="documents" title="Required Documents" subtitle="Upload the required documents below. Each file must be a PDF, JPG, JPEG, or PNG under 10 MB.">
      <div className="space-y-5">
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" onClick={closePreview}>
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">Document preview</span>
                <button type="button" onClick={closePreview} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Close
                </button>
              </div>
              <div className="bg-slate-50 p-3">
                {previewMimeType === "application/pdf" ? (
                  <iframe src={previewUrl} title="Document preview" className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white" />
                ) : (
                  <img src={previewUrl} alt="Document preview" className="mx-auto max-h-[75vh] rounded-xl object-contain" />
                )}
              </div>
            </div>
          </div>
        )}
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

        {DRIVER_DOCUMENT_DEFINITIONS.map((definition) => {
          const record = documentLookup[definition.dbType] as Record<string, unknown> | undefined;
          const status = normalizeDocumentStatus(String(record?.status || ""));
          const filePath = typeof record?.file_path === "string" ? record.file_path : "";
          const rejectionReason = typeof record?.rejection_reason === "string" ? record.rejection_reason : "";

          return (
            <div key={definition.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{definition.label}</h2>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusTone(status)}`}>
                  {statusText(status)}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-600">{record?.original_filename ? `Uploaded: ${String(record.original_filename)}` : "Status: Not Uploaded"}</div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-bold text-white">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
                      className="hidden"
                      onChange={(event) => void handleUpload(definition.id, event.target.files?.[0])}
                    />
                    {filePath ? "Replace Document" : "Upload Document"}
                  </label>
                  {filePath && (
                    <button type="button" onClick={() => void handleView(filePath)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
                      View
                    </button>
                  )}
                </div>
              </div>

              {rejectionReason && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Rejection reason: {rejectionReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DriverPortalLayout>
  );
}

function statusText(status: string) {
  switch (status) {
    case "pending":
      return "Uploaded - Pending Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected - Please upload a new document";
    default:
      return "Not Uploaded";
  }
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
}
