import Link from "next/link";
import {
  ArrowRight,
  Plane,
  Briefcase,
  Building2,
  Route,
  PartyPopper,
  HeartPulse,
  BadgeDollarSign,
  Clock,
  MapPinned,
  ShieldCheck,
  PlaneTakeoff,
  CreditCard,
  Star,
  MapPin,
  Phone,
  Car,
  Users,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { notFound } from "next/navigation";
import QuickEstimate from "@/components/QuickEstimate";

const serviceIcons = [Plane, Briefcase, Building2, Route, PartyPopper, HeartPulse];
const featureIcons = [
  BadgeDollarSign,
  Clock,
  MapPinned,
  ShieldCheck,
  PlaneTakeoff,
  CreditCard,
];

const stats = [
  { key: "rides", value: "250K+" },
  { key: "drivers", value: "1,200+" },
  { key: "cities", value: "40+" },
  { key: "rating", value: "4.9★" },
] as const;

// Fleet photos, ordered to match dict.fleet.items (Sedan, SUV, Van, Luxury).
const fleetImages = [
  "/cars/sedan.jpg",
  "/cars/suv.jpg",
  "/cars/van.jpg",
  "/cars/luxury.jpg",
];

// Service photos, ordered to match dict.services.items.
const serviceImages = [
  "/cars/airport.jpg",
  "/cars/corporate.jpg",
  "/cars/city.jpg",
  "/cars/longdistance.jpg",
  "/cars/events.jpg",
  "/cars/medical.jpg",
];

// How-it-works photos, ordered to match dict.howItWorks.steps.
const stepImages = [
  "/cars/step-trip.jpg",
  "/cars/step-vehicle.jpg",
  "/cars/step-track.jpg",
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const base = `/${typedLocale}`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vehicles/hero-city.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden w-full opacity-40 lg:block"
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              {dict.hero.badge}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {dict.hero.title}{" "}
              <span className="text-brand-400">{dict.hero.titleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-300">
              {dict.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`${base}/book`}
                className="flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-brand-400"
              >
                {dict.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`${base}#how`}
                className="rounded-full border border-ink-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-800"
              >
                {dict.hero.ctaSecondary}
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-400">{dict.hero.trust}</p>
          </div>

          <div className="animate-fade-up lg:justify-self-end lg:pl-8">
            <QuickEstimate locale={typedLocale} dict={dict} />
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-ink-800/60">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
            {stats.map((stat) => (
              <div key={stat.key} className="text-center">
                <div className="text-3xl font-extrabold text-brand-400">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                  {dict.stats[stat.key]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={dict.services.title} subtitle={dict.services.subtitle} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dict.services.items.map((item, i) => {
              const Icon = serviceIcons[i] ?? Car;
              return (
                <div
                  key={item.title}
                  className="group overflow-hidden rounded-2xl border border-ink-100 bg-white transition hover:border-brand-300 hover:shadow-lg hover:shadow-ink-900/5"
                >
                  <div className="relative h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={serviceImages[i]}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-ink-900 shadow-lg">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-ink-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={dict.howItWorks.title} subtitle={dict.howItWorks.subtitle} />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {dict.howItWorks.steps.map((step, i) => (
              <div
                key={step.title}
                className="relative overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="relative h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stepImages[i]}
                    alt={step.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-lg font-extrabold text-brand-400 shadow-lg">
                    {i + 1}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-ink-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section id="fleet" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={dict.fleet.title} subtitle={dict.fleet.subtitle} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dict.fleet.items.map((item, i) => (
              <div
                key={item.name}
                className="flex flex-col rounded-2xl border border-ink-100 bg-white p-6 transition hover:shadow-lg hover:shadow-ink-900/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fleetImages[i]}
                  alt={item.name}
                  className="h-40 w-full rounded-xl object-cover"
                  loading="lazy"
                />
                <h3 className="mt-4 text-lg font-bold text-ink-900">{item.name}</h3>
                <p className="mt-1 flex-1 text-sm text-ink-500">{item.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                  <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                    <Users className="h-3.5 w-3.5" />
                    {item.seats} {dict.fleet.seats}
                  </span>
                  <span className="text-sm text-ink-500">
                    {dict.fleet.perTrip}{" "}
                    <span className="text-base font-extrabold text-ink-900">
                      {item.price}
                    </span>
                  </span>
                </div>
                <Link
                  href={`${base}/book`}
                  className="mt-4 rounded-full bg-brand-50 py-2.5 text-center text-sm font-bold text-brand-700 transition hover:bg-brand-500 hover:text-ink-900"
                >
                  {dict.fleet.book}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-ink-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {dict.features.title}
            </h2>
            <p className="mt-3 text-ink-400">{dict.features.subtitle}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dict.features.items.map((item, i) => {
              const Icon = featureIcons[i] ?? ShieldCheck;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-ink-800 bg-ink-900/50 p-6"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={dict.coverage.title} subtitle={dict.coverage.subtitle} />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {dict.coverage.cities.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700"
              >
                <MapPin className="h-4 w-4 text-brand-500" />
                {city}
              </span>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink-500">
            {dict.coverage.cta}{" "}
            <Link href={`${base}/contact`} className="font-semibold text-brand-600 hover:underline">
              {dict.coverage.ctaLink}
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={dict.testimonials.title} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {dict.testimonials.items.map((t) => (
              <figure
                key={t.author}
                className="flex flex-col rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex gap-0.5 text-brand-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-700">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 border-t border-ink-100 pt-4">
                  <span className="block font-bold text-ink-900">{t.author}</span>
                  <span className="text-xs text-ink-400">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            {dict.cta.title}
          </h2>
          <p className="max-w-xl text-ink-800">{dict.cta.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`${base}/book`}
              className="flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              {dict.cta.primary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`tel:${dict.contact.phone.replace(/[^+\d]/g, "")}`}
              className="flex items-center gap-2 rounded-full border border-ink-900/20 bg-white px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-ink-50"
            >
              <Phone className="h-4 w-4" />
              {dict.cta.secondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-ink-500">{subtitle}</p>}
    </div>
  );
}
