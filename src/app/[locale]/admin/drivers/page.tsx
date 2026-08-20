"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { api, type Driver } from "@/lib/api";
import { getToken, clearSession } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  deleteDriverAccountByIdentity,
  getDriverAccounts,
  updateDriverApprovalStatus,
} from "@/lib/driverAuth";
import { deleteLocalDriverRecord, deleteLocalVehicleRecord } from "@/lib/supabaseClient";
import StatusBadge from "@/components/admin/StatusBadge";
import AddDriverModal from "@/components/AddDriverModal";
import AddVehicleModal from "@/components/AddVehicleModal";

type DriverDocumentRecord = {
  id: string;
  driverId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  status: string;
  mimeType?: string | null;
  url?: string;
};

export default function AdminDriversPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverDocuments, setDriverDocuments] = useState<Record<string, DriverDocumentRecord[]>>({});
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const loadDriverDocuments = useCallback(async (driverList: Driver[]) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setDriverDocuments({});
      return;
    }

    const ids = driverList.map((driver) => String(driver.id)).filter(Boolean);
    if (ids.length === 0) {
      setDriverDocuments({});
      return;
    }

    const { data, error: documentsError } = await supabase
      .from("driver_documents")
      .select("id, driver_id, document_type, file_path, original_filename, status, mime_type")
      .in("driver_id", ids);

    if (documentsError || !Array.isArray(data)) {
      setDriverDocuments({});
      return;
    }

    const docsByDriver: Record<string, DriverDocumentRecord[]> = {};

    for (const item of data) {
      const driverId = String(item.driver_id);
      const path = typeof item.file_path === "string" ? item.file_path : "";
      const name = typeof item.original_filename === "string" ? item.original_filename : "Document";
      const docType = String(item.document_type ?? "document");

      const signedUrl = path
        ? await (async () => {
            try {
              const { data: signedData } = await supabase.storage
                .from("driver-documents")
                .createSignedUrl(path, 60 * 60 * 24 * 7);
              return signedData?.signedUrl ?? "";
            } catch {
              return "";
            }
          })()
        : "";

      const row: DriverDocumentRecord = {
        id: String(item.id),
        driverId,
        documentType: docType,
        fileName: name,
        filePath: path,
        status: String(item.status ?? "pending"),
        mimeType: typeof item.mime_type === "string" ? item.mime_type : null,
        url: signedUrl,
      };

      docsByDriver[driverId] = [...(docsByDriver[driverId] ?? []), row];
    }

    setDriverDocuments(docsByDriver);
  }, []);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDrivers(token);
      setDrivers(res.drivers);
      await loadDriverDocuments(res.drivers);
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not load drivers. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [router, locale, loadDriverDocuments]);

  const handleDeleteDriver = async (driver: Driver) => {
    const identity = {
      email: driver.user.email,
      fullName: driver.user.fullName,
      loginId: driver.user.fullName,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem("taxi_logicmoov_last_deleted_driver_identity", JSON.stringify(identity));
    }

    try {
      const response = await fetch("/api/admin/delete-driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId: driver.id,
          userId: driver.user.id,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Delete request failed.");
      }
    } catch {
      try {
        const { data: driverRow } = await supabase
          .from("drivers")
          .select("id, user_id")
          .eq("id", driver.id)
          .maybeSingle();

        if (driverRow?.id) {
          await supabase.from("driver_documents").delete().eq("driver_id", driverRow.id);
          await supabase.from("drivers").delete().eq("id", driverRow.id);
        }
      } catch {
        // Ignore DB deletion errors and continue with local cleanup.
      }
    }

    deleteLocalDriverRecord(driver.id);
    deleteDriverAccountByIdentity({
      email: driver.user.email,
      fullName: driver.user.fullName,
      username: driver.user.fullName,
    });
    void load();
  };

  const handleDeleteVehicle = (driverId: string) => {
    const storage = window.localStorage.getItem("taxi_logicmoov_local_vehicles");
    if (!storage) return;

    try {
      const vehicles = JSON.parse(storage) as Array<Record<string, unknown>>;
      const next = vehicles.filter((vehicle) => String(vehicle.driver_id) !== driverId);
      window.localStorage.setItem("taxi_logicmoov_local_vehicles", JSON.stringify(next));
      void load();
    } catch {
      deleteLocalVehicleRecord(driverId);
      void load();
    }
  };

  const handleApprovalChange = (driver: Driver, nextStatus: "pending" | "enabled" | "suspended") => {
    const accountEmail = driver.user.email || "";
    if (!accountEmail) {
      return;
    }

    try {
      updateDriverApprovalStatus(accountEmail, nextStatus);
      void load();
    } catch {
      const driverAccounts = getDriverAccounts();
      const match = driverAccounts.find(
        (account) =>
          account.fullName.toLowerCase() === driver.user.fullName.toLowerCase() ||
          account.email.toLowerCase() === accountEmail.toLowerCase(),
      );
      if (match) {
        updateDriverApprovalStatus(match.id, nextStatus);
        void load();
      }
    }
  };

  const getDriverPhotoUrl = (driver: Driver) => driver.photoUrl || null;
  const getVehiclePhotoUrl = (driver: Driver) => {
    if (!driver.vehicle) return null;
    if (driver.vehicle.photoUrl) return driver.vehicle.photoUrl;
    if (driver.vehicle.photoUrls && driver.vehicle.photoUrls.length > 0) return driver.vehicle.photoUrls[0];
    return null;
  };
  const formatLanguages = (driver: Driver) => {
    if (!driver.languages || driver.languages.length === 0) return "Not added";
    return driver.languages.join(", ");
  };
  const formatDocumentLabel = (documentType: string) => {
    const normalized = documentType.toLowerCase();
    const labels: Record<string, string> = {
      transport_operating_license: "Transport Operating Licence",
      saaq_taxi_licence: "SAAQ Taxi Licence",
      fleet_vehicle_insurance: "Fleet / Vehicle Insurance",
      taxi_registration_certificate: "Taxi Registration Certificate",
      saaq_mechanical_inspection: "Mechanical Inspection Certificate",
      driver_license: "Driver License",
      vehicle_insurance: "Vehicle Insurance",
    };

    return labels[normalized] ?? documentType.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleDownloadDocument = async (doc: DriverDocumentRecord) => {
    if (!doc.url) return;

    try {
      const response = await fetch(doc.url, { method: "GET" });
      if (!response.ok) {
        window.open(doc.url, "_blank", "noopener,noreferrer");
        return;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(doc.url, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">Drivers</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDriverModal(true)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink-900 hover:bg-brand-400"
          >
            + Add Driver
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDriverId(null);
              setShowVehicleModal(true);
            }}
            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            + Add Vehicle
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-400">
                <th className="px-4 py-3 font-semibold">Driver login ID</th>
                <th className="px-4 py-3 font-semibold">Uploaded docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-ink-400">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-4 align-top font-semibold text-ink-900">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-full border border-ink-200 bg-ink-50">
                            {getDriverPhotoUrl(d) ? (
                              <img src={getDriverPhotoUrl(d)!} alt={d.user.fullName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg text-ink-400">👤</div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="text-[11px] font-medium text-ink-500">
                              {d.user.fullName && d.user.fullName !== "Unknown driver" ? d.user.fullName : "Driver login ID"}
                            </div>
                            <div className="text-sm font-semibold text-ink-900">
                              {d.user.fullName && d.user.fullName !== "Unknown driver" ? d.user.fullName : d.user.email || "—"}
                            </div>
                            {getDriverPhotoUrl(d) && (
                              <a
                                href={getDriverPhotoUrl(d)!}
                                download
                                className="inline-block text-[11px] font-medium text-brand-600 underline-offset-2 hover:underline"
                              >
                                Download photo
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteDriver(d)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-ink-600">
                      <div className="space-y-2">
                        {(driverDocuments[d.id] ?? []).length > 0 ? (
                          (driverDocuments[d.id] ?? []).map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between gap-2 rounded border border-ink-200 bg-ink-50 px-2 py-2">
                              <div className="min-w-0">
                                <div className="truncate text-[11px] font-semibold text-ink-700">
                                  {formatDocumentLabel(doc.documentType)}
                                </div>
                                <div className="truncate text-[10px] text-ink-500">{doc.fileName}</div>
                              </div>
                              {doc.url ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDownloadDocument(doc)}
                                  className="shrink-0 text-[10px] font-semibold text-brand-600 hover:underline"
                                >
                                  Download
                                </button>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <div className="rounded border border-dashed border-ink-200 bg-ink-50 px-2 py-2 text-[11px] text-ink-500">
                            No documents uploaded
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDriverModal && (
        <AddDriverModal
          onClose={() => setShowDriverModal(false)}
          onSaved={() => {
            void load();
          }}
        />
      )}
      {showVehicleModal && (
        <AddVehicleModal
          driverId={selectedDriverId ?? undefined}
          driverOptions={drivers.map((driver) => ({
            id: driver.id,
            fullName: driver.user.fullName,
          }))}
          onClose={() => {
            setShowVehicleModal(false);
            setSelectedDriverId(null);
          }}
          onSaved={() => {
            setShowVehicleModal(false);
            setSelectedDriverId(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
