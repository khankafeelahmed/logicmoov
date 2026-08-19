"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getDriverPortalSession, logoutDriverAccount } from "@/lib/driverPortal";

export default function DriverDashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getDriverPortalSession>>(null);

  useEffect(() => {
    const current = getDriverPortalSession();
    if (!current) {
      router.replace(`/${locale}/driver/login`);
      return;
    }

    setSession(current);
  }, [locale, router]);

  const loginId = session?.loginId || "-";

  const handleLogout = async () => {
    await logoutDriverAccount();
    router.push(`/${locale}/driver/login`);
  };

  if (!session) {
    return null;
  }

  return (
    <DriverPortalLayout locale={String(locale)} active="dashboard" title="LogicMoov Driver Portal" subtitle="Upload your required taxi documents below.">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Driver login</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoCard label="Login ID" value={loginId} />
            <InfoCard label="Portal" value="Documents" />
          </div>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Required documents</h2>
          <p className="mt-2 text-sm text-slate-600">Upload the required documents for your taxi licence application.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => router.push(`/${locale}/driver/documents`)} className="rounded-xl bg-[#111827] px-4 py-3 text-sm font-bold text-white">
              Go to documents
            </button>
            <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
              Logout
            </button>
          </div>
        </section>
      </div>
    </DriverPortalLayout>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
