"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Car, CheckCircle2, ClipboardList, FileCheck2, ShieldCheck, UserCircle2, WalletCards } from "lucide-react";

interface DriverPortalLayoutProps {
  locale: string;
  active: "dashboard" | "register" | "login" | "profile" | "vehicle" | "documents" | "application" | "status";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const items = [
  { id: "dashboard", label: "Dashboard", href: "/driver/dashboard" },
  { id: "profile", label: "Profile", href: "/driver/profile" },
  { id: "vehicle", label: "Vehicle", href: "/driver/vehicle" },
  { id: "documents", label: "Documents & Compliance", href: "/driver/documents" },
  { id: "application", label: "Application", href: "/driver/application" },
  { id: "status", label: "Status", href: "/driver/status" },
] as const;

export default function DriverPortalLayout({ locale, active, title, subtitle, children }: DriverPortalLayoutProps) {
  const pathname = usePathname();
  const pathLocale = pathname?.split("/")[1] || locale;
  const prefix = `/${pathLocale}`;

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
                    {item.id === "profile" && <UserCircle2 className="h-4 w-4" />}
                    {item.id === "vehicle" && <Car className="h-4 w-4" />}
                    {item.id === "documents" && <FileCheck2 className="h-4 w-4" />}
                    {item.id === "application" && <CheckCircle2 className="h-4 w-4" />}
                    {item.id === "status" && <WalletCards className="h-4 w-4" />}
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
