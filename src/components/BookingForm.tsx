"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Users,
  Loader2,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  estimatePrice,
  formatCurrency,
  mockDistanceKm,
  vehicleOrder,
  type VehicleId,
} from "@/lib/pricing";
import { api, ApiError } from "@/lib/api";

type TripType = "oneWay" | "roundTrip";

const STEP_KEYS = ["trip", "vehicle", "details", "confirm"] as const;

const CATEGORY_MAP: Record<VehicleId, "SEDAN" | "SUV" | "VAN" | "LUXURY"> = {
  sedan: "SEDAN",
  suv: "SUV",
  van: "VAN",
  luxury: "LUXURY",
};

export default function BookingForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [confirmedPrice, setConfirmedPrice] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [tripType, setTripType] = useState<TripType>("oneWay");
  const [pickup, setPickup] = useState(params.get("pickup") ?? "");
  const [dropoff, setDropoff] = useState(params.get("dropoff") ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [vehicle, setVehicle] = useState<VehicleId>("sedan");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const distanceKm = useMemo(
    () => mockDistanceKm(pickup, dropoff),
    [pickup, dropoff],
  );

  const vehicles = vehicleOrder.map((id, index) => {
    const info = dict.fleet.items[index];
    const price = estimatePrice(distanceKm || 12, id);
    return { id, name: info.name, description: info.description, seats: info.seats, price };
  });

  const selectedPrice = useMemo(() => {
    const base = estimatePrice(distanceKm || 12, vehicle);
    return tripType === "roundTrip" ? base * 2 : base;
  }, [distanceKm, vehicle, tripType]);

  function validateStep(current: number): boolean {
    const next: Record<string, string> = {};
    if (current === 0) {
      if (!pickup.trim()) next.pickup = dict.booking.required;
      if (!dropoff.trim()) next.dropoff = dict.booking.required;
      if (!date) next.date = dict.booking.required;
      if (!time) next.time = dict.booking.required;
    }
    if (current === 2) {
      if (!name.trim()) next.name = dict.booking.required;
      if (!email.trim()) next.email = dict.booking.required;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        next.email = dict.booking.invalidEmail;
      if (!phone.trim()) next.phone = dict.booking.required;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const { booking } = await api.createBooking({
        category: CATEGORY_MAP[vehicle],
        tripType: tripType === "roundTrip" ? "ROUND_TRIP" : "ONE_WAY",
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        scheduledAt,
        passengers,
        notes: notes || undefined,
        contactName: name,
        contactEmail: email,
        contactPhone: phone,
        distanceKm: distanceKm || undefined,
      });

      // Mock payment step — marks the booking as paid and confirmed.
      try {
        await api.payBooking(booking.reference, "CARD");
      } catch {
        /* payment is best-effort in the demo; booking already exists */
      }

      setReference(booking.reference);
      setConfirmedPrice(booking.priceCents);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(dict.booking.errorGeneric);
      } else {
        setSubmitError(dict.booking.errorNetwork);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-lg">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
          {dict.booking.successTitle}
        </h2>
        <p className="mt-2 text-sm text-ink-600">{dict.booking.successMessage}</p>
        <div className="mt-6 rounded-xl bg-ink-50 p-4">
          <p className="text-xs font-semibold uppercase text-ink-500">
            {dict.booking.reference}
          </p>
          <p className="mt-1 text-xl font-bold tracking-wider text-ink-900">
            {reference}
          </p>
          {confirmedPrice !== null && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              {dict.booking.paid}: {formatCurrency(confirmedPrice, locale)}
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setConfirmedPrice(null);
              setSubmitError(null);
              setStep(0);
            }}
            className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-ink-900 hover:bg-brand-400"
          >
            {dict.booking.newBooking}
          </button>
          <Link
            href={`/${locale}`}
            className="rounded-full border border-ink-200 px-6 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            {dict.nav.home}
          </Link>
        </div>
        <p className="mt-6 text-xs text-ink-400">{dict.booking.demoNote}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-between gap-2">
        {STEP_KEYS.map((key, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={key} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  done
                    ? "bg-green-500 text-white"
                    : active
                      ? "bg-ink-900 text-white"
                      : "bg-ink-100 text-ink-400"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  active ? "text-ink-900" : "text-ink-400"
                }`}
              >
                {dict.booking.steps[key]}
              </span>
              {index < STEP_KEYS.length - 1 && (
                <span className="mx-1 hidden h-px flex-1 bg-ink-200 sm:block" />
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-lg sm:p-8">
        {/* Step 1: Trip */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <span className="mb-2 block text-sm font-semibold text-ink-700">
                {dict.booking.tripType}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["oneWay", "roundTrip"] as TripType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      tripType === t
                        ? "border-brand-500 bg-brand-50 text-ink-900"
                        : "border-ink-200 text-ink-500 hover:border-ink-300"
                    }`}
                  >
                    {dict.booking[t]}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label={dict.booking.pickup}
              icon={<MapPin className="h-4 w-4 text-brand-500" />}
              error={errors.pickup}
            >
              <input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder={dict.booking.pickupPlaceholder}
                className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
            </Field>

            <Field
              label={dict.booking.dropoff}
              icon={<Navigation className="h-4 w-4 text-brand-500" />}
              error={errors.dropoff}
            >
              <input
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder={dict.booking.dropoffPlaceholder}
                className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={dict.booking.date}
                icon={<Calendar className="h-4 w-4 text-brand-500" />}
                error={errors.date}
              >
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none"
                />
              </Field>
              <Field
                label={dict.booking.time}
                icon={<Clock className="h-4 w-4 text-brand-500" />}
                error={errors.time}
              >
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none"
                />
              </Field>
            </div>

            <Field
              label={dict.booking.passengers}
              icon={<Users className="h-4 w-4 text-brand-500" />}
            >
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink-900">
              {dict.booking.chooseVehicle}
            </h2>
            {vehicles.map((v) => {
              const active = v.id === vehicle;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicle(v.id)}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-brand-500 bg-brand-50"
                      : "border-ink-200 hover:border-ink-300"
                  }`}
                >
                  <span
                    className={`flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                      active ? "ring-2 ring-brand-500" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/cars/${v.id}.jpg`}
                      alt={v.name}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-ink-900">{v.name}</span>
                    <span className="block text-xs text-ink-500">{v.description}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400">
                      <Users className="h-3 w-3" /> {v.seats} {dict.fleet.seats}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-extrabold text-ink-900">
                      {formatCurrency(
                        tripType === "roundTrip" ? v.price * 2 : v.price,
                        locale,
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label={dict.booking.fullName} error={errors.name}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={dict.booking.fullNamePlaceholder}
                className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={dict.booking.email} error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.booking.emailPlaceholder}
                  className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </Field>
              <Field label={dict.booking.phone} error={errors.phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={dict.booking.phonePlaceholder}
                  className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </Field>
            </div>
            <Field label={dict.booking.notes}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={dict.booking.notesPlaceholder}
                rows={3}
                className="w-full resize-none bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
            </Field>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink-900">{dict.booking.summary}</h2>
            <dl className="divide-y divide-ink-100 rounded-xl border border-ink-100">
              <Row label={dict.booking.tripType} value={dict.booking[tripType]} />
              <Row label={dict.booking.pickup} value={pickup} />
              <Row label={dict.booking.dropoff} value={dropoff} />
              <Row label={dict.booking.date} value={`${date} ${time}`} />
              <Row label={dict.booking.passengers} value={String(passengers)} />
              <Row
                label={dict.booking.steps.vehicle}
                value={dict.fleet.items[vehicleOrder.indexOf(vehicle)].name}
              />
              <Row label={dict.booking.fullName} value={name} />
              <Row label={dict.booking.email} value={email} />
              <Row label={dict.booking.phone} value={phone} />
            </dl>
            <div className="flex items-center justify-between rounded-xl bg-ink-900 p-4 text-white">
              <span className="text-sm font-medium">{dict.booking.estimatedPrice}</span>
              <span className="text-2xl font-extrabold text-brand-400">
                {formatCurrency(selectedPrice, locale)}
              </span>
            </div>
            <p className="text-xs text-ink-400">{dict.booking.demoNote}</p>
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
                <p className="font-semibold text-red-700">{dict.booking.errorTitle}</p>
                <p className="mt-1 text-red-600">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-full border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {dict.booking.back}
            </button>
          ) : (
            <span />
          )}

          {step < STEP_KEYS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-ink-800"
            >
              {dict.booking.next}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {dict.booking.submitting}
                </>
              ) : (
                <>
                  {dict.booking.confirm}
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink-700">{label}</span>
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 ${
          error ? "border-red-400" : "border-ink-200 focus-within:border-brand-500"
        }`}
      >
        {icon}
        {children}
      </div>
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );
}
