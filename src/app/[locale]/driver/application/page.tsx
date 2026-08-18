"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { canSubmitDriverApplication, getCurrentDriverApplication, saveDriverApplication, type DriverApplicationDraft } from "@/lib/driverOnboarding";

export default function DriverApplicationPage() {
  const { locale } = useParams<{ locale: string }>();
  const [draft, setDraft] = useState<DriverApplicationDraft | null>(null);

  useEffect(() => {
    setDraft(getCurrentDriverApplication());
  }, []);

  const checklist = canSubmitDriverApplication(draft);
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    verification: false,
    accuracy: false,
  });

  useEffect(() => {
    if (!draft) return;
    setConsents((current) => ({
      ...current,
      terms: draft.account?.termsAccepted ?? false,
      privacy: draft.account?.privacyAccepted ?? false,
    }));
  }, [draft]);

  const handleToggle = (key: keyof typeof consents) => {
    setConsents((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!checklist.canSubmit || !consents.terms || !consents.privacy || !consents.verification || !consents.accuracy) {
      return;
    }

    const now = new Date().toISOString();
    const consentEntries = [
      { type: "driver_terms", version: "2025-01", timestamp: now, userId: draft.id },
      { type: "privacy_policy", version: "2025-01", timestamp: now, userId: draft.id },
      { type: "verification_authorization", version: "2025-01", timestamp: now, userId: draft.id },
      { type: "accuracy_confirmation", version: "2025-01", timestamp: now, userId: draft.id },
    ];

    saveDriverApplication({
      email: draft.email,
      status: "submitted",
      account: { ...draft.account, emailVerified: true, termsAccepted: consents.terms, privacyAccepted: consents.privacy },
      consents: consentEntries,
    });
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="application" title="Application review" subtitle="Review the information before submitting to LogicMoov for verification.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Detail label="Full name" value={draft?.fullName || "Not provided"} />
          <Detail label="Email" value={draft?.email || "Not provided"} />
          <Detail label="Phone" value={draft?.account?.mobilePhone || "Not provided"} />
          <Detail label="Vehicle" value={draft?.vehicle?.category || "Not yet added"} />
          <Detail label="Work authorization" value={draft?.workEligibility?.status || "Not provided"} />
          <Detail label="Licence" value={draft?.licence?.licenceNumber || "Not yet provided"} />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Submission checklist</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {checklist.missing.length === 0 ? (
              <li className="font-semibold text-emerald-700">All required items are complete and ready for submission.</li>
            ) : checklist.missing.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Consent declarations</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <label className="flex items-start gap-3"><input type="checkbox" checked={consents.terms} onChange={() => handleToggle("terms")} /> <span>I agree to the LogicMoov Driver Terms and Conditions.</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={consents.privacy} onChange={() => handleToggle("privacy")} /> <span>I acknowledge the LogicMoov Privacy Policy.</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={consents.verification} onChange={() => handleToggle("verification")} /> <span>I authorize LogicMoov to verify the information and documents submitted as part of the driver application.</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={consents.accuracy} onChange={() => handleToggle("accuracy")} /> <span>I confirm that the information provided is accurate and complete.</span></label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!checklist.canSubmit || !consents.terms || !consents.privacy || !consents.verification || !consents.accuracy}
            className="rounded-xl bg-[#f5c84d] px-5 py-3 text-sm font-bold text-[#111827] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            Submit application
          </button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
