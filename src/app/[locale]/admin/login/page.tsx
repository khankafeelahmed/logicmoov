"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { setSession } from "@/lib/adminAuth";

export default function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const [email, setEmail] = useState("admin@txigold.ca");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      if (result.user.role !== "ADMIN" && result.user.role !== "AGENT") {
        setError("This account does not have admin access.");
        return;
      }
      setSession(result);
      router.replace(`/${locale}/admin`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "Invalid credentials."
          : "Could not reach the API. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
            <Car className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold text-ink-900">TxIGOLD</p>
            <p className="text-xs text-ink-400">Admin sign in</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">
          Seeded admin: admin@txigold.ca / Admin1234!
        </p>
      </div>
    </div>
  );
}
