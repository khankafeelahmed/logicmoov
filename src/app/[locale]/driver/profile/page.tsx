"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getCurrentDriverApplication, saveDriverApplication, type DriverApplicationDraft } from "@/lib/driverOnboarding";

export default function DriverProfilePage() {
  const { locale } = useParams<{ locale: string }>();
  const [draft, setDraft] = useState<DriverApplicationDraft | null>(null);

  useEffect(() => {
    setDraft(getCurrentDriverApplication());
  }, []);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    preferredName: "",
    dateOfBirth: "",
    email: "",
    mobilePhone: "",
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

  useEffect(() => {
    if (!draft) return;
    setForm({
      firstName: draft.personal?.firstName ?? draft.firstName ?? "",
      middleName: draft.personal?.middleName ?? "",
      lastName: draft.personal?.lastName ?? draft.lastName ?? "",
      preferredName: draft.personal?.preferredName ?? "",
      dateOfBirth: draft.personal?.dateOfBirth ?? "",
      email: draft.personal?.email ?? draft.email ?? "",
      mobilePhone: draft.personal?.mobilePhone ?? draft.account?.mobilePhone ?? "",
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
  }, [draft]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = saveDriverApplication({
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      fullName: `${form.firstName} ${form.lastName}`.trim(),
      account: {
        email: form.email,
        mobilePhone: form.mobilePhone,
        preferredLanguage: draft?.account?.preferredLanguage ?? "English",
        termsAccepted: draft?.account?.termsAccepted ?? false,
        privacyAccepted: draft?.account?.privacyAccepted ?? false,
        agreementAccepted: draft?.account?.agreementAccepted ?? false,
        emailVerified: draft?.account?.emailVerified ?? false,
      },
      personal: { ...draft?.personal, ...form },
    });
    window.localStorage.setItem("driver_profile_last_saved", JSON.stringify(next));
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="profile" title="Driver profile" subtitle="Add your important personal and emergency contact details.">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="First Name"><input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className={inputClass} /></Field>
        <Field label="Middle Name (optional)"><input value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} className={inputClass} /></Field>
        <Field label="Last Name"><input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={inputClass} /></Field>
        <Field label="Preferred Name (optional)"><input value={form.preferredName} onChange={(event) => setForm({ ...form, preferredName: event.target.value })} className={inputClass} /></Field>
        <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} className={inputClass} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></Field>
        <Field label="Mobile Phone"><input value={form.mobilePhone} onChange={(event) => setForm({ ...form, mobilePhone: event.target.value })} className={inputClass} /></Field>
        <Field label="Alternate Phone"><input value={form.alternatePhone} onChange={(event) => setForm({ ...form, alternatePhone: event.target.value })} className={inputClass} /></Field>
        <Field label="Residential Address" className="md:col-span-2"><input value={form.residentialAddress} onChange={(event) => setForm({ ...form, residentialAddress: event.target.value })} className={`${inputClass} w-full`} /></Field>
        <Field label="City"><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={inputClass} /></Field>
        <Field label="Province"><input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className={inputClass} /></Field>
        <Field label="Postal Code"><input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} className={inputClass} /></Field>
        <Field label="Country"><input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className={inputClass} /></Field>
        <Field label="Emergency Contact Name"><input value={form.emergencyContactName} onChange={(event) => setForm({ ...form, emergencyContactName: event.target.value })} className={inputClass} /></Field>
        <Field label="Emergency Contact Phone"><input value={form.emergencyContactPhone} onChange={(event) => setForm({ ...form, emergencyContactPhone: event.target.value })} className={inputClass} /></Field>
        <Field label="Relationship"><input value={form.emergencyContactRelationship} onChange={(event) => setForm({ ...form, emergencyContactRelationship: event.target.value })} className={inputClass} /></Field>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Save profile</button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className ? `block ${className}` : "block"}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dfeafc]";
