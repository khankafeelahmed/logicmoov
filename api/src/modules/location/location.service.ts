import { env } from "../../config/env";
import { HttpError } from "../../lib/httpError";

interface PlacesAutocompleteResponse {
  status: string;
  predictions?: Array<{
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text?: string;
    };
  }>;
  error_message?: string;
}

interface GeocodeResponse {
  status: string;
  results?: Array<{
    geometry: { location: { lat: number; lng: number } };
  }>;
  error_message?: string;
}

async function fetchGoogleJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw HttpError.badRequest(`Google Maps request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function searchLocations(query: string) {
  const key = env.googleMapsApiKey;
  if (!key) {
    throw HttpError.badRequest("GOOGLE_MAPS_API_KEY is not configured");
  }

  const autoUrl =
    "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
    `?input=${encodeURIComponent(query)}` +
    "&components=country:ca" +
    "&types=geocode" +
    `&key=${encodeURIComponent(key)}`;

  const auto = await fetchGoogleJson<PlacesAutocompleteResponse>(autoUrl);
  if (auto.status !== "OK" && auto.status !== "ZERO_RESULTS") {
    throw HttpError.badRequest(
      auto.error_message ?? `Google Places error: ${auto.status}`,
    );
  }

  const predictions = (auto.predictions ?? []).slice(0, 6);
  const results = await Promise.all(
    predictions.map(async (prediction) => {
      const geoUrl =
        "https://maps.googleapis.com/maps/api/geocode/json" +
        `?place_id=${encodeURIComponent(prediction.place_id)}` +
        `&key=${encodeURIComponent(key)}`;
      const geocode = await fetchGoogleJson<GeocodeResponse>(geoUrl);
      if (geocode.status !== "OK" || !geocode.results?.[0]) {
        throw HttpError.badRequest(
          geocode.error_message ?? `Google Geocoding error: ${geocode.status}`,
        );
      }

      return {
        name: prediction.structured_formatting?.main_text ?? prediction.description,
        address: prediction.description,
        lat: geocode.results[0].geometry.location.lat,
        lng: geocode.results[0].geometry.location.lng,
      };
    }),
  );

  return results;
}
