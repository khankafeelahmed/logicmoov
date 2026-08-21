"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Car, ClipboardList, FileCheck2, LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { getDriverPortalSession, logoutDriverAccount } from "@/lib/driverPortal";

interface DriverPortalLayoutProps {
  locale: string;
  active: "dashboard" | "register" | "login" | "profile" | "vehicle" | "documents" | "application" | "status";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// Only these two are shown in the sidebar for now. Profile/Vehicle/Application/Status
// pages still exist and are still reachable by direct link — just not in the nav.
const items = [
  { id: "dashboard", label: "Dashboard", href: "/driver/dashboard" },
  { id: "documents", label: "Documents & Compliance", href: "/driver/documents" },
] as const;

export default function DriverPortalLayout({ locale, active, title, subtitle, children }: DriverPortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pathLocale = pathname?.split("/")[1] || locale;
  const prefix = `/${pathLocale}`;
  const hasActiveSession = Boolean(getDriverPortalSession()?.email);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      const result = await logoutDriverAccount();
      if (!result.ok) {
        // The local session is still cleared at this point even if the remote call failed,
        // so it's safe (and correct) to redirect either way — just let the driver know.
        setLogoutError(result.message || "There was a problem signing out, but you have been logged out on this device.");
      }
      router.push(`${prefix}/driver/login`);
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : "Unable to sign out. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3efe8] text-[#111827]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827] text-[#f7d07a] shadow-sm">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-[#111827]">Taxi LogicMoov</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Driver Portal</p>
            </div>
          </div>
          {!hasActiveSession && (
            <div className="flex items-center gap-2">
              <Link href={`/${pathLocale}/driver/login`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <UserCircle2 className="h-4 w-4" />
                Login
              </Link>
              <Link href={`/${pathLocale}/driver/register`} className="inline-flex items-center gap-2 rounded-full bg-[#f5c84d] px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm hover:bg-[#f0b72b]">
                <ArrowUpRight className="h-4 w-4" />
                Register
              </Link>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#f7f3ec] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dfeafc] text-[#1d4ed8]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Driver access</p>
                <p className="text-sm font-bold text-slate-800">Account center</p>
              </div>
            </div>

            {hasActiveSession && (
              <>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Logging out…" : "Logout"}
                </button>
                {logoutError && (
                  <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {logoutError}
                  </p>
                )}
              </>
            )}

            <nav className="space-y-2">
              {items.map((item) => {
                const isActive = item.id === active;
                return (
                  <Link
                    key={item.id}
                    href={`${prefix}${item.href}`}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive ? "bg-[#111827] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.id === "dashboard" && <ClipboardList className="h-4 w-4" />}
                    {item.id === "documents" && <FileCheck2 className="h-4 w-4" />}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="rounded-[28px] border border-slate-200 bg-[#f9f6f1] p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Driver portal</p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#111827]">{title}</h1>
                {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
