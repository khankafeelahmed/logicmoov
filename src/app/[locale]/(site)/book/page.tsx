import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import BookingForm from "@/components/BookingForm";

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  return (
    <div className="bg-ink-50 py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            {dict.booking.title}
          </h1>
          <p className="mt-3 text-ink-500">{dict.booking.subtitle}</p>
        </div>
        <Suspense fallback={<p className="text-center text-ink-400">{dict.common.loading}</p>}>
          <BookingForm locale={typedLocale} dict={dict} />
        </Suspense>
      </div>
    </div>
  );
}
