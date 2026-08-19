"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getDriverPortalSession, loginDriverAccount } from "@/lib/driverPortal";

export default function DriverLoginPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ loginId: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getDriverPortalSession()) {
      router.replace(`/${locale}/driver/documents`);
    }
  }, [locale, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginDriverAccount(form.loginId, form.password);
      router.push(`/${locale}/driver/documents`);
    } catch {
      setError("Invalid Login ID or Password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="login" title="Driver login" subtitle="Use your Login ID and password to access your portal.">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Login ID</span>
          <input
            type="text"
            value={form.loginId}
            onChange={(event) => setForm({ ...form, loginId: event.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            placeholder="jdoe"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            required
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/driver/register`)}
            className="text-sm font-semibold text-[#1d4ed8]"
          >
            Need an account? Register
          </button>
          <button
            type="button"
            onClick={() => setError("Password reset is not available yet. Please contact support.")}
            className="text-sm font-semibold text-slate-600"
          >
            Forgot Password
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </DriverPortalLayout>
  );
}
