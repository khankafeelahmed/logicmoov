import { notFound } from "next/navigation";
import { CalendarX, Clock3, XCircle, PencilLine, Ban, PhoneCall } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const itemIcons = [Clock3, XCircle, CalendarX, PencilLine, Ban, PhoneCall];

export default async function CancellationPolicyPage({
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
            {dict.cancellationPolicy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-300">
            {dict.cancellationPolicy.lead}
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {dict.cancellationPolicy.items.map((item, i) => {
              const Icon = itemIcons[i] ?? Clock3;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      {item.description}
                    </p>
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
