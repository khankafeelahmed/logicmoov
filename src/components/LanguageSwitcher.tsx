"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";

export default function LanguageSwitcher({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  const pathname = usePathname();

  function pathForLocale(target: Locale) {
    const segments = pathname.split("/");
    // segments[0] is "" because pathname starts with "/"
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-ink-200 bg-white/70 p-1">
      {!compact && (
        <Globe className="ml-1 h-4 w-4 text-ink-400" aria-hidden="true" />
      )}
      {locales.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={pathForLocale(l)}
            aria-current={active ? "true" : undefined}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition ${
              active
                ? "bg-ink-900 text-white"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <span className="sr-only">{localeNames[l]}</span>
            {l}
          </Link>
        );
      })}
    </div>
  );
}
