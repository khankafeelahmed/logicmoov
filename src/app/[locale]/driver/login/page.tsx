"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { getCurrentDriverApplication } from "@/lib/driverOnboarding";

const SESSION_KEY = "taxi_logicmoov_driver_session";

async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle && typeof window !== "undefined") {
    const encoded = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return btoa(password);
}

export default function DriverLoginPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const loginEmail = form.email.trim().toLowerCase();
      let firstName = "";
      let lastName = "";
      let authenticated = false;

      // Try Supabase auth first — but don't give up if it fails (e.g. email not confirmed)
      if (hasSupabaseConfig()) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: form.password,
        });
        if (!authError && data.user) {
          firstName = (data.user.user_metadata?.first_name as string | undefined) ?? "";
          lastName = (data.user.user_metadata?.last_name as string | undefined) ?? "";
          authenticated = true;
        }
      }

      // Always fall back to localStorage hash check (covers: email not confirmed, Supabase down, no config)
      if (!authenticated) {
        const raw =
          typeof window !== "undefined"
            ? window.localStorage.getItem("taxi_logicmoov_driver_application")
            : null;
        const drafts = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
        const hash = await hashPassword(form.password);
        const match = drafts.find(
          (d) =>
            String(d.email ?? "").toLowerCase() === loginEmail &&
            d.passwordHash === hash,
        );
        if (!match) {
          setError("Invalid email or password.");
          return;
        }
        firstName = String(match.firstName ?? "");
        lastName = String(match.lastName ?? "");
      }

      // Write session and redirect to the register flow (which resumes at the right step)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ email: loginEmail, firstName, lastName }),
        );
      }

      // Check where the driver left off
      const app = getCurrentDriverApplication();
      if (
        app &&
        (app.status === "submitted" ||
          app.status === "under_review" ||
          app.status === "approved" ||
          app.status === "pending_verification")
      ) {
        router.push(`/${locale}/driver/register`);
      } else {
        router.push(`/${locale}/driver/register`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DriverPortalLayout
      locale={String(locale)}
      active="login"
      title="Sign in to your account"
      subtitle="Access your driver portal and continue your application."
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dfeafc]"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dfeafc]"
            autoComplete="current-password"
            required
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/${locale}/driver/register`}
            className="text-sm font-semibold text-[#1d4ed8] hover:underline"
          >
            Don&apos;t have an account? Register →
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white hover:bg-[#1f2937] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}


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
