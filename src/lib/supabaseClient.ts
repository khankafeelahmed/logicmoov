import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

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

  const matchesTarget = (value: Record<string, unknown>) => {
    if (!value) return false;
    if (id && String(value.id ?? "") === String(id)) return true;

    const maybeEmail = String(value.email ?? value.user_email ?? "").trim().toLowerCase();
    const maybeFullName = String(value.full_name ?? value.fullName ?? value.name ?? "").trim().toLowerCase();
    const maybeLoginId = String(value.login_id ?? value.username ?? "").trim().toLowerCase();

    if (typeof window !== "undefined") {
      const storedIdentity = window.localStorage.getItem("taxi_logicmoov_last_deleted_driver_identity");
      if (storedIdentity) {
        try {
          const parsed = JSON.parse(storedIdentity) as {
            email?: string;
            fullName?: string;
            loginId?: string;
          };

          const email = parsed.email?.trim().toLowerCase() ?? "";
          const fullName = parsed.fullName?.trim().toLowerCase() ?? "";
          const loginId = parsed.loginId?.trim().toLowerCase() ?? "";

          if (email && maybeEmail && email === maybeEmail) return true;
          if (fullName && maybeFullName && fullName === maybeFullName) return true;
          if (loginId && maybeLoginId && loginId === maybeLoginId) return true;
        } catch {
          // Ignore malformed stored identity.
        }
      }
    }

    return false;
  };

  if (preserveForAdmin) {
    const drivers = readLocalList<Record<string, unknown>>(driverKey).map((driver) =>
      matchesTarget(driver)
        ? { ...driver, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: "driver" }
        : driver,
    );
    const vehicles = readLocalList<Record<string, unknown>>(vehicleKey).map((vehicle) =>
      String(vehicle.driver_id) === id || (typeof window !== "undefined" && window.localStorage.getItem("taxi_logicmoov_last_deleted_driver_identity") && matchesTarget(vehicle as Record<string, unknown>))
        ? { ...vehicle, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: "driver" }
        : vehicle,
    );

    writeLocalList(driverKey, drivers);
    writeLocalList(vehicleKey, vehicles);
    return;
  }

  const drivers = readLocalList<Record<string, unknown>>(driverKey).filter((driver) => !matchesTarget(driver));
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
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

export async function saveDriverRecord(payload: Record<string, unknown>): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  if (hasSupabaseConfig()) {
    const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    if (userData?.user?.id && !payload.user_id) {
      payload.user_id = userData.user.id;
    }

    const hasActiveAuthUser = Boolean(userData?.user?.id || payload.user_id);
    if (hasActiveAuthUser) {
      const sanitized = { ...payload };
      if (!sanitized.id && typeof crypto !== "undefined" && "randomUUID" in crypto) {
        sanitized.id = crypto.randomUUID();
      }
      if (sanitized.email && typeof sanitized.email === "string") {
        const { data: existingRows, error: lookupError } = await supabase
          .from("drivers")
          .select("id")
          .eq("email", sanitized.email)
          .limit(1);
        if (!lookupError && Array.isArray(existingRows) && existingRows.length > 0) {
          const { data, error } = await supabase
            .from("drivers")
            .update(sanitized)
            .eq("id", existingRows[0].id)
            .select("*")
            .single();
          if (!error && data) {
            // Mirror to localStorage so the admin portal always sees this driver
            const localDrivers = readLocalList<Record<string, unknown>>(DRIVER_STORAGE_KEY);
            const localIdx = localDrivers.findIndex((d) => String(d.email ?? "") === String(payload.email ?? ""));
            if (localIdx >= 0) { localDrivers[localIdx] = { ...localDrivers[localIdx], ...data }; writeLocalList(DRIVER_STORAGE_KEY, localDrivers); }
            else { writeLocalList(DRIVER_STORAGE_KEY, [...localDrivers, data]); }
            return { data, error: null };
          }
        }
      }

      const { data, error } = await supabase
        .from("drivers")
        .insert(sanitized)
        .select("*")
        .single();

      if (!error && data) {
        // Mirror to localStorage so the admin portal always sees this driver
        const localDrivers = readLocalList<Record<string, unknown>>(DRIVER_STORAGE_KEY);
        const localIdx = localDrivers.findIndex((d) => String(d.email ?? "") === String(payload.email ?? ""));
        if (localIdx >= 0) { localDrivers[localIdx] = { ...localDrivers[localIdx], ...data }; writeLocalList(DRIVER_STORAGE_KEY, localDrivers); }
        else { writeLocalList(DRIVER_STORAGE_KEY, [...localDrivers, data]); }
        return { data, error: null };
      }
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
    const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    const hasActiveAuthUser = Boolean(userData?.user?.id || payload.user_id);
    if (hasActiveAuthUser) {
      const sanitized = { ...payload };
      if (!sanitized.id && typeof crypto !== "undefined" && "randomUUID" in crypto) {
        sanitized.id = crypto.randomUUID();
      }

      const authUserId = userData?.user?.id ?? payload.user_id;
      if (sanitized.driver_id && typeof sanitized.driver_id === "string" && authUserId) {
        const { data: driverRow } = await supabase
          .from("drivers")
          .select("id")
          .eq("id", sanitized.driver_id)
          .eq("user_id", authUserId)
          .limit(1)
          .maybeSingle();
        if (!driverRow) {
          return { data: null, error: new Error("Driver profile is not authorized for this vehicle record.") };
        }
      }

      if (sanitized.driver_id && sanitized.license_plate) {
        const { data: existingRows, error: lookupError } = await supabase
          .from("vehicles")
          .select("id")
          .eq("driver_id", sanitized.driver_id)
          .eq("license_plate", sanitized.license_plate)
          .limit(1);
        if (!lookupError && Array.isArray(existingRows) && existingRows.length > 0) {
          const { data, error } = await supabase
            .from("vehicles")
            .update(sanitized)
            .eq("id", existingRows[0].id)
            .select("*")
            .single();
          if (!error && data) return { data, error: null };
        }
      }

      const { data, error } = await supabase
        .from("vehicles")
        .insert(sanitized)
        .select("*")
        .single();

      if (!error && data) {
        return { data, error: null };
      }
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

  if (hasSupabaseConfig()) {
    const { data, error } = await supabase.from("drivers").select("*");
    if (!error && Array.isArray(data)) {
      return data as Array<Record<string, unknown>>;
    }
  }

  return readLocalList<Record<string, unknown>>(DRIVER_STORAGE_KEY);
}

export async function listVehiclesFromStore(): Promise<Array<Record<string, unknown>>> {
  if (typeof window === "undefined") return [];

  if (hasSupabaseConfig()) {
    const { data, error } = await supabase.from("vehicles").select("*");
    if (!error && Array.isArray(data)) {
      return data as Array<Record<string, unknown>>;
    }
  }

  return readLocalList<Record<string, unknown>>(VEHICLE_STORAGE_KEY);
}

export async function deleteDriverFromStore(id: string): Promise<void> {
  if (hasSupabaseConfig()) {
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (!error) return;
  }
  deleteLocalDriverRecord(id);
}

export async function deleteVehicleFromStore(id: string): Promise<void> {
  if (hasSupabaseConfig()) {
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

export function assertSupabaseConfigured(): asserts value is true {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before continuing.");
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
