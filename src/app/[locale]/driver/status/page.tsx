"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getDriverEligibilityStatus } from "@/lib/complianceDocuments";
import { buildDriverStatusSummary, getCurrentDriverApplication } from "@/lib/driverOnboarding";

export default function DriverStatusPage() {
  const { locale } = useParams<{ locale: string }>();
  const draft = useMemo(() => getCurrentDriverApplication(), []);
  const summary = buildDriverStatusSummary(draft);
  const complianceSummary = useMemo(() => getDriverEligibilityStatus(draft?.email ?? ""), [draft?.email]);

  return (
    <DriverPortalLayout locale={String(locale)} active="status" title="Application status" subtitle="Track the approval status of your driver application.">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${summary.tone}`}>{summary.label}</span>
        </div>
        <p className="text-sm text-slate-600">Your application remains pending verification until LogicMoov reviews the submitted documents and vehicle information.</p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Booking eligibility</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">{complianceSummary.summary}</p>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${complianceSummary.eligible ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {complianceSummary.eligible ? "Eligible" : "Blocked"}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Detail label="Driver" value={draft?.fullName || "Not available"} />
          <Detail label="Email" value={draft?.email || "Not available"} />
          <Detail label="Status" value={draft?.status || "Draft"} />
          <Detail label="Last updated" value={draft?.updatedAt ? new Date(draft.updatedAt).toLocaleString() : "Not available"} />
        </div>
      </div>
    </DriverPortalLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#f8fafc] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
