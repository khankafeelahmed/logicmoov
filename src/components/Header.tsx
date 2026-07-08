"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone, X, Car } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const base = `/${locale}`;

  const links = [
    { label: dict.nav.services, href: `${base}#services` },
    { label: dict.nav.howItWorks, href: `${base}#how` },
    { label: dict.nav.fleet, href: `${base}#fleet` },
    { label: dict.nav.coverage, href: `${base}#coverage` },
    { label: dict.nav.about, href: `${base}/about` },
    { label: dict.nav.contact, href: `${base}/contact` },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={base} className="flex items-center gap-2" aria-label={dict.brand.name}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
            <Car className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink-900">
            TxI<span className="text-brand-600">GOLD</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-600 transition hover:text-ink-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} />
          <a
            href={`tel:${dict.contact.phone.replace(/[^+\d]/g, "")}`}
            className="flex items-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-900"
          >
            <Phone className="h-4 w-4" />
            {dict.contact.phone}
          </a>
          <Link
            href={`${base}/book`}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-ink-900 shadow-sm transition hover:bg-brand-400"
          >
            {dict.nav.book}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher locale={locale} compact />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={dict.nav.menu}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 text-ink-700"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`${base}/book`}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-brand-500 px-5 py-3 text-center text-base font-bold text-ink-900"
            >
              {dict.nav.book}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
