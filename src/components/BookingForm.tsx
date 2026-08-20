"use client";

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useJsApiLoader } from "@react-google-maps/api";
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
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from "@/lib/googleMaps";

type TripType = "oneWay" | "roundTrip";
type StepKey = "trip" | "passengers" | "vehicle" | "details" | "confirm";
type AddressSuggestion = { name: string; address: string; lat: number; lng: number };
type Coordinates = { lat: number; lng: number };

const STEP_KEYS: StepKey[] = ["trip", "passengers", "vehicle", "details", "confirm"];

const CATEGORY_MAP: Record<VehicleId, "SEDAN" | "SUV" | "VAN" | "LUXURY"> = {
  sedan: "SEDAN",
  suv: "SUV",
  van: "VAN",
  luxury: "LUXURY",
};

const VEHICLE_CAPACITY: Record<VehicleId, number> = {
  sedan: 4,
  suv: 5,
  van: 8,
  luxury: 8,
};

const VEHICLE_IMAGE_MAP: Record<VehicleId, string> = {
  sedan: "/cars/sedan.jpg",
  suv: "/cars/suv.jpg",
  van: "/cars/sienna.jpg",
  luxury: "/cars/luxury.jpg",
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKmFromCoordinates(pickup: Coordinates, dropoff: Coordinates) {
  const earthKm = 6371;
  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLng = toRad(dropoff.lng - pickup.lng);
  const lat1 = toRad(pickup.lat);
  const lat2 = toRad(dropoff.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthKm * c * 1.22 * 10) / 10;
}

function isAirportTransfer(pickup: string, dropoff: string) {
  const value = `${pickup} ${dropoff}`.toLowerCase();
  return (
    value.includes("airport") ||
    value.includes("aeroport") ||
    value.includes("aéroport") ||
    value.includes("yul") ||
    value.includes("yqb") ||
    value.includes("terminal")
  );
}

export default function BookingForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
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
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<AddressSuggestion[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [vehicle, setVehicle] = useState<VehicleId>("sedan");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [infantSeatQty, setInfantSeatQty] = useState(0);
  const [childSeatQty, setChildSeatQty] = useState(0);
  const [boosterSeatQty, setBoosterSeatQty] = useState(0);
  const [farePreview, setFarePreview] = useState<{
    fare: string;
    distance: string;
    duration: string;
    vehicle: string;
  } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const totalPassengers = adults + children + infants;
  const airportTransfer = isAirportTransfer(pickup, dropoff);

  const recommendedVehicles = useMemo(() => {
    const matches = vehicleOrder.filter(
      (id) => VEHICLE_CAPACITY[id] >= totalPassengers,
    ) as VehicleId[];
    return matches.length > 0 ? matches : (["van"] as VehicleId[]);
  }, [totalPassengers]);

  const distanceKm = useMemo(() => {
    if (pickupCoords && dropoffCoords) {
      return distanceKmFromCoordinates(pickupCoords, dropoffCoords);
    }
    return mockDistanceKm(pickup, dropoff);
  }, [pickupCoords, dropoffCoords, pickup, dropoff]);

  const vehicles = vehicleOrder.map((id, index) => {
    const info = dict.fleet.items[index];
    const price = estimatePrice(distanceKm || 12, id);
    return { id, name: info.name, description: info.description, seats: info.seats, price };
  });

  const selectedPrice = useMemo(() => {
    const base = estimatePrice(distanceKm || 12, vehicle);
    return tripType === "roundTrip" ? base * 2 : base;
  }, [distanceKm, vehicle, tripType]);

  useEffect(() => {
    if (step !== 2) return;
    if (!recommendedVehicles.includes(vehicle)) {
      setVehicle(recommendedVehicles[0]);
    }
  }, [step, recommendedVehicles, vehicle]);

  useEffect(() => {
    if (pickup.trim().length < 3) {
      setPickupSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const suggestions = await api.searchLocations(pickup.trim());
        setPickupSuggestions(suggestions);
        setLocationError(null);
      } catch {
        try {
          if (!isGoogleMapsLoaded) throw new Error("Google Maps not loaded");
          const suggestions = await searchLocationsWithGoogleClient(pickup.trim());
          setPickupSuggestions(suggestions);
          setLocationError(null);
        } catch {
          setPickupSuggestions([]);
          setLocationError(dict.booking.locationSearchUnavailable);
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [pickup, dict.booking.locationSearchUnavailable, isGoogleMapsLoaded]);

  useEffect(() => {
    if (dropoff.trim().length < 3) {
      setDropoffSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const suggestions = await api.searchLocations(dropoff.trim());
        setDropoffSuggestions(suggestions);
        setLocationError(null);
      } catch {
        try {
          if (!isGoogleMapsLoaded) throw new Error("Google Maps not loaded");
          const suggestions = await searchLocationsWithGoogleClient(dropoff.trim());
          setDropoffSuggestions(suggestions);
          setLocationError(null);
        } catch {
          setDropoffSuggestions([]);
          setLocationError(dict.booking.locationSearchUnavailable);
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [dropoff, dict.booking.locationSearchUnavailable, isGoogleMapsLoaded]);

  useEffect(() => {
    if (step !== 4 || !pickupCoords || !dropoffCoords) {
      setFarePreview(null);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    api
      .quoteFare({
        pickup: pickupCoords,
        dropoff: dropoffCoords,
        passengers: { adults, children, infants },
      })
      .then((quote) => {
        if (cancelled) return;
        setFarePreview({
          fare: quote.fare,
          distance: quote.distance,
          duration: quote.duration,
          vehicle: quote.vehicle,
        });
      })
      .catch(() => {
        if (!cancelled) setFarePreview(null);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, pickupCoords, dropoffCoords, adults, children, infants]);

  function setPassengerCount(setter: Dispatch<SetStateAction<number>>, value: number) {
    setter(Math.min(8, Math.max(0, value)));
  }

  function validateStep(current: number): boolean {
    const next: Record<string, string> = {};
    if (current === 0) {
      if (!pickup.trim()) next.pickup = dict.booking.required;
      if (!dropoff.trim()) next.dropoff = dict.booking.required;
      if (!date) next.date = dict.booking.required;
      if (!time) next.time = dict.booking.required;
    }
    if (current === 1) {
      if (adults < 1) next.passengers = "At least one adult is required.";
      if (totalPassengers > 8) next.passengers = "Maximum 8 passengers per booking.";
    }
    if (current === 3) {
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
      let bookingReference: string | undefined;
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      try {
        const { booking } = await api.createBooking({
          category: CATEGORY_MAP[vehicle],
          tripType: tripType === "roundTrip" ? "ROUND_TRIP" : "ONE_WAY",
          pickupAddress: pickup,
          pickupLat: pickupCoords?.lat,
          pickupLng: pickupCoords?.lng,
          dropoffAddress: dropoff,
          dropoffLat: dropoffCoords?.lat,
          dropoffLng: dropoffCoords?.lng,
          scheduledAt,
          passengers: totalPassengers,
          passengerCounts: { adults, children, infants },
          childSeatOptions: {
            infantSeatQty,
            childSeatQty,
            boosterSeatQty,
          },
          notes: notes || undefined,
          contactName: name,
          contactEmail: email,
          contactPhone: phone,
          distanceKm: distanceKm || undefined,
        });
        bookingReference = booking.reference;
      } catch (err) {
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          throw err;
        }
      }

      const params = new URLSearchParams();
      params.set("fare", String(selectedPrice.toFixed(2)));
      if (bookingReference) params.set("reference", bookingReference);
      router.push(`/${locale}/checkout?${params.toString()}`);
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

  async function searchLocationsWithGoogleClient(
    query: string,
  ): Promise<AddressSuggestion[]> {
    if (typeof window === "undefined" || !window.google?.maps?.places) {
      throw new Error("Google Maps Places is unavailable");
    }

    const service = new window.google.maps.places.AutocompleteService();
    const geocoder = new window.google.maps.Geocoder();

    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>(
      (resolve, reject) => {
        service.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: "ca" },
            types: ["geocode"],
          },
          (results, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK ||
              status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              resolve(results ?? []);
              return;
            }
            reject(new Error(`Google Places error: ${status}`));
          },
        );
      },
    );

    const top = predictions.slice(0, 6);
    const suggestions = await Promise.all(
      top.map(
        (prediction) =>
          new Promise<AddressSuggestion>((resolve, reject) => {
            geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
              if (status !== "OK" || !results?.[0]?.geometry?.location) {
                reject(new Error(`Google Geocoder error: ${status}`));
                return;
              }

              resolve({
                name: prediction.structured_formatting?.main_text ?? prediction.description,
                address: prediction.description,
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
              });
            });
          }),
      ),
    );

    return suggestions;
  }

  return (
    <div className="mx-auto max-w-3xl">
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

            <AddressField
              label={dict.booking.pickup}
              icon={<MapPin className="h-4 w-4 text-brand-500" />}
              value={pickup}
              placeholder={dict.booking.pickupPlaceholder}
              error={errors.pickup}
              suggestions={pickupSuggestions}
              onChange={(value) => {
                setPickup(value);
                setPickupCoords(null);
              }}
              onSelect={(item) => {
                setPickup(item.address);
                setPickupCoords({ lat: item.lat, lng: item.lng });
                setPickupSuggestions([]);
              }}
            />

            <AddressField
              label={dict.booking.dropoff}
              icon={<Navigation className="h-4 w-4 text-brand-500" />}
              value={dropoff}
              placeholder={dict.booking.dropoffPlaceholder}
              error={errors.dropoff}
              suggestions={dropoffSuggestions}
              onChange={(value) => {
                setDropoff(value);
                setDropoffCoords(null);
              }}
              onSelect={(item) => {
                setDropoff(item.address);
                setDropoffCoords({ lat: item.lat, lng: item.lng });
                setDropoffSuggestions([]);
              }}
            />

            {locationError && (
              <p className="text-xs text-amber-600">{locationError}</p>
            )}

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
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink-900">{dict.booking.passengers}</h2>
            {errors.passengers && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.passengers}
              </p>
            )}
            <PassengerCounter
              icon="👤"
              label={dict.booking.adults}
              hint={dict.booking.adultsAge}
              value={adults}
              onDecrease={() => setPassengerCount(setAdults, adults - 1)}
              onIncrease={() => setPassengerCount(setAdults, adults + 1)}
            />
            <PassengerCounter
              icon="🧒"
              label={dict.booking.children}
              hint={dict.booking.childrenAge}
              value={children}
              onDecrease={() => setPassengerCount(setChildren, children - 1)}
              onIncrease={() => setPassengerCount(setChildren, children + 1)}
            />
            <PassengerCounter
              icon="👶"
              label={dict.booking.infants}
              hint={dict.booking.infantsAge}
              value={infants}
              onDecrease={() => setPassengerCount(setInfants, infants - 1)}
              onIncrease={() => setPassengerCount(setInfants, infants + 1)}
            />

            <p className="text-xs text-ink-500">
              Total passengers: <strong>{totalPassengers}</strong>
            </p>

            {airportTransfer && (
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-4">
                <h3 className="mb-3 font-semibold text-ink-900">
                  {dict.booking.childSeatRequirements}
                </h3>
                <SeatOption
                  label={dict.booking.infantSeat}
                  quantity={infantSeatQty}
                  onChange={setInfantSeatQty}
                />
                <SeatOption
                  label={dict.booking.childSeat}
                  quantity={childSeatQty}
                  onChange={setChildSeatQty}
                />
                <SeatOption
                  label={dict.booking.boosterSeat}
                  quantity={boosterSeatQty}
                  onChange={setBoosterSeatQty}
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink-900">
              {dict.booking.chooseVehicle}
            </h2>
            {vehicles.map((v) => {
              const active = v.id === vehicle;
              const recommended = recommendedVehicles.includes(v.id);
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
                      src={VEHICLE_IMAGE_MAP[v.id]}
                      alt={v.name}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-ink-900">{v.name}</span>
                    <span className="block text-xs text-ink-500">{v.description}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400">
                      <Users className="h-3 w-3" /> {VEHICLE_CAPACITY[v.id]} {dict.fleet.seats}
                    </span>
                    {recommended && (
                      <span className="ml-2 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        {dict.booking.recommended}
                      </span>
                    )}
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

        {step === 3 && (
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

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink-900">{dict.booking.summary}</h2>
            <dl className="divide-y divide-ink-100 rounded-xl border border-ink-100">
              <Row label={dict.booking.tripType} value={dict.booking[tripType]} />
              <Row label={dict.booking.pickup} value={pickup} />
              <Row label={dict.booking.dropoff} value={dropoff} />
              <Row label={dict.booking.date} value={`${date} ${time}`} />
              <Row
                label={dict.booking.passengers}
                value={`${adults} ${dict.booking.adults}, ${children} ${dict.booking.children}, ${infants} ${dict.booking.infants}`}
              />
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
                {farePreview?.fare ?? formatCurrency(selectedPrice, locale)}
              </span>
            </div>
            {quoteLoading && (
              <p className="text-xs text-ink-500">Calculating live fare quote...</p>
            )}
            {farePreview && (
              <p className="text-xs text-ink-500">
                Distance: {farePreview.distance} · Duration: {farePreview.duration}
              </p>
            )}
            <p className="text-xs text-ink-400">{dict.booking.demoNote}</p>
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
                <p className="font-semibold text-red-700">{dict.booking.errorTitle}</p>
                <p className="mt-1 text-red-600">{submitError}</p>
              </div>
            )}
          </div>
        )}

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
  icon?: ReactNode;
  error?: string;
  children: ReactNode;
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

function AddressField({
  label,
  icon,
  value,
  placeholder,
  error,
  suggestions,
  onChange,
  onSelect,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  placeholder: string;
  error?: string;
  suggestions: AddressSuggestion[];
  onChange: (value: string) => void;
  onSelect: (item: AddressSuggestion) => void;
}) {
  return (
    <div className="relative">
      <Field label={label} icon={icon} error={error}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
      </Field>
      {suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-ink-200 bg-white p-1 shadow-lg">
          {suggestions.map((item) => (
            <li key={`${item.address}-${item.lat}-${item.lng}`}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50"
              >
                <span className="block font-medium text-ink-900">{item.name}</span>
                <span className="block text-xs text-ink-500">{item.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PassengerCounter({
  icon,
  label,
  hint,
  value,
  onDecrease,
  onIncrease,
}: {
  icon: string;
  label: string;
  hint: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900">
            {icon} {label}
          </p>
          <p className="text-xs text-ink-500">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            className="h-8 w-8 rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50"
          >
            -
          </button>
          <span className="w-6 text-center font-semibold text-ink-900">{value}</span>
          <button
            type="button"
            onClick={onIncrease}
            className="h-8 w-8 rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function SeatOption({
  label,
  quantity,
  onChange,
}: {
  label: string;
  quantity: number;
  onChange: (value: number) => void;
}) {
  const checked = quantity > 0;
  return (
    <div className="mb-2 rounded-lg border border-ink-200 bg-white p-3">
      <label className="flex items-center gap-2 text-sm text-ink-800">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? Math.max(1, quantity) : 0)}
        />
        {label}
      </label>
      <div className="mt-2">
        <input
          type="number"
          min={0}
          max={8}
          value={quantity}
          onChange={(e) => onChange(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
          className="w-24 rounded-lg border border-ink-200 px-2 py-1 text-sm"
        />
      </div>
    </div>
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
