import { clearDriverPortalSession, getDriverPortalSession } from "@/lib/driverPortal";
import { assertSupabaseConfigured, hasSupabaseConfig, saveDriverRecord, saveVehicleRecord, supabase } from "@/lib/supabaseClient";

export type DriverDocumentStatus = "pending" | "approved" | "rejected" | "expired";
export type DriverApplicationStatus =
  | "draft"
  | "email_unverified"
  | "submitted"
  | "under_review"
  | "needs_information"
  | "pending_verification"
  | "approved"
  | "rejected"
  | "suspended";

export type DriverFileRecord = {
  id: string;
  documentType: string;
  filePath: string;
  uploadedAt: string;
  verificationStatus: DriverDocumentStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  reviewerId?: string;
};

export type DriverApplicationDraft = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: DriverApplicationStatus;
  createdAt: string;
  updatedAt: string;
  account: {
    email: string;
    mobilePhone: string;
    preferredLanguage: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    agreementAccepted: boolean;
    emailVerified: boolean;
  };
  personal: {
    firstName: string;
    middleName?: string;
    lastName: string;
    preferredName?: string;
    dateOfBirth?: string;
    gender?: string;
    email: string;
    mobilePhone: string;
    alternatePhone?: string;
    residentialAddress?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
  };
  documents: {
    photoId1?: DriverFileRecord;
    photoId2?: DriverFileRecord;
    driversLicence?: DriverFileRecord;
  };
  workEligibility: {
    status?: string;
    documentType?: string;
    expiryDate?: string;
    file?: DriverFileRecord;
    verificationStatus?: DriverDocumentStatus;
  };
  licence: {
    licenceNumber?: string;
    province?: string;
    licenceClass?: string;
    issueDate?: string;
    expiryDate?: string;
    document?: DriverFileRecord;
    verificationStatus?: DriverDocumentStatus;
  };
  vehicle: {
    category?: string;
    make?: string;
    model?: string;
    year?: string;
    colour?: string;
    licencePlate?: string;
    province?: string;
    vin?: string;
    passengerCapacity?: string;
    luggageCapacity?: string;
    registrationNumber?: string;
    registrationExpiryDate?: string;
    permitInfo?: string;
    insuranceCompany?: string;
    policyNumber?: string;
    insuranceExpiryDate?: string;
    documents?: {
      registration?: DriverFileRecord;
      insurance?: DriverFileRecord;
      permit?: DriverFileRecord;
      inspection?: DriverFileRecord;
      photos?: DriverFileRecord[];
    };
  };
  consents?: Array<{
    type: string;
    version: string;
    timestamp: string;
    userId: string;
  }>;
};

const DRIVER_APPLICATION_KEY = "taxi_logicmoov_driver_application";

function toDbApplicationStatus(status?: string): string {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "suspended":
      return "suspended";
    case "under_review":
    case "pending_verification":
    case "submitted":
      return "submitted";
    case "needs_information":
      return "documents_required";
    case "email_unverified":
    default:
      return "draft";
  }
}

async function syncDraftToSupabase(draft: DriverApplicationDraft) {
  if (!hasSupabaseConfig() || !draft.email) return;

  try {
    const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const driverPayload = {
      first_name: draft.personal?.firstName || draft.firstName || "",
      last_name: draft.personal?.lastName || draft.lastName || "",
      email: draft.email,
      phone: draft.account?.mobilePhone || draft.personal?.mobilePhone || "",
      date_of_birth: draft.personal?.dateOfBirth || null,
      address: draft.personal?.residentialAddress || null,
      city: draft.personal?.city || null,
      province: draft.personal?.province || null,
      postal_code: draft.personal?.postalCode || null,
      driver_license_number: draft.licence?.licenceNumber || null,
      profile_photo_url: null,
      application_status: toDbApplicationStatus(draft.status),
      ...(userData?.user?.id ? { user_id: userData.user.id } : {}),
    };

    const { data: existingDrivers } = await supabase
      .from("drivers")
      .select("id")
      .eq("email", draft.email)
      .limit(1);

    let driverId = existingDrivers?.[0]?.id ? String(existingDrivers[0].id) : "";
    if (!driverId) {
      const saved = await saveDriverRecord(driverPayload as Record<string, unknown>);
      driverId = saved.data && typeof saved.data.id === "string" ? saved.data.id : "";
    } else {
      await supabase.from("drivers").update(driverPayload).eq("id", driverId);
    }

    if (!driverId) return;

    const vehiclePayload = {
      driver_id: driverId,
      make: draft.vehicle?.make || null,
      model: draft.vehicle?.model || null,
      year: draft.vehicle?.year ? Number(draft.vehicle.year) : null,
      colour: draft.vehicle?.colour || null,
      vin: draft.vehicle?.vin || null,
      license_plate: draft.vehicle?.licencePlate || null,
      vehicle_type: draft.vehicle?.category || null,
      passenger_capacity: draft.vehicle?.passengerCapacity ? Number(draft.vehicle.passengerCapacity) : null,
      ownership_type: draft.vehicle?.category || null,
    };

    const { data: existingVehicles } = await supabase
      .from("vehicles")
      .select("id")
      .eq("driver_id", driverId)
      .limit(1);

    if (existingVehicles?.[0]?.id) {
      await supabase.from("vehicles").update(vehiclePayload).eq("id", String(existingVehicles[0].id));
    } else {
      await saveVehicleRecord(vehiclePayload as Record<string, unknown>);
    }

    const applicationStatus = toDbApplicationStatus(draft.status);
    const { data: existingApplications } = await supabase
      .from("applications")
      .select("id")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(1);

    const appPayload = {
      driver_id: driverId,
      application_number: `LM-${new Date().getFullYear()}-${String(Date.now()).slice(-6).padStart(6, "0")}`,
      status: applicationStatus,
      submitted_at:
        draft.status === "submitted" || draft.status === "under_review" || draft.status === "pending_verification"
          ? new Date().toISOString()
          : null,
      reviewed_at: null,
      reviewed_by: null,
      admin_notes: null,
    };

    if (existingApplications?.[0]?.id) {
      await supabase.from("applications").update(appPayload).eq("id", String(existingApplications[0].id));
    } else {
      await supabase.from("applications").insert(appPayload).select("id").single();
    }
  } catch {
    // Ignore remote persistence failures and keep the local draft flow working.
  }
}

async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle && typeof window !== "undefined") {
    const encoded = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return btoa(password);
}

function readDrafts(): DriverApplicationDraft[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DRIVER_APPLICATION_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDrafts(items: DriverApplicationDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRIVER_APPLICATION_KEY, JSON.stringify(items));
}

export async function createDriverAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  password: string;
  preferredLanguage: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  agreementAccepted: boolean;
}): Promise<{ ok: boolean; message: string; draft?: DriverApplicationDraft }> {
  if (!hasSupabaseConfig()) {
    return { ok: false, message: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to continue." };
  }

  const email = input.email.trim().toLowerCase();
  const drafts = readDrafts();
  const staleDrafts = drafts.filter((draft) => draft.email.toLowerCase() !== email);

  if (hasSupabaseConfig()) {
    const { data: existingDriverRow, error: existingDriverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (existingDriverError) {
      // A driver row may exist even when the auth user does not (admin-created or partially-created
      // record), so keep this as a DB-level guardrail instead of relying on local draft state.
    }

    if ((existingDriverRow ?? []).length > 0) {
      return { ok: false, message: "An account already exists for this email. Please use the Sign In tab to continue." };
    }
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DRIVER_APPLICATION_KEY);
    window.localStorage.removeItem("taxi_logicmoov_driver_session");
  }

  const passwordHash = await hashPassword(input.password);
  const draft: DriverApplicationDraft = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `driver-${Date.now()}`,
    email,
    passwordHash,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    status: "email_unverified",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    account: {
      email,
      mobilePhone: input.mobilePhone.trim(),
      preferredLanguage: input.preferredLanguage,
      termsAccepted: input.termsAccepted,
      privacyAccepted: input.privacyAccepted,
      agreementAccepted: input.agreementAccepted,
      emailVerified: false,
    },
    personal: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      mobilePhone: input.mobilePhone.trim(),
    },
    documents: {},
    workEligibility: {},
    licence: {},
    vehicle: {},
  };

  if (hasSupabaseConfig() && supabase?.auth) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          full_name: draft.fullName,
          preferred_language: input.preferredLanguage,
        },
      },
    });

    if (error) {
      const code = String(error.code ?? "").toLowerCase();
      const message = String(error.message ?? "").toLowerCase();
      const isDuplicate =
        code === "user_already_exists" ||
        code === "email_exists" ||
        message.includes("already registered") ||
        message.includes("already exists") ||
        message.includes("user already");

      if (isDuplicate) {
        return { ok: false, message: "An account already exists for this email. Please use the Sign In tab to continue." };
      }

      return { ok: false, message: error.message || "Unable to create the authentication account." };
    }

    let authUserId = data?.user?.id ?? null;
    if (authUserId && !data?.session) {
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: input.password,
      });
      if (!signInError) {
        authUserId = sessionData?.user?.id ?? authUserId;
      }
    }

    if (!authUserId) {
      return { ok: false, message: "Unable to create the authentication account. Please try again." };
    }

    const saveResult = await saveDriverRecord({
      user_id: authUserId,
      first_name: draft.firstName,
      last_name: draft.lastName,
      email: draft.email,
      phone: draft.account?.mobilePhone || "",
      date_of_birth: draft.personal?.dateOfBirth || null,
      address: draft.personal?.residentialAddress || null,
      city: draft.personal?.city || null,
      province: draft.personal?.province || null,
      postal_code: draft.personal?.postalCode || null,
      driver_license_number: draft.licence?.licenceNumber || null,
      profile_photo_url: null,
      application_status: toDbApplicationStatus(draft.status),
    } as Record<string, unknown>);

    // The auth account exists at this point even if the driver-row save fails below; surface
    // that failure clearly instead of reporting success while no driver record actually exists.
    if (saveResult.error) {
      return {
        ok: false,
        message: `Your account was created, but we couldn't save your driver profile (${saveResult.error.message}). Please try signing in again, or contact support.`,
      };
    }
  }

  writeDrafts([...staleDrafts, draft]);
  return { ok: true, message: "Account created successfully. You can continue to your profile and upload documents.", draft };
}

export function getCurrentDriverApplication(): DriverApplicationDraft | null {
  if (typeof window === "undefined") return null;

  const session = getDriverPortalSession();
  if (!session) return null;

  const email = String(session.email ?? "").trim().toLowerCase();
  if (!email) {
    clearDriverPortalSession();
    return null;
  }

  const drafts = readDrafts();
  const match = drafts.find((draft) => draft.email.toLowerCase() === email) ?? null;

  if (!match) {
    clearDriverPortalSession();
    return null;
  }

  return match;
}

export function getDriverApplicationByEmail(email: string): DriverApplicationDraft | null {
  const drafts = readDrafts();
  return drafts.find((draft) => draft.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function saveDriverApplication(partial: Partial<DriverApplicationDraft>): DriverApplicationDraft {
  const drafts = readDrafts();
  const existing = drafts.find((draft) => draft.email.toLowerCase() === partial.email?.toLowerCase()) ?? drafts[drafts.length - 1] ?? null;
  const next: DriverApplicationDraft = {
    id: existing?.id ?? `driver-${Date.now()}`,
    email: partial.email ?? existing?.email ?? "",
    passwordHash: partial.passwordHash ?? existing?.passwordHash ?? "",
    firstName: partial.firstName ?? existing?.firstName ?? "",
    lastName: partial.lastName ?? existing?.lastName ?? "",
    fullName: partial.fullName ?? existing?.fullName ?? "",
    status: partial.status ?? existing?.status ?? "draft",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    account: { ...existing?.account, ...partial.account },
    personal: { ...existing?.personal, ...partial.personal },
    documents: { ...existing?.documents, ...partial.documents },
    workEligibility: { ...existing?.workEligibility, ...partial.workEligibility },
    licence: { ...existing?.licence, ...partial.licence },
    vehicle: { ...existing?.vehicle, ...partial.vehicle },
    consents: partial.consents ?? existing?.consents ?? [],
  };

  const nextDrafts = existing ? drafts.map((draft) => draft.id === existing.id ? next : draft) : [...drafts, next];
  writeDrafts(nextDrafts);
  void syncDraftToSupabase(next);
  return next;
}

export function signInDriverAccount(email: string, password: string): DriverApplicationDraft | null {
  const drafts = readDrafts();
  const match = drafts.find((draft) => draft.email.toLowerCase() === email.trim().toLowerCase());
  if (!match) return null;

  if (match.status === "email_unverified") {
    return null;
  }

  if (match.account.emailVerified === false) {
    return null;
  }

  return match;
}

export function verifyDriverEmail(email: string): DriverApplicationDraft | null {
  const drafts = readDrafts();
  const match = drafts.find((draft) => draft.email.toLowerCase() === email.trim().toLowerCase());
  if (!match) return null;

  const next: DriverApplicationDraft = {
    ...match,
    status: "pending_verification",
    updatedAt: new Date().toISOString(),
    account: { ...match.account, emailVerified: true },
  };

  writeDrafts(drafts.map((draft) => (draft.id === match.id ? next : draft)));
  return next;
}

export function clearDriverApplication() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRIVER_APPLICATION_KEY);
}

export function buildDriverStatusSummary(draft: DriverApplicationDraft | null): { label: string; tone: string } {
  if (!draft) return { label: "Not started", tone: "bg-slate-100 text-slate-700" };
  if (draft.status === "email_unverified") return { label: "Email verification required", tone: "bg-amber-100 text-amber-700" };
  if (draft.status === "submitted") return { label: "Submitted", tone: "bg-amber-100 text-amber-700" };
  if (draft.status === "under_review" || draft.status === "pending_verification") return { label: "Under Review", tone: "bg-amber-100 text-amber-700" };
  if (draft.status === "needs_information") return { label: "Needs Information", tone: "bg-orange-100 text-orange-700" };
  if (draft.status === "approved") return { label: "Approved", tone: "bg-emerald-100 text-emerald-700" };
  if (draft.status === "rejected") return { label: "Rejected", tone: "bg-red-100 text-red-700" };
  if (draft.status === "suspended") return { label: "Suspended", tone: "bg-red-100 text-red-700" };
  return { label: "Draft", tone: "bg-slate-100 text-slate-700" };
}

export function canSubmitDriverApplication(draft: DriverApplicationDraft | null): { canSubmit: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!draft) {
    return { canSubmit: false, missing: ["Create a driver account"] };
  }

  if (!draft.firstName || !draft.lastName) missing.push("Profile complete");
  if (!draft.account.emailVerified) missing.push("Email verified");
  if (!draft.account.mobilePhone) missing.push("Phone provided");
  if (!draft.documents.photoId1 || !draft.documents.photoId2) missing.push("Identity documents uploaded");
  if (!draft.documents.driversLicence) missing.push("Driver licence uploaded");
  if (!draft.workEligibility.status || !draft.workEligibility.documentType || !draft.workEligibility.expiryDate) missing.push("Work eligibility information complete");
  if (!draft.licence.licenceNumber || !draft.licence.expiryDate) missing.push("Driver licence information complete");
  if (!draft.vehicle.category || !draft.vehicle.make || !draft.vehicle.model) missing.push("Vehicle registered");
  if (!draft.vehicle.documents?.registration) missing.push("Vehicle registration uploaded");
  if (!draft.vehicle.documents?.insurance) missing.push("Insurance uploaded");
  if (!draft.vehicle.documents?.photos || draft.vehicle.documents.photos.length < 2) missing.push("Required vehicle photos uploaded");
  if (!draft.account.termsAccepted || !draft.account.privacyAccepted || !draft.account.agreementAccepted) missing.push("Required declarations accepted");

  return { canSubmit: missing.length === 0, missing };
}
