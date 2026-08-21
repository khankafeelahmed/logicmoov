"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getDriverEligibilityStatus } from "@/lib/complianceDocuments";
import { buildDriverStatusSummary, getCurrentDriverApplication, type DriverApplicationDraft } from "@/lib/driverOnboarding";

const statusLabels = ["Draft", "Submitted", "Under Review", "Needs Information", "Approved", "Rejected", "Suspended"];
const dashboardCards = [
  { label: "Profile", href: "/driver/profile" },
  { label: "Identity Verification", href: "/driver/documents" },
  { label: "Driver Licence", href: "/driver/profile" },
  { label: "Work Authorization", href: "/driver/profile" },
  { label: "Vehicle", href: "/driver/vehicle" },
  { label: "Insurance", href: "/driver/vehicle" },
  { label: "Documents & Compliance", href: "/driver/documents" },
  { label: "Application", href: "/driver/application" },
];

export default function DriverDashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<DriverApplicationDraft | null>(null);

  useEffect(() => {
    // getCurrentDriverApplication() reads localStorage, which differs between the server-rendered
    // pass (no window) and the client — deferring the read/set avoids a hydration mismatch while
    // still not calling setState synchronously within the effect body itself.
    const timeoutId = window.setTimeout(() => {
      setDraft(getCurrentDriverApplication());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const summary = buildDriverStatusSummary(draft);
  const complianceSummary = useMemo(() => getDriverEligibilityStatus(draft?.email ?? ""), [draft?.email]);
  const firstName = draft?.firstName || "Driver";

  if (!draft) {
    return (
      <DriverPortalLayout locale={String(locale)} active="dashboard" title="Driver dashboard" subtitle="Review your application progress and continue where you left off.">
        <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">No saved record</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-800">No driver record found</h2>
            <p className="mt-2 text-sm text-slate-600">There is no active driver profile or saved application for this portal session.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => router.push(`/${locale}/driver/register`)} className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-bold text-white">Register</button>
            <button type="button" onClick={() => router.push(`/${locale}/driver/login`)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Login</button>
          </div>
        </div>
      </DriverPortalLayout>
    );
  }

  return (
    <DriverPortalLayout locale={String(locale)} active="dashboard" title="Driver dashboard" subtitle="Review your application progress and continue where you left off.">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Welcome</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#111827]">Welcome, {firstName}</h2>

          <div className="mt-6 rounded-2xl bg-[#f7f5ee] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Application Status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statusLabels.map((label) => {
                const active = summary.label === label;
                return (
                  <span key={label} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-[#111827] text-white" : "border border-slate-200 bg-white text-slate-500"}`}>
                    {label}
                  </span>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Booking eligibility</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{complianceSummary.summary}</p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${complianceSummary.eligible ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {complianceSummary.eligible ? "Eligible" : "Blocked"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Driver Profile</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ProfileField label="First Name" value={draft?.firstName} />
            <ProfileField label="Last Name" value={draft?.lastName} />
            <ProfileField label="Email" value={draft?.personal?.email || draft?.account?.email || draft?.email} />
            <ProfileField label="Phone Number" value={draft?.account?.mobilePhone || draft?.personal?.mobilePhone} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Status" value={summary.label} tone={summary.tone} />
          <StatCard label="Vehicle" value={draft?.vehicle?.category || "Not added"} tone="bg-slate-100 text-slate-700" />
          <StatCard label="Documents" value={draft?.documents?.driversLicence ? "Uploaded" : "Missing"} tone="bg-slate-100 text-slate-700" />
          <StatCard label="Email" value={draft?.account?.emailVerified ? "Verified" : "Not verified"} tone="bg-slate-100 text-slate-700" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => router.push(`/${locale}${card.href}`)}
              className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#1d4ed8] hover:bg-[#f8fbff]"
            >
              <p className="text-sm font-semibold text-slate-800">{card.label}</p>
            </button>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Progress indicator</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <ProgressRow label="Profile" complete={Boolean(draft?.personal?.email && draft?.firstName && draft?.lastName)} />
            <ProgressRow label="Identity" complete={Boolean(draft?.documents?.photoId1 && draft?.documents?.photoId2)} />
            <ProgressRow label="Vehicle" complete={Boolean(draft?.vehicle?.make && draft?.vehicle?.model)} />
            <ProgressRow label="Documents" complete={Boolean(draft?.documents?.driversLicence)} />
            <ProgressRow label="Review" complete={false} pending />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionButton label="Complete Application" onClick={() => router.push(`/${locale}/driver/application`)} />
          <ActionButton label="Upload Missing Documents" onClick={() => router.push(`/${locale}/driver/documents`)} />
          <ActionButton label="View Application Status" onClick={() => router.push(`/${locale}/driver/status`)} />
          <ActionButton label="Contact LogicMoov" onClick={() => window.location.href = "mailto:support@logicmoov.com"} />
        </div>
      </div>
    </DriverPortalLayout>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value || "Not provided"}</p>
    </div>
  );
}

function ProgressRow({ label, complete, pending = false }: { label: string; complete: boolean; pending?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2">
      <span className="font-medium text-slate-700">{label}</span>
      <span className={`text-xs font-bold ${complete ? "text-emerald-600" : pending ? "text-amber-600" : "text-slate-400"}`}>
        {complete ? "✓" : pending ? "→ Pending" : "○"}
      </span>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[22px] bg-[#f5c84d] px-4 py-3 text-sm font-bold text-[#111827] shadow-sm hover:bg-[#f0b72b]">
      {label}
    </button>
  );
}
