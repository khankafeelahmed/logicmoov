"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getCurrentDriverApplication, signInDriverAccount } from "@/lib/driverOnboarding";

export default function DriverLoginPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ email: getCurrentDriverApplication()?.email ?? "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const draft = signInDriverAccount(form.email, form.password);
    if (!draft) {
      setError("Invalid driver email or account not yet verified.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("taxi_logicmoov_driver_session", JSON.stringify({
        email: draft.email,
        fullName: draft.fullName,
        status: draft.status,
      }));
    }
    router.push(`/${locale}/driver/dashboard`);
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="login" title="Driver login" subtitle="Access your driver portal and manage your application.">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
        </label>

        <div className="flex items-center justify-between gap-3">
          <a href={`/${locale}/driver/register`} className="text-sm font-semibold text-[#1d4ed8]">Need an account? Register</a>
          <button type="submit" className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Sign in</button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}
