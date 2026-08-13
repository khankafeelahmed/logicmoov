"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getCurrentDriverApplication, saveDriverApplication } from "@/lib/driverOnboarding";

export default function DriverDocumentsPage() {
  const { locale } = useParams<{ locale: string }>();
  const draft = useMemo(() => getCurrentDriverApplication(), []);
  const [documents, setDocuments] = useState({
    photoId1: draft?.documents?.photoId1?.documentType ?? "Government-issued photo ID #1",
    photoId2: draft?.documents?.photoId2?.documentType ?? "Government-issued photo ID #2",
    driversLicence: draft?.documents?.driversLicence?.documentType ?? "Driver's licence",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    saveDriverApplication({
      email: draft?.email ?? "",
      documents: {
        photoId1: { id: "photoId1", documentType: documents.photoId1, filePath: "/uploads/photo-id-1", uploadedAt: new Date().toISOString(), verificationStatus: "pending" },
        photoId2: { id: "photoId2", documentType: documents.photoId2, filePath: "/uploads/photo-id-2", uploadedAt: new Date().toISOString(), verificationStatus: "pending" },
        driversLicence: { id: "driversLicence", documentType: documents.driversLicence, filePath: "/uploads/drivers-licence", uploadedAt: new Date().toISOString(), verificationStatus: "pending" },
      },
    });
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="documents" title="Identity verification" subtitle="Upload government-issued identification and your driver licence.">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <UploadCard label={documents.photoId1} />
        <UploadCard label={documents.photoId2} />
        <UploadCard label={documents.driversLicence} />
        <div className="md:col-span-3 flex justify-end">
          <button type="submit" className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Save documents</button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}

function UploadCard({ label }: { label: string }) {
  return (
    <label className="flex min-h-[180px] cursor-pointer flex-col justify-between rounded-[24px] border border-dashed border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Upload</span>
      <input type="file" className="hidden" />
    </label>
  );
}
