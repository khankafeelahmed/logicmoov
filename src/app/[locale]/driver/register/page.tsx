"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { createDriverAccount, getCurrentDriverApplication, saveDriverApplication, verifyDriverEmail, type DriverApplicationDraft } from "@/lib/driverOnboarding";

const stepTitles = [
  "Create account",
  "Personal information",
  "Identity verification",
  "Work eligibility",
  "Driver licence",
  "Vehicle registration",
  "Review & submit",
];

export default function DriverRegisterPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<DriverApplicationDraft | null>(null);

  useEffect(() => {
    setDraft(getCurrentDriverApplication());
  }, []);

  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobilePhone: "",
    password: "",
    preferredLanguage: "English",
    termsAccepted: false,
    privacyAccepted: false,
    agreementAccepted: false,
  });
  const [personalForm, setPersonalForm] = useState({
    middleName: "",
    preferredName: "",
    dateOfBirth: "",
    alternatePhone: "",
    residentialAddress: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });
  const [workForm, setWorkForm] = useState({
    status: "Canadian Citizen",
    documentType: "Passport",
    expiryDate: "",
  });
  const [licenceForm, setLicenceForm] = useState({
    licenceNumber: "",
    province: "Quebec",
    licenceClass: "Class 5",
    issueDate: "",
    expiryDate: "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    category: "SUV",
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    colour: "",
    licencePlate: "",
    province: "Quebec",
    vin: "",
    passengerCapacity: "4",
    luggageCapacity: "4",
    registrationNumber: "",
    registrationExpiryDate: "",
    permitInfo: "",
    insuranceCompany: "",
    policyNumber: "",
    insuranceExpiryDate: "",
  });

  useEffect(() => {
    if (!draft) return;
    setAccountForm({
      firstName: draft.firstName ?? "",
      lastName: draft.lastName ?? "",
      email: draft.email ?? "",
      mobilePhone: draft.account?.mobilePhone ?? "",
      password: "",
      preferredLanguage: draft.account?.preferredLanguage ?? "English",
      termsAccepted: draft.account?.termsAccepted ?? false,
      privacyAccepted: draft.account?.privacyAccepted ?? false,
      agreementAccepted: draft.account?.agreementAccepted ?? false,
    });
    setPersonalForm({
      middleName: draft.personal?.middleName ?? "",
      preferredName: draft.personal?.preferredName ?? "",
      dateOfBirth: draft.personal?.dateOfBirth ?? "",
      alternatePhone: draft.personal?.alternatePhone ?? "",
      residentialAddress: draft.personal?.residentialAddress ?? "",
      city: draft.personal?.city ?? "",
      province: draft.personal?.province ?? "",
      postalCode: draft.personal?.postalCode ?? "",
      country: draft.personal?.country ?? "Canada",
      emergencyContactName: draft.personal?.emergencyContactName ?? "",
      emergencyContactPhone: draft.personal?.emergencyContactPhone ?? "",
      emergencyContactRelationship: draft.personal?.emergencyContactRelationship ?? "",
    });
    setWorkForm({
      status: draft.workEligibility?.status ?? "Canadian Citizen",
      documentType: draft.workEligibility?.documentType ?? "Passport",
      expiryDate: draft.workEligibility?.expiryDate ?? "",
    });
    setLicenceForm({
      licenceNumber: draft.licence?.licenceNumber ?? "",
      province: draft.licence?.province ?? "Quebec",
      licenceClass: draft.licence?.licenceClass ?? "Class 5",
      issueDate: draft.licence?.issueDate ?? "",
      expiryDate: draft.licence?.expiryDate ?? "",
    });
    setVehicleForm({
      category: draft.vehicle?.category ?? "SUV",
      make: draft.vehicle?.make ?? "",
      model: draft.vehicle?.model ?? "",
      year: draft.vehicle?.year ?? new Date().getFullYear().toString(),
      colour: draft.vehicle?.colour ?? "",
      licencePlate: draft.vehicle?.licencePlate ?? "",
      province: draft.vehicle?.province ?? "Quebec",
      vin: draft.vehicle?.vin ?? "",
      passengerCapacity: draft.vehicle?.passengerCapacity ?? "4",
      luggageCapacity: draft.vehicle?.luggageCapacity ?? "4",
      registrationNumber: draft.vehicle?.registrationNumber ?? "",
      registrationExpiryDate: draft.vehicle?.registrationExpiryDate ?? "",
      permitInfo: draft.vehicle?.permitInfo ?? "",
      insuranceCompany: draft.vehicle?.insuranceCompany ?? "",
      policyNumber: draft.vehicle?.policyNumber ?? "",
      insuranceExpiryDate: draft.vehicle?.insuranceExpiryDate ?? "",
    });
  }, [draft]);

  const stepIndex = useMemo(() => Math.min(step, stepTitles.length - 1), [step]);

  const persistDraft = (nextStep: number, overrides?: Partial<Record<string, unknown>>) => {
    const app = saveDriverApplication({
      email: accountForm.email,
      firstName: accountForm.firstName,
      lastName: accountForm.lastName,
      fullName: `${accountForm.firstName} ${accountForm.lastName}`.trim(),
      account: {
        email: accountForm.email,
        mobilePhone: accountForm.mobilePhone,
        preferredLanguage: accountForm.preferredLanguage,
        termsAccepted: accountForm.termsAccepted,
        privacyAccepted: accountForm.privacyAccepted,
        agreementAccepted: accountForm.agreementAccepted,
        emailVerified: true,
      },
      personal: {
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        email: accountForm.email,
        mobilePhone: accountForm.mobilePhone,
        ...personalForm,
      },
      workEligibility: { ...workForm },
      licence: { ...licenceForm },
      vehicle: { ...vehicleForm },
      ...overrides,
    });
    setDraft(app);
    setStep(nextStep);
  };

  const handleAccountSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!accountForm.firstName || !accountForm.lastName || !accountForm.email || !accountForm.mobilePhone || !accountForm.password) {
      setStatus("Please complete all required account fields.");
      return;
    }
    if (accountForm.password.length < 8) {
      setStatus("Password must be at least 8 characters long.");
      return;
    }
    if (accountForm.password !== accountForm.password) {
      setStatus("Passwords do not match.");
      return;
    }
    if (!accountForm.termsAccepted || !accountForm.privacyAccepted || !accountForm.agreementAccepted) {
      setStatus("Please accept the required terms and policy agreements.");
      return;
    }

    const result = await createDriverAccount(accountForm);
    if (!result.ok) {
      setStatus(result.message);
      return;
    }
    setDraft(result.draft ?? null);
    setStatus(result.message);
    setStep(1);
  };

  const handleVerifyEmail = () => {
    if (!draft?.email) {
      setStatus("Create an account first.");
      return;
    }
    const verified = verifyDriverEmail(draft.email);
    if (verified) {
      setDraft(verified);
      setStatus("Email verified. You can now continue with the application.");
    }
  };

  const handleFinalSubmit = () => {
    if (!draft) {
      setStatus("Create an account first.");
      return;
    }
    const submitted = saveDriverApplication({
      id: draft.id,
      email: draft.email,
      status: "pending_verification",
      account: { ...draft.account, emailVerified: true },
      personal: { ...draft.personal },
      workEligibility: { ...draft.workEligibility },
      licence: { ...draft.licence },
      vehicle: { ...draft.vehicle },
    });
    setDraft(submitted);
    setStatus("Application submitted for verification.");
    router.push(`/${locale}/driver/status`);
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="register" title="Driver registration" subtitle="Create a driver account and complete the LogicMoov onboarding workflow.">
      <div className="mb-6 flex flex-wrap gap-2">
        {stepTitles.map((title, index) => (
          <div key={title} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${index === stepIndex ? "border-[#1d4ed8] bg-[#dfeafc] text-[#1d4ed8]" : "border-slate-200 bg-white text-slate-500"}`}>
            {index + 1}. {title}
          </div>
        ))}
      </div>

      {status && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{status}</div>}

      {step === 0 && (
        <form onSubmit={handleAccountSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First Name" required><input value={accountForm.firstName} onChange={(event) => setAccountForm({ ...accountForm, firstName: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Last Name" required><input value={accountForm.lastName} onChange={(event) => setAccountForm({ ...accountForm, lastName: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Email" required><input type="email" value={accountForm.email} onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Mobile Phone" required><input value={accountForm.mobilePhone} onChange={(event) => setAccountForm({ ...accountForm, mobilePhone: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Password" required><input type="password" value={accountForm.password} onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Preferred Language"><select value={accountForm.preferredLanguage} onChange={(event) => setAccountForm({ ...accountForm, preferredLanguage: event.target.value })} className={fieldClassName}><option>English</option><option>French</option><option>Arabic</option><option>Spanish</option></select></Field>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountForm.termsAccepted} onChange={(event) => setAccountForm({ ...accountForm, termsAccepted: event.target.checked })} /> Terms & Conditions accepted</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountForm.privacyAccepted} onChange={(event) => setAccountForm({ ...accountForm, privacyAccepted: event.target.checked })} /> Privacy Policy accepted</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountForm.agreementAccepted} onChange={(event) => setAccountForm({ ...accountForm, agreementAccepted: event.target.checked })} /> Driver Agreement accepted</label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="rounded-xl bg-[#f5c84d] px-5 py-3 text-sm font-bold text-[#111827] hover:bg-[#f0b72b]">Create account</button>
          </div>
        </form>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Middle Name"><input value={personalForm.middleName} onChange={(event) => setPersonalForm({ ...personalForm, middleName: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Preferred Name"><input value={personalForm.preferredName} onChange={(event) => setPersonalForm({ ...personalForm, preferredName: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Date of Birth"><input type="date" value={personalForm.dateOfBirth} onChange={(event) => setPersonalForm({ ...personalForm, dateOfBirth: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Alternate Phone"><input value={personalForm.alternatePhone} onChange={(event) => setPersonalForm({ ...personalForm, alternatePhone: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Residential Address" className="md:col-span-2"><input value={personalForm.residentialAddress} onChange={(event) => setPersonalForm({ ...personalForm, residentialAddress: event.target.value })} className={fieldClassName} /></Field>
            <Field label="City"><input value={personalForm.city} onChange={(event) => setPersonalForm({ ...personalForm, city: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Province"><input value={personalForm.province} onChange={(event) => setPersonalForm({ ...personalForm, province: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Postal Code"><input value={personalForm.postalCode} onChange={(event) => setPersonalForm({ ...personalForm, postalCode: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Country"><input value={personalForm.country} onChange={(event) => setPersonalForm({ ...personalForm, country: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Emergency Contact Name"><input value={personalForm.emergencyContactName} onChange={(event) => setPersonalForm({ ...personalForm, emergencyContactName: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Emergency Contact Phone"><input value={personalForm.emergencyContactPhone} onChange={(event) => setPersonalForm({ ...personalForm, emergencyContactPhone: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Relationship"><input value={personalForm.emergencyContactRelationship} onChange={(event) => setPersonalForm({ ...personalForm, emergencyContactRelationship: event.target.value })} className={fieldClassName} /></Field>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(0)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
            <button type="button" onClick={() => persistDraft(2)} className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-lg font-bold text-slate-800">Identity verification</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FileUploadCard label="Government-issued photo ID #1" />
              <FileUploadCard label="Government-issued photo ID #2" />
              <FileUploadCard label="Driver’s licence" />
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
            <button type="button" onClick={() => persistDraft(3)} className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Work authorization status"><select value={workForm.status} onChange={(event) => setWorkForm({ ...workForm, status: event.target.value })} className={fieldClassName}><option>Canadian Citizen</option><option>Permanent Resident</option><option>Work Permit</option><option>Other legally authorized status</option></select></Field>
            <Field label="Authorization / document type"><input value={workForm.documentType} onChange={(event) => setWorkForm({ ...workForm, documentType: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Document expiry date" className="md:col-span-2"><input type="date" value={workForm.expiryDate} onChange={(event) => setWorkForm({ ...workForm, expiryDate: event.target.value })} className={fieldClassName} /></Field>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
            <button type="button" onClick={() => persistDraft(4)} className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Continue</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Licence Number"><input value={licenceForm.licenceNumber} onChange={(event) => setLicenceForm({ ...licenceForm, licenceNumber: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Province / Territory"><input value={licenceForm.province} onChange={(event) => setLicenceForm({ ...licenceForm, province: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Licence Class"><input value={licenceForm.licenceClass} onChange={(event) => setLicenceForm({ ...licenceForm, licenceClass: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Issue Date"><input type="date" value={licenceForm.issueDate} onChange={(event) => setLicenceForm({ ...licenceForm, issueDate: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Expiry Date" className="md:col-span-2"><input type="date" value={licenceForm.expiryDate} onChange={(event) => setLicenceForm({ ...licenceForm, expiryDate: event.target.value })} className={fieldClassName} /></Field>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(3)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
            <button type="button" onClick={() => persistDraft(5)} className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Continue</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Vehicle Category"><select value={vehicleForm.category} onChange={(event) => setVehicleForm({ ...vehicleForm, category: event.target.value })} className={fieldClassName}><option>Standard</option><option>SUV</option><option>Van 7</option><option>Van 8/9</option><option>Premium</option></select></Field>
            <Field label="Vehicle Make"><input value={vehicleForm.make} onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Vehicle Model"><input value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Vehicle Year"><input value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Vehicle Colour"><input value={vehicleForm.colour} onChange={(event) => setVehicleForm({ ...vehicleForm, colour: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Licence Plate"><input value={vehicleForm.licencePlate} onChange={(event) => setVehicleForm({ ...vehicleForm, licencePlate: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Province"><input value={vehicleForm.province} onChange={(event) => setVehicleForm({ ...vehicleForm, province: event.target.value })} className={fieldClassName} /></Field>
            <Field label="VIN"><input value={vehicleForm.vin} onChange={(event) => setVehicleForm({ ...vehicleForm, vin: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Passenger Capacity"><input value={vehicleForm.passengerCapacity} onChange={(event) => setVehicleForm({ ...vehicleForm, passengerCapacity: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Luggage Capacity"><input value={vehicleForm.luggageCapacity} onChange={(event) => setVehicleForm({ ...vehicleForm, luggageCapacity: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Registration Number"><input value={vehicleForm.registrationNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, registrationNumber: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Registration Expiry Date"><input type="date" value={vehicleForm.registrationExpiryDate} onChange={(event) => setVehicleForm({ ...vehicleForm, registrationExpiryDate: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Insurance Company"><input value={vehicleForm.insuranceCompany} onChange={(event) => setVehicleForm({ ...vehicleForm, insuranceCompany: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Policy Number"><input value={vehicleForm.policyNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, policyNumber: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Insurance Expiry Date"><input type="date" value={vehicleForm.insuranceExpiryDate} onChange={(event) => setVehicleForm({ ...vehicleForm, insuranceExpiryDate: event.target.value })} className={fieldClassName} /></Field>
            <Field label="Commercial / Taxi Permit info" className="md:col-span-2"><input value={vehicleForm.permitInfo} onChange={(event) => setVehicleForm({ ...vehicleForm, permitInfo: event.target.value })} className={fieldClassName} /></Field>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(4)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
            <button type="button" onClick={() => persistDraft(6)} className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Review application</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-800">Review your application</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SummaryItem label="Name" value={`${accountForm.firstName} ${accountForm.lastName}`} />
              <SummaryItem label="Email" value={accountForm.email} />
              <SummaryItem label="Phone" value={accountForm.mobilePhone} />
              <SummaryItem label="Status" value="Pending Verification" />
              <SummaryItem label="Work authorization" value={workForm.status} />
              <SummaryItem label="Vehicle" value={`${vehicleForm.make} ${vehicleForm.model} • ${vehicleForm.category}`} />
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(5)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
            <button type="button" onClick={handleFinalSubmit} className="rounded-xl bg-[#f5c84d] px-5 py-3 text-sm font-bold text-[#111827]">Submit application</button>
          </div>
        </div>
      )}

      {draft && draft.account.emailVerified === false && (
        <div className="mt-6 rounded-2xl border border-[#dfeafc] bg-[#eef5ff] p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-800">Verify your email before final submission.</p>
          <p className="mt-2">A verification email is required before your application can be submitted for review.</p>
          <button type="button" onClick={handleVerifyEmail} className="mt-3 rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white">Verify email</button>
        </div>
      )}
    </DriverPortalLayout>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-800">{value}</p></div>;
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={className ? `block ${className}` : "block"}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
    </label>
  );
}

function FileUploadCard({ label }: { label: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 hover:border-[#1d4ed8] hover:bg-[#f8fbff]">
      <span className="font-semibold text-slate-800">{label}</span>
      <input type="file" className="hidden" />
      <span className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Upload</span>
    </label>
  );
}

const fieldClassName = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dfeafc]";
