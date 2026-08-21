export type DriverPortalStatus = "pending" | "enabled" | "suspended";

export type DriverPortalAccount = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  status: DriverPortalStatus;
  verificationCode: string;
  verifiedAt?: string;
  createdAt: string;
};

const DRIVER_ACCOUNTS_KEY = "taxi_logicmoov_driver_accounts";
// NOTE: this legacy local-only account/session system is not used by any current driver-portal
// page (only getDriverAccounts()/deleteDriverAccountByIdentity()/updateDriverApprovalStatus()
// below are still called, by the admin drivers page). The key is deliberately named differently
// from src/lib/driverPortal.ts's DRIVER_SESSION_KEY ("taxi_logicmoov_driver_session", the one
// real canonical key the login/register/dashboard/documents pages actually share) so this dead
// code can never again collide with and silently corrupt the real driver session.
const DRIVER_SESSION_KEY = "taxi_logicmoov_legacy_driver_accounts_session";
const LOCAL_DRIVER_PROFILES_KEY = "taxi_logicmoov_local_drivers";

function readAccounts(): DriverPortalAccount[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DRIVER_ACCOUNTS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as DriverPortalAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: DriverPortalAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRIVER_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readLocalDriverProfiles(): Array<Record<string, unknown>> {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOCAL_DRIVER_PROFILES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasActiveLinkedDriverProfile(account: DriverPortalAccount): boolean {
  const profiles = readLocalDriverProfiles();
  const accountEmail = account.email.trim().toLowerCase();
  const accountFullName = account.fullName.trim().toLowerCase();

  return profiles.some((profile) => {
    if (profile.is_deleted === true || profile.deleted_at !== undefined) {
      return false;
    }

    const profileEmail = String(profile.email ?? "").trim().toLowerCase();
    const profileFullName = String(profile.full_name ?? profile.fullName ?? "")
      .trim()
      .toLowerCase();
    return (
      (profileEmail.length > 0 && profileEmail === accountEmail) ||
      (profileFullName.length > 0 && profileFullName === accountFullName)
    );
  });
}

export function getDriverAccounts() {
  return readAccounts();
}

export function deleteDriverAccountByIdentity(identity: {
  id?: string;
  email?: string;
  username?: string;
  fullName?: string;
}) {
  const accounts = readAccounts();
  const normalizedEmail = identity.email?.trim().toLowerCase() ?? "";
  const normalizedUsername = identity.username?.trim().toLowerCase() ?? "";
  const normalizedFullName = identity.fullName?.trim().toLowerCase() ?? "";
  const target = accounts.find((item) => {
    if (identity.id && item.id === identity.id) return true;
    if (normalizedEmail && item.email.toLowerCase() === normalizedEmail) return true;
    if (normalizedUsername && item.username.toLowerCase() === normalizedUsername) return true;
    if (normalizedFullName && item.fullName.toLowerCase() === normalizedFullName) return true;
    return false;
  });

  if (!target) return false;

  writeAccounts(accounts.filter((item) => item.id !== target.id));
  const activeSession = getDriverSession();
  if (
    activeSession &&
    (activeSession.id === target.id ||
      activeSession.email.toLowerCase() === target.email.toLowerCase() ||
      activeSession.username.toLowerCase() === target.username.toLowerCase())
  ) {
    clearDriverSession();
  }
  return true;
}

export function updateDriverApprovalStatus(identifier: string, nextStatus: DriverPortalStatus): DriverPortalAccount {
  const accounts = readAccounts();
  const target = accounts.find(
    (item) =>
      item.id === identifier ||
      item.email.toLowerCase() === identifier.toLowerCase() ||
      item.username.toLowerCase() === identifier.toLowerCase(),
  );

  if (!target) {
    throw new Error("Driver account not found.");
  }

  const updated = accounts.map((item) =>
    item.id === target.id ? { ...item, status: nextStatus } : item,
  );

  writeAccounts(updated);
  const result = updated.find((item) => item.id === target.id);
  if (!result) {
    throw new Error("Driver account could not be updated.");
  }

  return result;
}

export function registerDriverAccount(input: {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): DriverPortalAccount {
  const accounts = readAccounts();
  const normalizedUsername = input.username.trim();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingByUsername = accounts.find(
    (account) => account.username.toLowerCase() === normalizedUsername.toLowerCase(),
  );
  const existingByEmail = accounts.find(
    (account) => account.email.toLowerCase() === normalizedEmail,
  );

  const staleAccountIds = new Set<string>();
  for (const candidate of [existingByUsername, existingByEmail]) {
    if (!candidate) continue;
    if (!hasActiveLinkedDriverProfile(candidate)) {
      staleAccountIds.add(candidate.id);
    }
  }

  const activeAccounts = staleAccountIds.size > 0
    ? accounts.filter((account) => !staleAccountIds.has(account.id))
    : accounts;

  if (activeAccounts.some((account) => account.username.toLowerCase() === normalizedUsername.toLowerCase())) {
    throw new Error("This login ID is already in use.");
  }

  if (activeAccounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
    throw new Error("This email is already registered.");
  }

  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const account: DriverPortalAccount = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `driver-${Date.now()}`,
    username: normalizedUsername,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    phone: input.phone.trim(),
    password: input.password,
    status: "pending",
    verificationCode,
    createdAt: new Date().toISOString(),
  };

  writeAccounts([...activeAccounts, account]);
  return account;
}

export function verifyDriverAccount(email: string, code: string): DriverPortalAccount {
  const accounts = readAccounts();
  const account = accounts.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.status === "pending",
  );

  if (!account) {
    throw new Error("This account was not found or is already active.");
  }

  if (account.verificationCode !== code.trim()) {
    throw new Error("The verification code is incorrect.");
  }

  const updated: DriverPortalAccount[] = accounts.map((item) =>
    item.id === account.id
      ? { ...item, status: "enabled", verifiedAt: new Date().toISOString() }
      : item,
  );

  writeAccounts(updated);
  const verified = updated.find((item) => item.id === account.id) ?? account;
  return verified as DriverPortalAccount;
}

export function loginDriverAccount(loginId: string, password: string): DriverPortalAccount {
  const accounts = readAccounts();
  const account = accounts.find(
    (item) =>
      (item.username.toLowerCase() === loginId.trim().toLowerCase() ||
        item.email.toLowerCase() === loginId.trim().toLowerCase()) &&
      item.password === password,
  );

  if (!account) {
    throw new Error("Invalid login ID or password.");
  }

  if (account.status === "suspended") {
    throw new Error("This driver account has been suspended by the admin team.");
  }

  if (account.status === "pending") {
    return account;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(account));
  }

  return account;
}

export function getDriverSession(): DriverPortalAccount | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRIVER_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DriverPortalAccount;
  } catch {
    return null;
  }
}

export function syncDriverSessionStatus(account: DriverPortalAccount): DriverPortalAccount | null {
  const latestAccount = readAccounts().find(
    (item) =>
      item.id === account.id ||
      item.email.toLowerCase() === account.email.toLowerCase() ||
      item.username.toLowerCase() === account.username.toLowerCase(),
  );

  if (!latestAccount) {
    clearDriverSession();
    return null;
  }

  const merged = { ...account, ...latestAccount };
  setDriverSession(merged);
  return merged;
}

export function setDriverSession(account: DriverPortalAccount) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(account));
}

export function clearDriverSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRIVER_SESSION_KEY);
}
