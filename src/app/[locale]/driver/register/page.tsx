"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Upload, FileText, UserPlus, ChevronRight } from "lucide-react";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { COMPLIANCE_DOCUMENT_DEFINITIONS, type ComplianceDocumentId } from "@/lib/complianceDocuments";
import {
  createDriverAccount,
  getCurrentDriverApplication,
  saveDriverApplication,
  verifyDriverEmail,
} from "@/lib/driverOnboarding";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";

const CANADIAN_PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick",
  "Newfoundland and Labrador","Northwest Territories","Nova Scotia",
  "Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon",
];

const SESSION_KEY = "taxi_logicmoov_driver_session";

type DriverSession = { email: string; firstName: string; lastName: string };

function readSession(): DriverSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DriverSession) : null;
  } catch { return null; }
}

function writeSession(session: DriverSession) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle && typeof window !== "undefined") {
    const encoded = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return btoa(password);
}

type Step = "account" | "personal" | "documents" | "success";
type DocFiles = Record<ComplianceDocumentId, File | null>;


export default function DriverRegisterPage() {
  const { locale } = useParams<{ locale: string }>();

  const [step, setStep] = useState<Step>("account");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [session, setSession] = useState<DriverSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [personalForm, setPersonalForm] = useState({ phone: "", gender: "", address: "", city: "", province: "Quebec", postalCode: "" });
  const [docFiles, setDocFiles] = useState<DocFiles>({
    transport_licence: null, fleet_insurance: null, taxi_registration: null, mechanical_inspection: null,
  });

  // Restore session on mount
  useEffect(() => {
    const existingSession = readSession();
    if (!existingSession) return;
    const app = getCurrentDriverApplication();
    if (!app) { window.localStorage.removeItem(SESSION_KEY); return; }
    setSession(existingSession);
    if (app.status === "submitted" || app.status === "under_review" || app.status === "approved" || app.status === "pending_verification") {
      setStep("success"); return;
    }
    const hasPersonal = (app.personal?.city ?? "") !== "" || (app.personal?.residentialAddress ?? "") !== "";
    if (hasPersonal) {
      setPersonalForm({
        phone: app.account?.mobilePhone ?? app.personal?.mobilePhone ?? "",
        gender: app.personal?.gender ?? "",
        address: app.personal?.residentialAddress ?? "",
        city: app.personal?.city ?? "",
        province: app.personal?.province ?? "Quebec",
        postalCode: app.personal?.postalCode ?? "",
      });
      setStep("documents");
    } else { setStep("personal"); }
  }, []);

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.password || !regForm.confirmPassword) { setError("Please fill in all fields."); return; }
    if (regForm.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (regForm.password !== regForm.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const result = await createDriverAccount({
        firstName: regForm.firstName, lastName: regForm.lastName, email: regForm.email,
        mobilePhone: "", password: regForm.password,
        preferredLanguage: locale === "fr" ? "French" : "English",
        termsAccepted: true, privacyAccepted: true, agreementAccepted: true,
      });
      if (!result.ok) { setError(result.message); return; }
      verifyDriverEmail(regForm.email);
      const newSession: DriverSession = { email: regForm.email, firstName: regForm.firstName, lastName: regForm.lastName };
      writeSession(newSession); setSession(newSession); setStep("personal");
    } catch (err) { setError(err instanceof Error ? err.message : "Registration failed."); }
    finally { setLoading(false); }
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!loginForm.email || !loginForm.password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const loginEmail = loginForm.email.trim().toLowerCase();
      let firstName = ""; let lastName = ""; let authenticated = false;
      if (hasSupabaseConfig()) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginForm.password });
        if (!authError && data.user) {
          firstName = (data.user.user_metadata?.first_name as string | undefined) ?? "";
          lastName = (data.user.user_metadata?.last_name as string | undefined) ?? "";
          authenticated = true;
        }
      }
      if (!authenticated) {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem("taxi_logicmoov_driver_application") : null;
        const drafts = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
        const hash = await hashPassword(loginForm.password);
        const match = drafts.find((d) => String(d.email ?? "").toLowerCase() === loginEmail && d.passwordHash === hash);
        if (!match) { setError("Invalid email or password."); return; }
        firstName = String(match.firstName ?? ""); lastName = String(match.lastName ?? "");
      }
      const newSession: DriverSession = { email: loginEmail, firstName, lastName };
      writeSession(newSession); setSession(newSession);
      const app = getCurrentDriverApplication();
      if (app && (app.status === "submitted" || app.status === "under_review" || app.status === "approved" || app.status === "pending_verification")) {
        setStep("success");
      } else if (app && ((app.personal?.city ?? "") !== "" || (app.personal?.residentialAddress ?? "") !== "")) {
        setPersonalForm({
          phone: app.account?.mobilePhone ?? app.personal?.mobilePhone ?? "",
          gender: app.personal?.gender ?? "",
          address: app.personal?.residentialAddress ?? "",
          city: app.personal?.city ?? "",
          province: app.personal?.province ?? "Quebec",
          postalCode: app.personal?.postalCode ?? "",
        });
        setStep("documents");
      } else { setStep("personal"); }
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed."); }
    finally { setLoading(false); }
  };

  // Personal details
  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!personalForm.phone || !personalForm.gender || !personalForm.address || !personalForm.city || !personalForm.province || !personalForm.postalCode) {
      setError("Please fill in all required fields."); return;
    }
    saveDriverApplication({
      email: session?.email ?? "",
      personal: { firstName: session?.firstName ?? "", lastName: session?.lastName ?? "", email: session?.email ?? "", mobilePhone: personalForm.phone, gender: personalForm.gender, residentialAddress: personalForm.address, city: personalForm.city, province: personalForm.province, postalCode: personalForm.postalCode, country: "Canada" },
    });
    setStep("documents");
  };

  // Submit application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    const missing = COMPLIANCE_DOCUMENT_DEFINITIONS.filter((def) => !docFiles[def.id]);
    if (missing.length > 0) { setError(`Please upload: ${missing.map((m) => m.label).join(", ")}`); return; }
    setLoading(true);
    try {
      const documentEntries = await Promise.all(
        COMPLIANCE_DOCUMENT_DEFINITIONS.map(async (def) => {
          const file = docFiles[def.id]!;
          const dataUrl = await fileToDataUrl(file);
          return { label: def.label, fileName: file.name, mimeType: file.type || "application/octet-stream", dataUrl };
        })
      );
      await fetch("/api/driver/submit-application", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: session?.firstName ?? "", lastName: session?.lastName ?? "", email: session?.email ?? "", phone: personalForm.phone, gender: personalForm.gender, address: personalForm.address, city: personalForm.city, province: personalForm.province, postalCode: personalForm.postalCode, documents: documentEntries }),
      });
      saveDriverApplication({ email: session?.email ?? "", status: "submitted" });
      setStep("success");
    } catch (err) { setError(err instanceof Error ? err.message : "Submission failed. Please try again."); }
    finally { setLoading(false); }
  };

  const STEPS: { key: Step; label: string }[] = [
    { key: "account", label: "Account" },
    { key: "personal", label: "Personal Details" },
    { key: "documents", label: "Documents" },
  ];
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <DriverPortalLayout
      locale={String(locale)}
      active="register"
      title={step === "account" ? (authMode === "register" ? "Create driver account" : "Sign in to your account") : step === "personal" ? "Personal details" : step === "documents" ? "Upload required documents" : "Application submitted"}
      subtitle={step === "account" ? "Register or sign in to continue your driver application." : step === "personal" ? "Tell us a bit about yourself." : step === "documents" ? "Upload the 4 mandatory SAAQ compliance documents." : undefined}
    >
      {/* Step indicator */}
      {step !== "success" && (
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${i < stepIndex ? "bg-emerald-500 text-white" : i === stepIndex ? "bg-[#111827] text-white" : "border-2 border-slate-200 bg-white text-slate-400"}`}>
                {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm font-semibold ${i === stepIndex ? "text-[#111827]" : "text-slate-400"}`}>{s.label}</span>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1 – Account */}
      {step === "account" && (
        <div className="space-y-6">
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => { setAuthMode("register"); setError(null); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${authMode === "register" ? "bg-white shadow-sm text-[#111827]" : "text-slate-500 hover:text-slate-700"}`}>
              <UserPlus className="h-4 w-4" /> Register
            </button>
            <button type="button" onClick={() => { setAuthMode("login"); setError(null); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${authMode === "login" ? "bg-white shadow-sm text-[#111827]" : "text-slate-500 hover:text-slate-700"}`}>
              Sign In
            </button>
          </div>

          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name" required><input value={regForm.firstName} onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })} className={inputCls} required /></Field>
                <Field label="Last Name" required><input value={regForm.lastName} onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })} className={inputCls} required /></Field>
              </div>
              <Field label="Email Address" required><input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} className={inputCls} autoComplete="email" required /></Field>
              <Field label="Password" required><input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} className={inputCls} minLength={8} required /></Field>
              <Field label="Confirm Password" required><input type="password" value={regForm.confirmPassword} onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })} className={inputCls} minLength={8} required /></Field>
              <div className="flex justify-end pt-1">
                <button type="submit" disabled={loading} className="rounded-xl bg-[#111827] px-6 py-3 text-sm font-bold text-white hover:bg-[#1f2937] disabled:opacity-60">
                  {loading ? "Creating account…" : "Create Account & Continue →"}
                </button>
              </div>
            </form>
          )}

          {authMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email Address" required><input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className={inputCls} autoComplete="email" required /></Field>
              <Field label="Password" required><input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className={inputCls} autoComplete="current-password" required /></Field>
              <div className="flex justify-end pt-1">
                <button type="submit" disabled={loading} className="rounded-xl bg-[#111827] px-6 py-3 text-sm font-bold text-white hover:bg-[#1f2937] disabled:opacity-60">
                  {loading ? "Signing in…" : "Sign In & Continue →"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Step 2 – Personal details */}
      {step === "personal" && (
        <form onSubmit={handlePersonalSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone Number" required><input type="tel" value={personalForm.phone} onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} className={inputCls} required /></Field>
            <Field label="Gender" required>
              <select value={personalForm.gender} onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })} className={inputCls} required>
                <option value="">Select…</option>
                <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
              </select>
            </Field>
          </div>
          <Field label="Street Address" required><input value={personalForm.address} onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })} className={inputCls} required /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" required><input value={personalForm.city} onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })} className={inputCls} required /></Field>
            <Field label="Province" required>
              <select value={personalForm.province} onChange={(e) => setPersonalForm({ ...personalForm, province: e.target.value })} className={inputCls}>
                {CANADIAN_PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Postal Code" required><input value={personalForm.postalCode} onChange={(e) => setPersonalForm({ ...personalForm, postalCode: e.target.value })} className={inputCls} required /></Field>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="rounded-xl bg-[#111827] px-6 py-3 text-sm font-bold text-white hover:bg-[#1f2937]">
              Next: Upload Documents →
            </button>
          </div>
        </form>
      )}

      {/* Step 3 – Documents */}
      {step === "documents" && (
        <form onSubmit={handleSubmitApplication} className="space-y-5">
          <p className="text-sm text-slate-500">All 4 documents are mandatory. Accepted formats: PDF, JPG, PNG.</p>

          {Object.values(docFiles).every(Boolean) && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" /> All 4 documents uploaded — ready to submit!
              </span>
              <button type="submit" disabled={loading} className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                {loading ? "Submitting…" : "Submit →"}
              </button>
            </div>
          )}

          <div className="grid gap-4">
            {COMPLIANCE_DOCUMENT_DEFINITIONS.map((def) => {
              const file = docFiles[def.id];
              return (
                <div key={def.id} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f5f9]">
                        <FileText className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{def.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {file ? <span className="font-medium text-emerald-600">✓ {file.name}</span> : "Not uploaded"}
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1d4ed8] hover:bg-[#f0f7ff]">
                      <Upload className="h-4 w-4" />
                      {file ? "Replace" : "Upload Document"}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={(e) => { const picked = e.target.files?.[0] ?? null; setDocFiles((prev) => ({ ...prev, [def.id]: picked })); }} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={() => setStep("personal")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              ← Back
            </button>
            <button type="submit" disabled={loading} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
              {loading ? "Submitting…" : "Submit Application ✓"}
            </button>
          </div>
        </form>
      )}

      {/* Step 4 – Success */}
      {step === "success" && (
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#111827]">Application Submitted Successfully!</h2>
            <p className="mt-3 max-w-md text-sm text-slate-600">
              Thank you, <strong>{session?.firstName}</strong>! We have received your application and documents. Our team will review them and reach out at{" "}
              <strong>{session?.email}</strong>.
            </p>
          </div>
          <Link href={`/${locale}`} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Return to Home
          </Link>
        </div>
      )}
    </DriverPortalLayout>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block${className ? ` ${className}` : ""}`}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}{required && <span className="ml-0.5 text-red-500">*</span>}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dfeafc]";
