import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const DRIVER_STORAGE_KEY = "taxi_logicmoov_local_drivers";
const VEHICLE_STORAGE_KEY = "taxi_logicmoov_local_vehicles";
const FILE_STORAGE_KEY = "taxi_logicmoov_local_files";

export function readLocalList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalList<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function deleteLocalDriverRecord(id: string, options: { preserveForAdmin?: boolean } = {}) {
  if (typeof window === "undefined") return;

  const driverKey = "taxi_logicmoov_local_drivers";
  const vehicleKey = "taxi_logicmoov_local_vehicles";
  const preserveForAdmin = Boolean(options.preserveForAdmin);

  if (preserveForAdmin) {
    const drivers = readLocalList<Record<string, unknown>>(driverKey).map((driver) =>
      String(driver.id) === id
        ? { ...driver, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: "driver" }
        : driver,
    );
    const vehicles = readLocalList<Record<string, unknown>>(vehicleKey).map((vehicle) =>
      String(vehicle.driver_id) === id
        ? { ...vehicle, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: "driver" }
        : vehicle,
    );

    writeLocalList(driverKey, drivers);
    writeLocalList(vehicleKey, vehicles);
    return;
  }

  const drivers = readLocalList<Record<string, unknown>>(driverKey).filter((driver) => String(driver.id) !== id);
  const vehicles = readLocalList<Record<string, unknown>>(vehicleKey).filter((vehicle) => String(vehicle.driver_id) !== id);

  writeLocalList(driverKey, drivers);
  writeLocalList(vehicleKey, vehicles);
}

export function deleteLocalVehicleRecord(id: string, options: { preserveForAdmin?: boolean } = {}) {
  if (typeof window === "undefined") return;

  const vehicleKey = "taxi_logicmoov_local_vehicles";
  const preserveForAdmin = Boolean(options.preserveForAdmin);

  if (preserveForAdmin) {
    const vehicles = readLocalList<Record<string, unknown>>(vehicleKey).map((vehicle) =>
      String(vehicle.id) === id
        ? { ...vehicle, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: "driver" }
        : vehicle,
    );
    writeLocalList(vehicleKey, vehicles);
    return;
  }

  const vehicles = readLocalList<Record<string, unknown>>(vehicleKey).filter((vehicle) => String(vehicle.id) !== id);
  writeLocalList(vehicleKey, vehicles);
}

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function saveDriverRecord(payload: Record<string, unknown>): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  if (hasSupabaseConfig()) {
    const { data, error } = await supabase
      .from("drivers")
      .insert(payload)
      .select("id, full_name, whatsapp_number, email, license_number, license_expiry, languages, photo_url, created_at")
      .single();

    if (!error && data) {
      return { data, error: null };
    }
  }

  const item = {
    ...payload,
    status: payload.status ?? "pending",
    id:
      typeof payload.id === "string"
        ? payload.id
        : `local-driver-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    created_at: new Date().toISOString(),
  };

  const drivers = readLocalList<Record<string, unknown>>(DRIVER_STORAGE_KEY);
  writeLocalList(DRIVER_STORAGE_KEY, [...drivers, item]);
  return { data: item, error: null };
}

export async function saveVehicleRecord(payload: Record<string, unknown>): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  if (hasSupabaseConfig()) {
    const { data, error } = await supabase
      .from("vehicles")
      .insert(payload)
      .select("id, driver_id, plate_number, vehicle_type, brand, model, year, color, seat_capacity, luggage_capacity, electric, inclusions, photo_urls, created_at")
      .single();

    if (!error && data) {
      return { data, error: null };
    }
  }

  const item = {
    ...payload,
    id:
      typeof payload.id === "string"
        ? payload.id
        : `local-vehicle-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    created_at: new Date().toISOString(),
  };

  const vehicles = readLocalList<Record<string, unknown>>(VEHICLE_STORAGE_KEY);
  writeLocalList(VEHICLE_STORAGE_KEY, [...vehicles, item]);
  return { data: item, error: null };
}

export async function listDriversFromStore(): Promise<Array<Record<string, unknown>>> {
  if (typeof window === "undefined") return [];

  const hasRealConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasRealConfig) {
    const { data, error } = await supabase.from("drivers").select("*");
    if (!error && Array.isArray(data)) {
      return data as Array<Record<string, unknown>>;
    }
  }

  return readLocalList<Record<string, unknown>>(DRIVER_STORAGE_KEY);
}

export async function listVehiclesFromStore(): Promise<Array<Record<string, unknown>>> {
  if (typeof window === "undefined") return [];

  const hasRealConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasRealConfig) {
    const { data, error } = await supabase.from("vehicles").select("*");
    if (!error && Array.isArray(data)) {
      return data as Array<Record<string, unknown>>;
    }
  }

  return readLocalList<Record<string, unknown>>(VEHICLE_STORAGE_KEY);
}

export async function deleteDriverFromStore(id: string): Promise<void> {
  const hasRealConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasRealConfig) {
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (!error) return;
  }
  deleteLocalDriverRecord(id);
}

export async function deleteVehicleFromStore(id: string): Promise<void> {
  const hasRealConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasRealConfig) {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (!error) return;
  }
  deleteLocalVehicleRecord(id);
}

async function fileToDataUrl(file: File): Promise<string> {
  if (typeof FileReader === "undefined") {
    return "";
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file for local preview."));
    reader.readAsDataURL(file);
  });
}

const fallbackSupabaseClient = () => {
  const storageFrom = (bucketName: string) => ({
    upload: async (path: string, file: File) => {
      if (typeof window === "undefined") {
        return { error: null };
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        const existing = JSON.parse(window.localStorage.getItem(FILE_STORAGE_KEY) ?? "{}") as Record<string, string>;
        existing[path] = dataUrl;
        window.localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(existing));
        return { error: null };
      } catch {
        return { error: new Error("Unable to store the uploaded image locally.") };
      }
    },
    getPublicUrl: (path: string) => {
      if (typeof window === "undefined") {
        return { data: { publicUrl: "" } };
      }

      const existing = JSON.parse(window.localStorage.getItem(FILE_STORAGE_KEY) ?? "{}") as Record<string, string>;
      const publicUrl = existing[path] ?? "";
      return { data: { publicUrl } };
    },
  });

  const tableFrom = (tableName: string) => {
    const localKey = tableName === "drivers" ? DRIVER_STORAGE_KEY : VEHICLE_STORAGE_KEY;

    const saveItem = (payload: Record<string, unknown>) => {
      if (typeof window === "undefined") {
        return { error: null, data: null };
      }

      const item = {
        ...payload,
        id: typeof payload.id === "string" ? payload.id : `local-${tableName}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        created_at: new Date().toISOString(),
      };

      const list = readLocalList<Record<string, unknown>>(localKey);
      list.push(item);
      writeLocalList(localKey, list);
      return { error: null, data: item };
    };

    const selectRows = (field?: string, value?: unknown) => {
      const list = readLocalList<Record<string, unknown>>(localKey);
      if (typeof field === "string" && value !== undefined) {
        return list.filter((item) => String(item[field]) === String(value));
      }
      return list;
    };

    return {
      insert: (payload: Record<string, unknown>) => {
        const result = saveItem(payload);
        return {
          ...result,
          select: () => ({
            single: async () => ({ data: result.data, error: null }),
            maybeSingle: async () => ({ data: result.data, error: null }),
          }),
        };
      },
      select: () => ({
        eq: async (field: string, value: unknown) => ({ data: selectRows(field, value), error: null }),
        single: async () => ({ data: selectRows()[0] ?? null, error: null }),
        maybeSingle: async () => ({ data: selectRows()[0] ?? null, error: null }),
      }),
      delete: () => ({
        eq: async (field: string, value: unknown) => {
          const next = readLocalList<Record<string, unknown>>(localKey).filter((item) => String(item[field]) !== String(value));
          writeLocalList(localKey, next);
          return { data: next, error: null };
        },
      }),
    };
  };

  return {
    storage: { from: storageFrom },
    from: tableFrom,
  };
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : (fallbackSupabaseClient() as any);
