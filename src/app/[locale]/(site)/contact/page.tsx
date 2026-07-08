import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import ContactForm from "@/components/ContactForm";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  const details = [
    {
      icon: Phone,
      title: dict.contact.phoneTitle,
      value: dict.contact.phone,
      href: `tel:${dict.contact.phone.replace(/[^+\d]/g, "")}`,
    },
    {
      icon: Mail,
      title: dict.contact.emailTitle,
      value: dict.contact.email,
      href: `mailto:${dict.contact.email}`,
    },
    { icon: Clock, title: dict.contact.hoursTitle, value: dict.contact.hours },
    { icon: MapPin, title: dict.contact.addressTitle, value: dict.contact.address },
  ];

  return (
    <section className="bg-ink-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            {dict.contact.title}
          </h1>
          <p className="mt-3 text-lg text-ink-500">{dict.contact.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {details.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {item.title}
                  </h3>
                  <p className="mt-1 font-semibold text-ink-900">{item.value}</p>
                </>
              );
              return item.href ? (
                <a
                  key={item.title}
                  href={item.href}
                  className="rounded-2xl border border-ink-100 bg-white p-5 transition hover:border-brand-300"
                >
                  {content}
                </a>
              ) : (
                <div
                  key={item.title}
                  className="rounded-2xl border border-ink-100 bg-white p-5"
                >
                  {content}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
            <ContactForm dict={dict} />
          </div>
        </div>
      </div>
    </section>
  );
}
