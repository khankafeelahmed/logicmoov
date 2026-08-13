import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";

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
  const email = input.email.trim().toLowerCase();
  const drafts = readDrafts();
  const existing = drafts.find((draft) => draft.email.toLowerCase() === email);
  if (existing) {
    return { ok: false, message: "A driver account already exists for this email." };
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
    const { error } = await supabase.auth.signUp({
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
      return { ok: false, message: error.message || "Unable to create the authentication account." };
    }
  }

  writeDrafts([...drafts, draft]);
  return { ok: true, message: "Account created. Please verify your email to continue.", draft };
}

export function getCurrentDriverApplication(): DriverApplicationDraft | null {
  if (typeof window === "undefined") return null;
  const drafts = readDrafts();
  if (drafts.length === 0) return null;
  return drafts[drafts.length - 1];
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
