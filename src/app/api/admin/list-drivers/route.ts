import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  "";

function toDriverStatus(applicationStatus: unknown): "OFFLINE" | "AVAILABLE" | "BUSY" | "PENDING" {
  const value = String(applicationStatus ?? "").trim().toLowerCase();

  switch (value) {
    case "approved":
      return "AVAILABLE";
    case "rejected":
    case "suspended":
      return "OFFLINE";
    case "busy":
      return "BUSY";
    case "submitted":
    case "under_review":
    case "documents_required":
    case "draft":
    default:
      return "PENDING";
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Admin authorization is required." }, { status: 401 });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase admin driver list is not configured for this environment." },
        { status: 500 },
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: drivers, error } = await adminClient
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to load driver records." }, { status: 500 });
    }

    const vehicleRows = await adminClient
      .from("vehicles")
      .select("*");

    const vehiclesByDriver = new Map<string, Record<string, unknown>>();
    for (const vehicle of vehicleRows.data ?? []) {
      const driverId = typeof vehicle.driver_id === "string" ? vehicle.driver_id : "";
      if (driverId) {
        vehiclesByDriver.set(driverId, vehicle as Record<string, unknown>);
      }
    }

    const mappedDrivers = (drivers ?? []).map((driver) => {
      const fullName = `${String(driver.first_name ?? "").trim()} ${String(driver.last_name ?? "").trim()}`.trim() || "Unknown driver";
      const vehicle = vehiclesByDriver.get(String(driver.id));
      const vehiclePhotoUrls = Array.isArray(vehicle?.photo_urls)
        ? vehicle.photo_urls
            .map((value: unknown) => String(value))
            .filter(Boolean)
        : [];
      const vehiclePhotoUrl =
        vehiclePhotoUrls[0] ??
        (typeof vehicle?.photo_url === "string" && vehicle.photo_url ? vehicle.photo_url : null);

      return {
        id: String(driver.id),
        status: toDriverStatus(driver.application_status),
        rating: 4.8,
        licenseNumber: typeof driver.driver_license_number === "string" && driver.driver_license_number ? driver.driver_license_number : "—",
        licenseExpiry: null,
        languages: [],
        photoUrl: typeof driver.profile_photo_url === "string" && driver.profile_photo_url ? driver.profile_photo_url : null,
        user: {
          id: typeof driver.user_id === "string" && driver.user_id ? String(driver.user_id) : String(driver.id),
          fullName,
          email: String(driver.email ?? ""),
          phone: typeof driver.phone === "string" && driver.phone ? driver.phone : null,
        },
        vehicle: vehicle
          ? {
              category: String(vehicle.vehicle_type ?? "SEDAN"),
              make: String(vehicle.make ?? "Unknown"),
              model: String(vehicle.model ?? "Model"),
              plate: String(vehicle.license_plate ?? vehicle.plate ?? "—"),
              year:
                vehicle.year !== undefined && vehicle.year !== null
                  ? Number(vehicle.year)
                  : null,
              color: typeof vehicle.colour === "string" ? vehicle.colour : null,
              seatCapacity:
                vehicle.passenger_capacity !== undefined && vehicle.passenger_capacity !== null
                  ? Number(vehicle.passenger_capacity)
                  : null,
              luggageCapacity: null,
              electric: Boolean(vehicle.electric),
              features: [],
              photoUrl: vehiclePhotoUrl || null,
              photoUrls: vehiclePhotoUrls,
            }
          : null,
      };
    });

    return NextResponse.json({ drivers: mappedDrivers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load drivers." },
      { status: 500 },
    );
  }
}
