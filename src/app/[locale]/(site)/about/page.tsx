import { notFound } from "next/navigation";
import { ShieldCheck, Eye, LifeBuoy, HeartHandshake } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const valueIcons = [LifeBuoy, Eye, ShieldCheck, HeartHandshake];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  return (
    <>
      <section className="bg-ink-950 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {dict.about.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-300">{dict.about.lead}</p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-5">
            {dict.about.body.map((paragraph, i) => (
              <p key={i} className="text-base leading-relaxed text-ink-600">
                {paragraph}
              </p>
            ))}
          </div>

          <h2 className="mt-14 text-2xl font-extrabold text-ink-900">
            {dict.about.valuesTitle}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {dict.about.values.map((value, i) => {
              const Icon = valueIcons[i] ?? ShieldCheck;
              return (
                <div
                  key={value.title}
                  className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink-900">{value.title}</h3>
                    <p className="mt-1 text-sm text-ink-500">{value.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
