"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  estimatePrice,
  formatCurrency,
  mockDistanceKm,
} from "@/lib/pricing";
import { api } from "@/lib/api";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from "@/lib/googleMaps";

type AddressSuggestion = { name: string; address: string; lat: number; lng: number };

export default function QuickEstimate({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<AddressSuggestion[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const km = mockDistanceKm(pickup, dropoff);
    setEstimate(estimatePrice(km, "sedan"));
  }

  const bookHref = `/${locale}/book?pickup=${encodeURIComponent(
    pickup,
  )}&dropoff=${encodeURIComponent(dropoff)}`;

  return (
    <div className="w-full rounded-2xl border border-ink-100 bg-white p-5 shadow-xl shadow-ink-900/5 sm:p-6">
      <h2 className="text-base font-bold text-ink-900">{dict.quickBook.title}</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="relative block">
          <span className="mb-1 block text-xs font-semibold text-ink-500">
            {dict.quickBook.pickup}
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 focus-within:border-brand-500">
            <MapPin className="h-4 w-4 text-brand-500" />
            <input
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
              }}
              placeholder={dict.quickBook.pickupPlaceholder}
              className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
          {pickupSuggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-xl border border-ink-200 bg-white p-1 shadow-lg">
              {pickupSuggestions.map((item) => (
                <li key={`${item.address}-${item.lat}-${item.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPickup(item.address);
                      setPickupSuggestions([]);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50"
                  >
                    <span className="block font-medium text-ink-900">{item.name}</span>
                    <span className="block text-xs text-ink-500">{item.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label className="relative block">
          <span className="mb-1 block text-xs font-semibold text-ink-500">
            {dict.quickBook.dropoff}
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 focus-within:border-brand-500">
            <Navigation className="h-4 w-4 text-brand-500" />
            <input
              value={dropoff}
              onChange={(e) => {
                setDropoff(e.target.value);
              }}
              placeholder={dict.quickBook.dropoffPlaceholder}
              className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
          {dropoffSuggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-xl border border-ink-200 bg-white p-1 shadow-lg">
              {dropoffSuggestions.map((item) => (
                <li key={`${item.address}-${item.lat}-${item.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setDropoff(item.address);
                      setDropoffSuggestions([]);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50"
                  >
                    <span className="block font-medium text-ink-900">{item.name}</span>
                    <span className="block text-xs text-ink-500">{item.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        {locationError && (
          <p className="text-xs text-amber-600">{locationError}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-ink-900 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
        >
          {dict.quickBook.submit}
        </button>
      </form>

      {estimate !== null && estimate > 0 && (
        <div className="mt-4 rounded-xl bg-brand-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-600">
              {dict.quickBook.estimate}
            </span>
            <span className="text-2xl font-extrabold text-ink-900">
              {formatCurrency(estimate, locale)}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">{dict.quickBook.note}</p>
          <Link
            href={bookHref}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-brand-400"
          >
            {dict.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
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
