import Link from "next/link";
import { Car, Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const base = `/${locale}`;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-ink-950 text-ink-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={base} className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
                <Car className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-white">Taxi</span>{" "}
                <span className="text-white">Logic</span>
                <span className="text-brand-400">Moov</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
              {dict.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              {dict.footer.company}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={`${base}/about`} className="text-ink-400 hover:text-white">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`${base}#how`} className="text-ink-400 hover:text-white">
                  {dict.nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link href={`${base}/contact`} className="text-ink-400 hover:text-white">
                  {dict.nav.contact}
                </Link>
              </li>
              <li>
                <Link href={`${base}/about#founders`} className="text-ink-400 hover:text-white">
                  {dict.footer.meetFounders}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              {dict.footer.servicesCol}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {dict.services.items.slice(0, 4).map((item) => (
                <li key={item.title}>
                  <Link href={`${base}#services`} className="text-ink-400 hover:text-white">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              {dict.nav.contact}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400" />
                <a href={`tel:${dict.contact.phone.replace(/[^+\d]/g, "")}`} className="hover:text-white">
                  {dict.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400" />
                <a href={`mailto:${dict.contact.email}`} className="hover:text-white">
                  {dict.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <span>{dict.contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>
            ┬⌐ {year} {dict.brand.name}. {dict.footer.rights}
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <span className="hover:text-ink-300">{dict.footer.privacy}</span>
            <span className="hover:text-ink-300">{dict.footer.terms}</span>
            <span className="hover:text-ink-300">{dict.footer.accessibility}</span>
            <Link
              href={`${base}/cancellation-policy`}
              className="hover:text-ink-300"
            >
              {dict.footer.cancellationPolicy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
