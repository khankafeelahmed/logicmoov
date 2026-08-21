import { assertSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type DriverPortalSession = {
  email: string;
  firstName: string;
  lastName: string;
  // Legacy fields from the old login-ID based flow (registerDriverAccount/loginDriverAccount
  // below). Nothing currently writes a session without the fields above; these stay optional
  // so old sessions/dead code don't break, but new code should not depend on them being present.
  userId?: string;
  driverId?: string;
  loginId?: string;
  fullName?: string;
  phone?: string;
  applicationStatus?: string;
};

/** Resolves the real, currently-authenticated Supabase user id — the actual source of truth
 * for "who is this driver", independent of whatever shape the local session object has. */
async function getAuthenticatedUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  return data?.user?.id ?? null;
}

export type DriverDocumentDefinition = {
  id: string;
  label: string;
  dbType: string;
  folder: string;
};

export const DRIVER_DOCUMENT_DEFINITIONS: DriverDocumentDefinition[] = [
  {
    id: "transport_operating_licence",
    label: "Transport Operating Licence / SAAQ Taxi Licence",
    dbType: "transport_operating_license",
    folder: "transport_operating_licence",
  },
  {
    id: "vehicle_insurance_certificate",
    label: "Fleet / Vehicle Insurance Certificate",
    dbType: "vehicle_insurance",
    folder: "vehicle_insurance_certificate",
  },
  {
    id: "taxi_registration_certificate",
    label: "Taxi Registration Certificate from SAAQ",
    dbType: "saaq_registration",
    folder: "taxi_registration_certificate",
  },
  {
    id: "saaq_mechanical_inspection_certificate",
    label: "SAAQ Mechanical Inspection Certificate",
    dbType: "mechanical_inspection",
    folder: "saaq_mechanical_inspection_certificate",
  },
];

// This is the ONE canonical driver-portal session key, shared with the login and register
// pages (src/app/[locale]/driver/login/page.tsx and .../register/page.tsx write here too).
// Do not introduce a second key for driver session state — that caused a real bug where
// Documents & Compliance treated a logged-in driver as logged out (session-key mismatch).
export const DRIVER_SESSION_KEY = "taxi_logicmoov_driver_session";

export const DRIVER_LOGIN_ID_SCHEMA_ERROR =
  "The driver login_id column is missing from the existing database schema. Apply the migration in the current Supabase project before using driver registration/login.";

function isMissingLoginIdColumnError(error: { message?: string } | null | undefined): boolean {
  const message = error?.message ?? "";
  return message.includes("drivers.login_id") && message.includes("does not exist");
}

function isDuplicateLoginIdError(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message ?? "";
  const code = error?.code ?? "";
  return code === "23505" || message.includes("drivers_login_id_key") || message.includes("duplicate key value violates unique constraint");
}

export function normalizeLoginId(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function makeInternalEmail(loginId: string): string {
  const sanitized = normalizeLoginId(loginId).replace(/[^a-z0-9]/g, "") || "driver";
  const shortLocalPart = sanitized.slice(0, 20) || "driver";
  return `${shortLocalPart}-${Math.random().toString(36).slice(2, 8)}@logicmoov.ca`;
}

function getDocumentStatusLabels() {
  return {
    missing: "Not Uploaded",
    pending: "Uploaded - Pending Review",
    approved: "Approved",
    rejected: "Rejected - Please upload a new document",
    additional_documents_required: "Please upload a new document",
  } as const;
}

export function getDocumentStatusText(status?: string | null): string {
  if (!status) return getDocumentStatusLabels().missing;
  if (status === "pending") return getDocumentStatusLabels().pending;
  if (status === "approved") return getDocumentStatusLabels().approved;
  if (status === "rejected") return getDocumentStatusLabels().rejected;
  return getDocumentStatusLabels().missing;
}

export function getDriverPortalSession(): DriverPortalSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRIVER_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DriverPortalSession;
  } catch {
    window.localStorage.removeItem(DRIVER_SESSION_KEY);
    return null;
  }
}

export function setDriverPortalSession(session: DriverPortalSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(session));
}

export function clearDriverPortalSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRIVER_SESSION_KEY);
}

export async function getLoggedInDriverProfile() {
  const session = getDriverPortalSession();
  if (!session) return null;

  const userId = session.userId || (await getAuthenticatedUserId());
  if (!userId) return null;

  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function updateDriverProfile(fields: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<{ ok: boolean; message: string }> {
  const session = getDriverPortalSession();
  if (!session) {
    return { ok: false, message: "You must be logged in to update your profile." };
  }

  const userId = session.userId || (await getAuthenticatedUserId());
  if (!userId) {
    return { ok: false, message: "You must be logged in to update your profile." };
  }

  const { error } = await supabase
    .from("drivers")
    .update({
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
    })
    .eq("user_id", userId);

  if (error) {
    return { ok: false, message: error.message || "Unable to save your profile details." };
  }

  // Keep the local session in sync so the sidebar/name shown elsewhere doesn't go stale.
  setDriverPortalSession({
    ...session,
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    fullName: `${fields.firstName.trim()} ${fields.lastName.trim()}`.trim(),
    phone: fields.phone.trim(),
    email: fields.email.trim(),
  });

  return { ok: true, message: "Profile saved." };
}

export async function registerDriverAccount(input: {
  loginId: string;
  password: string;
  confirmPassword: string;
}): Promise<{ ok: boolean; message: string }> {
  const loginId = normalizeLoginId(input.loginId);

  if (!loginId || loginId.length < 3) {
    return { ok: false, message: "Login ID must be at least 3 characters long." };
  }
  if (input.password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters long." };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  const { data: existingDriver, error: lookupError } = await supabase
    .from("drivers")
    .select("id")
    .eq("login_id", loginId)
    .maybeSingle();
 
  if (lookupError) {
   if (isMissingLoginIdColumnError(lookupError)) {
     return { ok: false, message: DRIVER_LOGIN_ID_SCHEMA_ERROR };
   }
   return { ok: false, message: lookupError.message || "Unable to validate the Login ID." };
  }
  if (existingDriver) {
    return { ok: false, message: "This Login ID is already in use." };
  }

  assertSupabaseConfigured();
  const internalEmail = makeInternalEmail(loginId);
  const { data: authUser, error: signUpError } = await supabase.auth.signUp({
    email: internalEmail,
    password: input.password,
    options: {
      data: {
        login_id: loginId,
      },
    },
  });

  if (signUpError || !authUser?.user?.id) {
    return { ok: false, message: signUpError?.message || "Unable to create a driver account." };
  }

  const { error: insertError } = await supabase.from("drivers").insert({
    user_id: authUser.user.id,
    login_id: loginId,
    first_name: loginId,
    last_name: "Driver",
    phone: "N/A",
    email: internalEmail,
    application_status: "documents_required",
  });

  if (insertError) {
    if (isMissingLoginIdColumnError(insertError)) {
      return { ok: false, message: DRIVER_LOGIN_ID_SCHEMA_ERROR };
    }
    if (isDuplicateLoginIdError(insertError)) {
      return { ok: false, message: "This Login ID is already in use. Please choose another one." };
    }
    return { ok: false, message: insertError.message || "Driver profile could not be created." };
  }

  return {
    ok: true,
    message: "Your driver account has been created successfully. You can now log in.",
  };
}

export async function loginDriverAccount(loginId: string, password: string): Promise<DriverPortalSession> {
  assertSupabaseConfigured();
  const normalizedLoginId = normalizeLoginId(loginId);
  if (!normalizedLoginId) {
    throw new Error("Invalid Login ID or Password.");
  }

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("*")
    .eq("login_id", normalizedLoginId)
    .maybeSingle();

  if (driverError) {
   if (isMissingLoginIdColumnError(driverError)) {
     throw new Error(DRIVER_LOGIN_ID_SCHEMA_ERROR);
   }
   throw new Error("Invalid Login ID or Password.");
  }

  if (!driver) {
   throw new Error("Invalid Login ID or Password.");
  }

  const authEmail = String(driver.email || "");
  if (!authEmail) {
    throw new Error("Invalid Login ID or Password.");
  }

  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (signInError || !sessionData?.user?.id) {
    throw new Error("Invalid Login ID or Password.");
  }

  const session: DriverPortalSession = {
    userId: sessionData.user.id,
    driverId: String(driver.id),
    loginId: String(driver.login_id || normalizedLoginId),
    firstName: String(driver.first_name || ""),
    lastName: String(driver.last_name || ""),
    fullName: `${String(driver.first_name || "").trim()} ${String(driver.last_name || "").trim()}`.trim(),
    phone: String(driver.phone || ""),
    email: authEmail,
    applicationStatus: String(driver.application_status || "Account Created"),
  };

  setDriverPortalSession(session);
  return session;
}

export async function logoutDriverAccount(): Promise<{ ok: boolean; message?: string }> {
  const hadSession = Boolean(getDriverPortalSession());
  let remoteError: string | undefined;

  if (hadSession && supabase) {
    const { error } = await supabase.auth.signOut().then(
      (result) => result,
      (err) => ({ error: err instanceof Error ? err : new Error("Sign out failed.") }),
    );
    if (error) {
      remoteError = error.message || "Unable to reach the server to sign out.";
    }
  }

  // Always clear the local session and any stale application draft, even if the remote
  // sign-out call failed. The browser must not keep identity or draft state from a previous
  // driver account alive across the next login.
  clearDriverPortalSession();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("taxi_logicmoov_driver_application");
  }

  return remoteError ? { ok: false, message: remoteError } : { ok: true };
}

export function getDriverDisplayStatus(applicationStatus?: string): string {
  switch (applicationStatus) {
    case "documents_required":
      return "Documents Required";
    case "under_review":
      return "Documents Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "additional_documents_required":
      return "Additional Documents Required";
    case "account_created":
    case "draft":
    default:
      return "Account Created";
  }
}

export function normalizeDocumentStatus(status?: string | null): string {
  switch (status) {
    case "pending":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "missing";
  }
}

export async function getDriverVehicle() {
  const session = getDriverPortalSession();
  if (!session) return null;
  const userId = session.userId || (await getAuthenticatedUserId());
  if (!userId) return null;

  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).maybeSingle();
  if (!driver) return null;

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("driver_id", driver.id).maybeSingle();
  return vehicle;
}

export async function saveDriverVehicle(payload: Record<string, unknown>) {
  const session = getDriverPortalSession();
  if (!session) throw new Error("You must be logged in to save your vehicle details.");
  const userId = session.userId || (await getAuthenticatedUserId());
  if (!userId) throw new Error("You must be logged in to save your vehicle details.");

  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).maybeSingle();
  if (!driver) throw new Error("Driver profile not found.");

  const vehicleData = { ...payload, driver_id: driver.id };
  const existing = await getDriverVehicle();

  if (existing?.id) {
    const { error } = await supabase.from("vehicles").update(vehicleData).eq("id", existing.id);
    if (error) throw new Error(error.message || "Unable to save your vehicle information.");
    return { updated: true };
  }

  const { error } = await supabase.from("vehicles").insert(vehicleData);
  if (error) throw new Error(error.message || "Unable to save your vehicle information.");
  return { updated: false };
}

export async function getDriverDocuments() {
  const session = getDriverPortalSession();
  if (!session) return [] as Record<string, unknown>[];
  const userId = session.userId || (await getAuthenticatedUserId());
  if (!userId) return [] as Record<string, unknown>[];

  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).maybeSingle();
  if (!driver) return [] as Record<string, unknown>[];

  const { data, error } = await supabase.from("driver_documents").select("*").eq("driver_id", driver.id);
  if (error) return [] as Record<string, unknown>[];
  return Array.isArray(data) ? data : [];
}

export async function upsertDriverDocument(type: string, file: File) {
  const session = getDriverPortalSession();
  if (!session) throw new Error("You must be logged in to upload a document.");

  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

  if (!allowedExtensions.includes(fileExt) || !allowedMimeTypes.includes(file.type || "")) {
    throw new Error("Unsupported file type. Only PDF, JPG, JPEG, and PNG are allowed.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("The selected file is larger than 10 MB. Please choose a smaller document.");
  }

  const userId = session.userId || (await getAuthenticatedUserId());
  if (!userId) throw new Error("You must be logged in to upload a document.");

  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).maybeSingle();
  if (!driver) throw new Error("Driver profile not found.");

  const definition = DRIVER_DOCUMENT_DEFINITIONS.find((item) => item.id === type);
  const dbType = definition?.dbType ?? type;
  const folder = definition?.folder ?? type;
  const path = `${driver.id}/${folder}/${Date.now()}-${file.name}`;

  const uploadResult = await supabase.storage.from("driver-documents").upload(path, file, { upsert: true });
  if (uploadResult.error) {
    throw new Error(uploadResult.error.message || "Unable to upload the document.");
  }

  const { data: existingRows } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("driver_id", driver.id)
    .eq("document_type", dbType)
    .limit(1);

  const payload = {
    driver_id: driver.id,
    document_type: dbType,
    file_path: path,
    original_filename: file.name,
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
    status: "pending",
    rejection_reason: null,
    uploaded_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
  };

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    const { error } = await supabase.from("driver_documents").update(payload).eq("id", existingRows[0].id);
    if (error) throw new Error(error.message || "Unable to update the document record.");
    return { path, status: "pending" };
  }

  const { error } = await supabase.from("driver_documents").insert(payload);
  if (error) throw new Error(error.message || "Unable to save the document record.");

  return { path, status: "pending" };
}

export async function getSignedDocumentUrl(path: string) {
  const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
  const { data, error } = await supabase.storage
    .from("driver-documents")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}

export async function getDriverProfileSummary() {
  const session = getDriverPortalSession();
  if (!session) return null;
  const userId = session.userId || (await getAuthenticatedUserId());
  if (!userId) return null;

  const { data: driver } = await supabase
    .from("drivers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!driver) return null;

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("driver_id", driver.id).maybeSingle();
  const { data: documents } = await supabase.from("driver_documents").select("*").eq("driver_id", driver.id);

  return { driver, vehicle, documents: Array.isArray(documents) ? documents : [] };
}
