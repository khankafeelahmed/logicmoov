"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  LayoutDashboard,
  CalendarCheck,
  Users,
  LogOut,
  Loader2,
  MessagesSquare,
} from "lucide-react";
import { clearSession, getToken, getUser, type AdminUser } from "@/lib/adminAuth";

export default function AdminShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${locale}/admin`;
  const isLoginPage = pathname === `${base}/login`;

  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token && !isLoginPage) {
      router.replace(`${base}/login`);
      return;
    }
    setUser(getUser());
    setChecked(true);
  }, [base, isLoginPage, router]);

  // The login page renders without the dashboard chrome.
  if (isLoginPage) {
    return <div className="min-h-screen bg-ink-50">{children}</div>;
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
      </div>
    );
  }

  const nav = [
    { label: "Dashboard", href: base, icon: LayoutDashboard },
    { label: "Bookings", href: `${base}/bookings`, icon: CalendarCheck },
    { label: "Drivers", href: `${base}/drivers`, icon: Users },
    { label: "Support", href: `${base}/support`, icon: MessagesSquare },
  ];

  function logout() {
    clearSession();
    router.replace(`${base}/login`);
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
            <Car className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-ink-900">TxIGOLD</p>
            <p className="text-xs text-ink-400">Admin</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== base && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 p-3">
          {user && (
            <p className="px-3 pb-2 text-xs text-ink-400">{user.email}</p>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
          <span className="font-extrabold text-ink-900">TxIGOLD Admin</span>
          <button type="button" onClick={logout} className="text-sm text-ink-500">
            Sign out
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-ink-200 bg-white px-2 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
