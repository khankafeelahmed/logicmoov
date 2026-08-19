"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DriverPortalLayout from "@/components/driver/DriverPortalLayout";
import { getDriverPortalSession, getDriverVehicle, saveDriverVehicle } from "@/lib/driverPortal";

export default function DriverVehiclePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    colour: "",
    license_plate: "",
    vin: "",
    passenger_capacity: "4",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!getDriverPortalSession()) {
      router.replace(`/${locale}/driver/login`);
      return;
    }

    void loadVehicle();
  }, [locale, router]);

  const loadVehicle = async () => {
    const vehicle = await getDriverVehicle();
    if (!vehicle) return;

    setForm({
      make: String(vehicle.make || ""),
      model: String(vehicle.model || ""),
      year: String(vehicle.year || new Date().getFullYear()),
      colour: String(vehicle.colour || ""),
      license_plate: String(vehicle.license_plate || ""),
      vin: String(vehicle.vin || ""),
      passenger_capacity: String(vehicle.passenger_capacity || "4"),
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);

    try {
      await saveDriverVehicle({
        make: form.make,
        model: form.model,
        year: Number(form.year),
        colour: form.colour,
        license_plate: form.license_plate,
        vin: form.vin,
        passenger_capacity: Number(form.passenger_capacity),
      });
      setStatus("Vehicle information saved successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save vehicle information.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DriverPortalLayout locale={String(locale)} active="vehicle" title="Vehicle Information" subtitle="Keep your vehicle details simple and up to date.">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        {status && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div>}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Vehicle Make</span>
            <input value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Vehicle Model</span>
            <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Vehicle Year</span>
            <input type="number" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Vehicle Colour</span>
            <input value={form.colour} onChange={(event) => setForm({ ...form, colour: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Licence Plate</span>
            <input value={form.license_plate} onChange={(event) => setForm({ ...form, license_plate: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">VIN</span>
            <input value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Number of Passenger Seats</span>
            <input type="number" value={form.passenger_capacity} onChange={(event) => setForm({ ...form, passenger_capacity: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            {isSaving ? "Saving..." : "Save Vehicle Information"}
          </button>
        </div>
      </form>
    </DriverPortalLayout>
  );
}
