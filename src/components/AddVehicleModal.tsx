"use client";

import { useState } from "react";
import { saveVehicleRecord, supabase } from "@/lib/supabaseClient";
import { INCLUSION_OPTIONS, type VehicleType } from "@/types/fleet";

interface AddVehicleModalProps {
  driverId?: string;
  driverOptions?: Array<{ id: string; fullName: string }>;
  onClose: () => void;
  onSaved?: () => void;
}

const VEHICLE_TYPES: VehicleType[] = ["SEDAN", "SUV", "VAN", "MINIBUS", "LUXURY"];
const MAX_PHOTOS = 3;
const MAX_FILE_MB = 5;

export default function AddVehicleModal({ driverId, driverOptions = [], onClose, onSaved }: AddVehicleModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(driverId ?? driverOptions[0]?.id);
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SEDAN");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [color, setColor] = useState("");
  const [seatCapacity, setSeatCapacity] = useState("4");
  const [luggageCapacity, setLuggageCapacity] = useState("4");
  const [electric, setElectric] = useState(false);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleInclusion = (label: string) => {
    setInclusions((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const handlePhotoAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const valid = files.filter((file) => file.size <= MAX_FILE_MB * 1024 * 1024);
    setPhotos((prev) => [...prev, ...valid].slice(0, MAX_PHOTOS));
    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!plateNumber || !vehicleType || !brand || !model || !seatCapacity) {
      setError("Please fill in all required fields marked with *.");
      return;
    }
    if (inclusions.length === 0) {
      setError("Please select at least one inclusion — only select features your vehicle actually provides.");
      return;
    }

    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of photos) {
        const path = `vehicles/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("fleet-photos").upload(path, file);
        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from("fleet-photos").getPublicUrl(path);
        photoUrls.push(publicUrl.publicUrl);
      }

      const { error: insertError } = await saveVehicleRecord({
        driver_id: selectedDriverId ?? driverId ?? null,
        plate_number: plateNumber,
        vehicle_type: vehicleType,
        brand,
        model,
        year: year ? Number(year) : null,
        color: color || null,
        seat_capacity: Number(seatCapacity),
        luggage_capacity: luggageCapacity ? Number(luggageCapacity) : null,
        electric,
        inclusions,
        photo_urls: photoUrls,
      });

      if (insertError) throw insertError;

      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong while saving the vehicle.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-[#FAF6EE] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E7DFCF] px-6 py-5">
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Add Vehicle</h2>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-gray-500 hover:text-gray-800">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {driverOptions.length > 0 && (
            <div className="mb-4">
              <Field label="Assign to driver">
                <select
                  className={fieldInputClassName}
                  value={selectedDriverId ?? ""}
                  onChange={(event) => setSelectedDriverId(event.target.value || undefined)}
                >
                  <option value="">Unassigned</option>
                  {driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.fullName}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Plate Number" required>
              <input className={fieldInputClassName} value={plateNumber} onChange={(event) => setPlateNumber(event.target.value)} />
            </Field>

            <Field label="Vehicle Type" required>
              <select className={fieldInputClassName} value={vehicleType} onChange={(event) => setVehicleType(event.target.value as VehicleType)}>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Brand" required>
              <input className={fieldInputClassName} placeholder="Mercedes" value={brand} onChange={(event) => setBrand(event.target.value)} />
            </Field>

            <Field label="Model" required>
              <input className={fieldInputClassName} placeholder="E-Class" value={model} onChange={(event) => setModel(event.target.value)} />
            </Field>

            <Field label="Year">
              <input className={fieldInputClassName} type="number" value={year} onChange={(event) => setYear(event.target.value)} />
            </Field>

            <Field label="Color">
              <input className={fieldInputClassName} placeholder="Black" value={color} onChange={(event) => setColor(event.target.value)} />
            </Field>

            <Field label="Seat Capacity" required>
              <input className={fieldInputClassName} type="number" min={1} value={seatCapacity} onChange={(event) => setSeatCapacity(event.target.value)} />
            </Field>

            <Field label="Luggage Capacity">
              <input className={fieldInputClassName} type="number" min={0} value={luggageCapacity} onChange={(event) => setLuggageCapacity(event.target.value)} />
            </Field>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button type="button" role="switch" aria-checked={electric} onClick={() => setElectric((value) => !value)} className={`h-6 w-11 rounded-full transition-colors ${electric ? "bg-green-600" : "bg-gray-300"}`}>
              <span className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition-transform ${electric ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-[15px]">🍃 Electric Vehicle</span>
          </div>

          <div className="mt-6">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a]">
              Inclusions & Features <span className="text-red-600">*</span>
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Select what is actually included with this vehicle. These will be shown to customers during booking.
            </p>
            <p className="mt-1 text-sm text-red-600">
              Please select at least one inclusion — only select features your vehicle actually provides.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INCLUSION_OPTIONS.map((label) => (
                <label key={label} className="flex cursor-pointer items-center gap-2 rounded-md border border-[#E7DFCF] bg-[#F3EEE0] px-4 py-3 text-[15px]">
                  <input type="checkbox" checked={inclusions.includes(label)} onChange={() => toggleInclusion(label)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a]">
              Vehicle Photos ({photos.length}/{MAX_PHOTOS})
            </h3>

            <div className="mt-2 flex flex-wrap gap-3">
              {photos.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-md border border-[#E7DFCF]">
                  <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
                  <button onClick={() => removePhoto(index)} className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white">
                    ×
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[#C9BF9F] text-gray-500">
                  <span className="text-xl">📷</span>
                  <span className="text-xs">Add Photo</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoAdd} />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">JPEG, PNG or WebP. Max 5 MB each.</p>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E7DFCF] px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 text-[15px] text-gray-700">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="rounded-md bg-[#2f6fed] px-5 py-2 text-[15px] font-medium text-white hover:bg-[#265cc4] disabled:opacity-60">
            {saving ? "Saving…" : "Save Vehicle"}
          </button>
        </div>
      </div>

    </div>
  );
}

const fieldInputClassName =
  "w-full rounded-md border border-[#E7DFCF] bg-[#fdfbf5] px-3 py-2.5 text-[15px] text-[#1a1a1a] outline-none transition focus:border-[#2f6fed] focus:ring-2 focus:ring-[#2f6fed]/20";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {  return (
    <div>
      <label className="mb-1 block text-[15px] font-medium text-[#1a1a1a]">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}
