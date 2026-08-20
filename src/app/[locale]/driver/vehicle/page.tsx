"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getCurrentDriverApplication, saveDriverApplication, type DriverApplicationDraft } from "@/lib/driverOnboarding";

export default function DriverVehiclePage() {
  const { locale } = useParams<{ locale: string }>();
  const [draft, setDraft] = useState<DriverApplicationDraft | null>(null);

  useEffect(() => {
    setDraft(getCurrentDriverApplication());
  }, []);

  const [form, setForm] = useState({
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
    setForm({
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    saveDriverApplication({
      email: draft?.email ?? "",
      vehicle: { ...draft?.vehicle, ...form },
    });
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="vehicle" title="Vehicle information" subtitle="Add the vehicle used for fare bookings and driver services.">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Vehicle category"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass}><option>Standard</option><option>SUV</option><option>Van 7</option><option>Van 8/9</option><option>Premium</option></select></Field>
        <Field label="Vehicle make"><input value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} className={inputClass} /></Field>
        <Field label="Vehicle model"><input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} className={inputClass} /></Field>
        <Field label="Vehicle year"><input value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} className={inputClass} /></Field>
        <Field label="Vehicle colour"><input value={form.colour} onChange={(event) => setForm({ ...form, colour: event.target.value })} className={inputClass} /></Field>
        <Field label="Licence plate"><input value={form.licencePlate} onChange={(event) => setForm({ ...form, licencePlate: event.target.value })} className={inputClass} /></Field>
        <Field label="Province"><input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className={inputClass} /></Field>
        <Field label="VIN"><input value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value })} className={inputClass} /></Field>
        <Field label="Passenger capacity"><input value={form.passengerCapacity} onChange={(event) => setForm({ ...form, passengerCapacity: event.target.value })} className={inputClass} /></Field>
        <Field label="Luggage capacity"><input value={form.luggageCapacity} onChange={(event) => setForm({ ...form, luggageCapacity: event.target.value })} className={inputClass} /></Field>
        <Field label="Registration number"><input value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} className={inputClass} /></Field>
        <Field label="Registration expiry date"><input type="date" value={form.registrationExpiryDate} onChange={(event) => setForm({ ...form, registrationExpiryDate: event.target.value })} className={inputClass} /></Field>
        <Field label="Insurance company"><input value={form.insuranceCompany} onChange={(event) => setForm({ ...form, insuranceCompany: event.target.value })} className={inputClass} /></Field>
        <Field label="Policy number"><input value={form.policyNumber} onChange={(event) => setForm({ ...form, policyNumber: event.target.value })} className={inputClass} /></Field>
        <Field label="Insurance expiry date"><input type="date" value={form.insuranceExpiryDate} onChange={(event) => setForm({ ...form, insuranceExpiryDate: event.target.value })} className={inputClass} /></Field>
        <Field label="Commercial / taxi permit info" className="md:col-span-2"><input value={form.permitInfo} onChange={(event) => setForm({ ...form, permitInfo: event.target.value })} className={`${inputClass} w-full`} /></Field>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white">Save vehicle</button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className ? `block ${className}` : "block"}><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dfeafc]";
