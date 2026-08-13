"use client";

import { useCallback, useEffect, useState } from "react";
import { Car, CheckCircle2, Mail, ShieldCheck, LogOut, UserRound, ShieldAlert, Trash2 } from "lucide-react";
import AddDriverModal from "@/components/AddDriverModal";
import AddVehicleModal from "@/components/AddVehicleModal";
import {
  deleteLocalDriverRecord,
  deleteLocalVehicleRecord,
  readLocalList,
} from "@/lib/supabaseClient";
import {
  clearDriverSession,
  getDriverSession,
  loginDriverAccount,
  registerDriverAccount,
  syncDriverSessionStatus,
  verifyDriverAccount,
  type DriverPortalAccount,
} from "@/lib/driverAuth";

export default function DriverPortalPage() {
  const [screen, setScreen] = useState<"login" | "register" | "verify" | "dashboard">("login");
  const [session, setSession] = useState<DriverPortalAccount | null>(null);
  const [pending, setPending] = useState<DriverPortalAccount | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [driverProfileRows, setDriverProfileRows] = useState<Array<Record<string, unknown>>>([]);
  const [driverVehicleRows, setDriverVehicleRows] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ loginId: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const activeSession = getDriverSession();
    if (activeSession) {
      const syncedSession = syncDriverSessionStatus(activeSession);
      if (syncedSession) {
        setSession(syncedSession);
        setScreen("dashboard");
      } else {
        setSession(null);
        setScreen("login");
      }
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    const syncedSession = syncDriverSessionStatus(session);
    if (!syncedSession) {
      setSession(null);
      setPending(null);
      setScreen("login");
      setError("Your driver account is no longer available. Please register again.");
      return;
    }
    if (syncedSession.status !== session.status || syncedSession.email !== session.email || syncedSession.username !== session.username) {
      setSession(syncedSession);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key !== "taxi_logicmoov_driver_accounts") {
        return;
      }
      const nextSession = syncDriverSessionStatus(session);
      if (nextSession) {
        setSession(nextSession);
      } else {
        setSession(null);
        setPending(null);
        setScreen("login");
        setError("Your driver account is no longer available. Please register again.");
      }
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, [session]);

  const refreshDriverFleetData = useCallback(() => {
    if (!session) {
      setDriverProfileRows([]);
      setDriverVehicleRows([]);
      return;
    }

    const drivers = readLocalList<Record<string, unknown>>("taxi_logicmoov_local_drivers");
    const vehicles = readLocalList<Record<string, unknown>>("taxi_logicmoov_local_vehicles");

    const matchingDriver = drivers.find((driver) => {
      const isDeleted = driver.is_deleted === true || driver.deleted_at !== undefined;
      if (isDeleted) return false;
      const email = String(driver.email ?? "").toLowerCase();
      const fullName = String(driver.full_name ?? "").toLowerCase();
      return email === session.email.toLowerCase() || fullName === session.fullName.toLowerCase();
    });

    const matchingVehicles = vehicles.filter((vehicle) => {
      if (vehicle.is_deleted === true || vehicle.deleted_at !== undefined) return false;
      const driverId = String(vehicle.driver_id ?? "");
      return driverId === session.id || (matchingDriver && driverId === String(matchingDriver.id));
    });

    setDriverProfileRows(matchingDriver ? [matchingDriver] : []);
    setDriverVehicleRows(matchingVehicles);
  }, [session]);

  useEffect(() => {
    refreshDriverFleetData();
  }, [refreshDriverFleetData]);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const account = registerDriverAccount({
        username: registerForm.username,
        fullName: registerForm.fullName,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      });

      try {
        await fetch("/api/driver/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: account.email,
            code: account.verificationCode,
            fullName: account.fullName,
          }),
        });
      } catch {
        // Ignore email provider errors and keep the in-app demo code visible.
      }

      setPending(account);
      setScreen("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register driver account.");
    }
  }

  function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!pending) {
      setError("Please register again to receive a verification code.");
      setScreen("register");
      return;
    }

    try {
      const verified = verifyDriverAccount(pending.email, verificationCode);
      setSession(verified);
      setPending(null);
      setScreen("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    }
  }

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const account = loginDriverAccount(loginForm.loginId, loginForm.password);

      if (account.status === "pending") {
        setPending(account);
        setScreen("verify");
        return;
      }

      setSession(account);
      setScreen("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    }
  }

  function handleLogout() {
    clearDriverSession();
    setSession(null);
    setPending(null);
    setScreen("login");
  }

  function handleDeleteDriverProfile() {
    const profileId = driverProfileRows[0] ? String(driverProfileRows[0].id) : "";
    if (profileId) {
      deleteLocalDriverRecord(profileId, { preserveForAdmin: true });
      setDriverProfileRows([]);
    }
  }

  function handleDeleteVehicle(vehicleId: string) {
    deleteLocalVehicleRecord(vehicleId, { preserveForAdmin: true });
    setDriverVehicleRows((previous) => previous.filter((vehicle) => String(vehicle.id) !== vehicleId));
  }

  const isOnDashboard = screen === "dashboard" && session;
  const accountStatus = session?.status ?? "pending";
  const isAccountEnabled = accountStatus === "enabled";
  const statusLabel = accountStatus === "pending" ? "Account pending" : accountStatus === "suspended" ? "Account suspended" : "Account enabled";
  const statusClasses = accountStatus === "pending"
    ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
    : accountStatus === "suspended"
      ? "bg-red-100 text-red-700 ring-1 ring-red-200"
      : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  const vehicleStatusText = !isAccountEnabled
    ? accountStatus === "pending" ? "Pending approval" : "Access suspended"
    : driverVehicleRows.length > 0 ? "Active" : "Pending";

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-ink-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-900 text-brand-400">
              <Car className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-extrabold tracking-tight">
                <span className="text-ink-900">Taxi</span>{" "}
                <span className="text-ink-900">Logic</span>
                <span className="text-brand-500">Moov</span>
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Driver Portal</p>
            </div>
          </div>

          {session && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>

        {!session && screen !== "dashboard" && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Driver access</p>
              <h1 className="text-3xl font-black text-ink-900">Create your driver account</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">
                Register with a login ID and password, verify your email address, then activate your Taxi LogicMoov driver account.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-[#f7f3eb] p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-brand-500" />
                    <p className="text-sm font-semibold text-ink-800">Account approval</p>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    Your account is enabled only after email verification. No admin access is required.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f7f3eb] p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-brand-500" />
                    <p className="text-sm font-semibold text-ink-800">Email verification</p>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    We send a 6-digit code to your email address so the driver account can be activated securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex rounded-full bg-[#f3eee2] p-1">
                <button
                  type="button"
                  onClick={() => { setScreen("login"); setError(null); }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${screen === "login" ? "bg-ink-900 text-white" : "text-ink-700"}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setScreen("register"); setError(null); }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${screen === "register" ? "bg-ink-900 text-white" : "text-ink-700"}`}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {screen === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Login ID</span>
                    <input
                      value={loginForm.loginId}
                      onChange={(event) => setLoginForm((previous) => ({ ...previous, loginId: event.target.value }))}
                      placeholder="driver.username or email"
                      className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Password</span>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                        className="w-full rounded-xl border border-ink-200 px-3 py-2.5 pr-16 text-sm outline-none focus:border-brand-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((previous) => !previous)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-600 hover:text-ink-900"
                      >
                        {showLoginPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-ink-900 transition hover:bg-brand-400">
                    Sign in to driver portal
                  </button>
                </form>
              )}

              {screen === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Full name</span>
                    <input
                      value={registerForm.fullName}
                      onChange={(event) => setRegisterForm((previous) => ({ ...previous, fullName: event.target.value }))}
                      className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Create login ID</span>
                    <input
                      value={registerForm.username}
                      onChange={(event) => setRegisterForm((previous) => ({ ...previous, username: event.target.value }))}
                      placeholder="driveralex"
                      className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Email</span>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm((previous) => ({ ...previous, email: event.target.value }))}
                      className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Phone</span>
                    <input
                      value={registerForm.phone}
                      onChange={(event) => setRegisterForm((previous) => ({ ...previous, phone: event.target.value }))}
                      placeholder="+1 514 555 1247"
                      className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Password</span>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm((previous) => ({ ...previous, password: event.target.value }))}
                        className="w-full rounded-xl border border-ink-200 px-3 py-2.5 pr-16 text-sm outline-none focus:border-brand-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((previous) => !previous)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-600 hover:text-ink-900"
                      >
                        {showRegisterPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-ink-900 transition hover:bg-brand-400">
                    Create driver account
                  </button>
                </form>
              )}

              {screen === "verify" && pending && (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
                    <p className="font-semibold">Verification code sent to {pending.email}</p>
                    <p className="mt-1">Demo code: <span className="font-black">{pending.verificationCode}</span></p>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-ink-700">Enter verification code</span>
                    <input
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      required
                    />
                  </label>
                  <button type="submit" className="w-full rounded-xl bg-ink-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-ink-800">
                    Verify email & enable account
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {isOnDashboard && session && (
          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#e8e0d0] bg-[#f9f7f3] p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-500">Driver status</p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-ink-900">Welcome, {session.fullName}</h2>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${statusClasses}`}>
                  <CheckCircle2 className="h-4 w-4" />
                  {statusLabel}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-[#f1eee7] p-4 shadow-inner ring-1 ring-[#e7dfcf]">
                  <div className="flex items-center gap-2 text-ink-500">
                    <UserRound className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Login ID</span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-ink-900">{session.username}</p>
                </div>
                <div className="rounded-2xl bg-[#f1eee7] p-4 shadow-inner ring-1 ring-[#e7dfcf]">
                  <div className="flex items-center gap-2 text-ink-500">
                    <Mail className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Email</span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-ink-900">{session.email}</p>
                </div>
                <div className="rounded-2xl bg-[#f1eee7] p-4 shadow-inner ring-1 ring-[#e7dfcf]">
                  <div className="flex items-center gap-2 text-ink-500">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Phone</span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-ink-900">{session.phone}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#e8e0d0] bg-[#f9f7f3] p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-3xl font-extrabold tracking-[-0.04em] text-ink-900">Fleet profile</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDriverModal(true)}
                    className="rounded-xl bg-[#f6c64b] px-4 py-2 text-sm font-semibold text-ink-900 shadow-sm transition hover:bg-[#f0ba2d]"
                  >
                    Add Driver Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(true)}
                    className="rounded-xl border border-[#d8d0c1] bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    Add Vehicle
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-[#d5cab2] bg-[#f1eee7] p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-500">Profile status</p>
                    {driverProfileRows.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteDriverProfile}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-ink-900">{driverProfileRows.length > 0 ? "Ready" : "Pending"}</p>
                  <p className="mt-2 text-sm text-ink-600">
                    {driverProfileRows.length > 0
                      ? "Driver profile is saved and available in the fleet registry."
                      : "Add your driver profile so your details are visible in the fleet system."}
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-[#d5cab2] bg-[#f1eee7] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-500">Vehicle status</p>
                  <p className={`mt-4 text-4xl font-black tracking-[-0.05em] ${!isAccountEnabled ? "text-amber-600" : driverVehicleRows.length > 0 ? "text-brand-600" : "text-ink-900"}`}>
                    {vehicleStatusText}
                  </p>
                  <p className="mt-2 text-sm text-ink-600">
                    {!isAccountEnabled
                      ? accountStatus === "pending"
                        ? "Your account is waiting for admin approval before booking access is enabled."
                        : "Your driver account is currently suspended by the admin team."
                      : driverVehicleRows.length > 0
                        ? "Your vehicle is available for customers during booking."
                        : "Add a vehicle to make your fleet availability visible during booking."}
                  </p>
                </div>
              </div>

              {(driverProfileRows.length > 0 || driverVehicleRows.length > 0) && (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {driverProfileRows.length > 0 && (
                    <div className="rounded-2xl border border-[#e3d9c6] bg-[#f8f5f0] p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-500">Driver profile</h4>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-shrink-0">
                          {driverProfileRows[0].photo_url ? (
                            <img
                              src={String(driverProfileRows[0].photo_url)}
                              alt="Driver profile"
                              className="h-28 w-28 rounded-full border border-[#dcd2bf] object-cover shadow-sm sm:h-32 sm:w-32"
                            />
                          ) : (
                            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-[#d3cab6] bg-[#f1eee7] text-3xl text-ink-400 sm:h-32 sm:w-32">
                              👤
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 text-sm text-ink-700">
                          <p><span className="font-semibold">Full Name:</span> {String(driverProfileRows[0].full_name ?? session.fullName)}</p>
                          <p><span className="font-semibold">WhatsApp:</span> {String(driverProfileRows[0].whatsapp_number ?? session.phone)}</p>
                          <p><span className="font-semibold">Email:</span> {String(driverProfileRows[0].email ?? session.email)}</p>
                          <p><span className="font-semibold">License Number:</span> {String(driverProfileRows[0].license_number ?? "Not added")}</p>
                          <p><span className="font-semibold">License Expiry:</span> {String(driverProfileRows[0].license_expiry ?? "Not added")}</p>
                          <p><span className="font-semibold">Languages:</span> {Array.isArray(driverProfileRows[0].languages) && driverProfileRows[0].languages.length > 0 ? String(driverProfileRows[0].languages.join(", ")) : "Not added"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {driverVehicleRows.length > 0 && (
                    <div className="rounded-2xl border border-[#e3d9c6] bg-[#f8f5f0] p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-500">Vehicle information</h4>
                      <div className="mt-3 space-y-3">
                        {driverVehicleRows.map((vehicle) => {
                          const vehiclePhoto = Array.isArray(vehicle.photo_urls) && vehicle.photo_urls.length > 0 ? String(vehicle.photo_urls[0]) : "";
                          return (
                            <div key={String(vehicle.id)} className="rounded-xl border border-[#e3d9c6] bg-[#f1eee7] p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-[#d8d0c1] bg-white sm:h-32 sm:w-32">
                                    {vehiclePhoto ? (
                                      <img src={vehiclePhoto} alt={String(vehicle.model ?? "Vehicle")} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-2xl text-ink-400">🚕</div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-ink-900">
                                      {String(vehicle.brand ?? "Vehicle")} {String(vehicle.model ?? "")}
                                    </p>
                                    <p className="text-sm text-ink-600">
                                      {String(vehicle.vehicle_type ?? "SUV")} • {String(vehicle.plate_number ?? "N/A")}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVehicle(String(vehicle.id))}
                                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 className="h-3 w-3" /> Remove
                                </button>
                              </div>

                              <div className="mt-3 grid gap-2 text-sm text-ink-700 sm:grid-cols-2">
                                <p><span className="font-semibold">Plate Number:</span> {String(vehicle.plate_number ?? "Not added")}</p>
                                <p><span className="font-semibold">Vehicle Type:</span> {String(vehicle.vehicle_type ?? "Not added")}</p>
                                <p><span className="font-semibold">Brand:</span> {String(vehicle.brand ?? "Not added")}</p>
                                <p><span className="font-semibold">Model:</span> {String(vehicle.model ?? "Not added")}</p>
                                <p><span className="font-semibold">Year:</span> {String(vehicle.year ?? "Not added")}</p>
                                <p><span className="font-semibold">Color:</span> {String(vehicle.color ?? "Not added")}</p>
                                <p><span className="font-semibold">Seat Capacity:</span> {String(vehicle.seat_capacity ?? "Not added")}</p>
                                <p><span className="font-semibold">Luggage Capacity:</span> {String(vehicle.luggage_capacity ?? "Not added")}</p>
                                <p><span className="font-semibold">Electric Vehicle:</span> {vehicle.electric ? "Yes" : "No"}</p>
                                <p><span className="font-semibold">Features:</span> {Array.isArray(vehicle.inclusions) && vehicle.inclusions.length > 0 ? String(vehicle.inclusions.join(", ")) : "Not added"}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {showDriverModal && (
        <AddDriverModal
          onClose={() => setShowDriverModal(false)}
          onSaved={() => {
            setShowDriverModal(false);
            refreshDriverFleetData();
          }}
        />
      )}
      {showVehicleModal && (
        <AddVehicleModal
          driverId={driverProfileRows[0] ? String(driverProfileRows[0].id) : undefined}
          driverOptions={
            driverProfileRows.length > 0
              ? [{ id: String(driverProfileRows[0].id), fullName: String(driverProfileRows[0].full_name ?? session?.fullName ?? "Driver") }]
              : []
          }
          onClose={() => setShowVehicleModal(false)}
          onSaved={() => {
            setShowVehicleModal(false);
            refreshDriverFleetData();
          }}
        />
      )}
    </main>
  );
}
