import { notFound } from "next/navigation";
import { CalendarX, Clock3, XCircle, PencilLine, Ban, PhoneCall, AlertCircle, Plane, MapPin, RotateCcw, AlertTriangle } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const itemIcons = [
  Clock3,
  Ban,
  XCircle,
  Clock3,
  Plane,
  Plane,
  AlertCircle,
  PencilLine,
  RotateCcw,
  AlertTriangle,
  Clock3,
  CalendarX,
  MapPin,
];

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
                  className="flex gap-4 rounded-2xl border border-ink-100 bg-gradient-to-br from-white to-ink-50 p-6 hover:border-brand-200 hover:shadow-md transition-all"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <h3 className="font-bold text-ink-900 text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-6">
            <h3 className="text-lg font-bold text-ink-900">
              {dict.cancellationPolicy.fareDetails.title}
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-ink-700">
                    <th className="px-3 py-2 font-semibold">
                      {dict.cancellationPolicy.fareDetails.destinationZone}
                    </th>
                    <th className="px-3 py-2 font-semibold">
                      {dict.cancellationPolicy.fareDetails.distance}
                    </th>
                    <th className="px-3 py-2 font-semibold">
                      {dict.cancellationPolicy.fareDetails.suggestedFixedFare}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dict.cancellationPolicy.fareDetails.rows.map((row) => (
                    <tr key={row.destination} className="border-b border-ink-100">
                      <td className="px-3 py-2 text-ink-800">{row.destination}</td>
                      <td className="px-3 py-2 text-ink-600">{row.distance}</td>
                      <td className="px-3 py-2 font-medium text-ink-900">{row.fare}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 rounded-2xl bg-brand-50 border border-brand-200 p-8">
            <div className="flex gap-4">
              <PhoneCall className="h-6 w-6 shrink-0 text-brand-600 mt-1" />
              <div>
                <h3 className="font-bold text-ink-900 mb-2">Need to cancel or modify your booking?</h3>
                <p className="text-sm text-ink-700 mb-3">Contact us directly and we'll help you right away.</p>
                <div className="flex flex-col sm:flex-row gap-4 text-sm">
                  <a href="tel:+5142664708" className="font-semibold text-brand-600 hover:text-brand-700">
                    Call: +514-266-4708
                  </a>
                  <a href="mailto:info@logicmoov.ca" className="font-semibold text-brand-600 hover:text-brand-700">
                    Email: info@logicmoov.ca
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
