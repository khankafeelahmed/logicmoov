"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getDriverPortalSession, registerDriverAccount } from "@/lib/driverPortal";

export default function DriverRegisterPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getDriverPortalSession()) {
      router.replace(`/${locale}/driver/dashboard`);
    }
  }, [locale, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setStatusType("success");
    setIsSubmitting(true);

    try {
      const result = await registerDriverAccount(form);
      if (!result.ok) {
        setStatusType("error");
        setStatus(result.message);
        return;
      }

      setStatusType("success");
      setStatus(result.message);
      setTimeout(() => {
        router.push(`/${locale}/driver/login`);
      }, 1400);
    } catch (error) {
      setStatusType("error");
      setStatus(error instanceof Error ? error.message : "Unable to create the driver account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="register" title="Driver registration" subtitle="Create your driver portal account with a unique Login ID and password.">
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        {status && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              statusType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status}
          </div>
        )}

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
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" minLength={8} required />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm Password</span>
          <input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" minLength={8} required />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a href={`/${locale}/driver/login`} className="text-sm font-semibold text-[#1d4ed8]">Already have an account? Log in</a>
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}
