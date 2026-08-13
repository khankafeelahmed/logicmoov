"use client";

import { useState } from "react";
import { saveDriverRecord, supabase } from "@/lib/supabaseClient";

interface AddDriverModalProps {
  onClose: () => void;
  onSaved?: (driverId: string) => void;
}

export default function AddDriverModal({ onClose, onSaved }: AddDriverModalProps) {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [languages, setLanguages] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!fullName || !whatsapp) {
      setError("Please fill in all required fields marked with *.");
      return;
    }
    if (!whatsapp.startsWith("+")) {
      setError("WhatsApp number must start with a country code, e.g. +1 514 266 4708.");
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        const path = `drivers/${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage.from("fleet-photos").upload(path, photo);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("fleet-photos").getPublicUrl(path);
        photoUrl = publicUrl.publicUrl;
      }

      const { data, error: insertError } = await saveDriverRecord({
        full_name: fullName,
        whatsapp_number: whatsapp,
        email: email || null,
        license_number: licenseNumber || null,
        license_expiry: licenseExpiry || null,
        languages: languages ? languages.split(",").map((language) => language.trim()).filter(Boolean) : [],
        photo_url: photoUrl ?? null,
        status: "pending",
      });

      if (insertError) throw insertError;
      if (!data || !data.id) {
        throw new Error("Driver record was not created.");
      }

      onSaved?.(String(data.id));
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong while saving the driver.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-[#FAF6EE] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E7DFCF] px-6 py-5">
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Add Driver</h2>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-gray-500 hover:text-gray-800">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-[#C9BF9F] bg-[#F3EEE0] text-gray-400">
              {photo ? (
                <img src={URL.createObjectURL(photo)} alt="Driver" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
            </label>
            <span className="text-sm text-gray-500">JPG, PNG or WebP</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <Field label="Full Name" required>
              <input className={fieldInputClassName} value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="WhatsApp Number" required>
                <input className={fieldInputClassName} placeholder="+90 532 123 45 67" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
              </Field>
              <Field label="Email">
                <input className={fieldInputClassName} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-gray-500">
              Enter the driver&apos;s number with country code (start with +). The driver receives booking alerts on WhatsApp at this number.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="License Number">
                <input className={fieldInputClassName} value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} />
              </Field>
              <Field label="License Expiry">
                <input className={fieldInputClassName} type="date" value={licenseExpiry} onChange={(event) => setLicenseExpiry(event.target.value)} />
              </Field>
            </div>

            <Field label="Languages (comma separated)">
              <input className={fieldInputClassName} placeholder="English, Turkish, German" value={languages} onChange={(event) => setLanguages(event.target.value)} />
            </Field>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E7DFCF] px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 text-[15px] text-gray-700">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="rounded-md bg-[#2f6fed] px-5 py-2 text-[15px] font-medium text-white hover:bg-[#265cc4] disabled:opacity-60">
            {saving ? "Saving…" : "Save Driver"}
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
