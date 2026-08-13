"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { api, type Driver } from "@/lib/api";
import { getToken, clearSession } from "@/lib/adminAuth";
import {
  deleteDriverAccountByIdentity,
  getDriverAccounts,
  updateDriverApprovalStatus,
} from "@/lib/driverAuth";
import { deleteLocalDriverRecord, deleteLocalVehicleRecord } from "@/lib/supabaseClient";
import StatusBadge from "@/components/admin/StatusBadge";
import AddDriverModal from "@/components/AddDriverModal";
import AddVehicleModal from "@/components/AddVehicleModal";

export default function AdminDriversPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDrivers(token);
      setDrivers(res.drivers);
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
  }, [router, locale]);

  const handleDeleteDriver = (driver: Driver) => {
    deleteLocalDriverRecord(driver.id);
    deleteDriverAccountByIdentity({
      email: driver.user.email,
      fullName: driver.user.fullName,
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
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">License</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
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
                            <div>{d.user.fullName}</div>
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
                          onClick={() => handleDeleteDriver(d)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-ink-600">
                      <div className="space-y-1">
                        <div><span className="font-semibold text-ink-700">WhatsApp:</span> {d.user.phone ?? "—"}</div>
                        <div><span className="font-semibold text-ink-700">Email:</span> {d.user.email || "—"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top font-mono text-ink-600">
                      <div className="space-y-1">
                        <div><span className="font-semibold text-ink-700">License Number:</span> {d.licenseNumber || "—"}</div>
                        <div><span className="font-semibold text-ink-700">Expiry:</span> {d.licenseExpiry || "—"}</div>
                        <div><span className="font-semibold text-ink-700">Languages:</span> {formatLanguages(d)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-ink-600">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {getVehiclePhotoUrl(d) ? (
                            <div className="h-14 w-14 overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                              <img src={getVehiclePhotoUrl(d)!} alt={`${d.vehicle?.make ?? "Vehicle"} ${d.vehicle?.model ?? ""}`} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50 text-lg text-ink-400">
                              🚕
                            </div>
                          )}
                          <div className="space-y-1">
                            <div><span className="font-semibold text-ink-700">Plate Number:</span> {d.vehicle?.plate ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Vehicle Type:</span> {d.vehicle?.category ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Brand:</span> {d.vehicle?.make ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Model:</span> {d.vehicle?.model ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Year:</span> {d.vehicle?.year ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Color:</span> {d.vehicle?.color ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Seat Capacity:</span> {d.vehicle?.seatCapacity ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Luggage Capacity:</span> {d.vehicle?.luggageCapacity ?? "—"}</div>
                            <div><span className="font-semibold text-ink-700">Electric Vehicle:</span> {d.vehicle?.electric ? "Yes" : d.vehicle ? "No" : "—"}</div>
                            <div><span className="font-semibold text-ink-700">Features:</span> {d.vehicle?.features && d.vehicle.features.length > 0 ? d.vehicle.features.join(", ") : "—"}</div>
                            {getVehiclePhotoUrl(d) && (
                              <a
                                href={getVehiclePhotoUrl(d)!}
                                download
                                className="inline-block text-[11px] font-medium text-brand-600 underline-offset-2 hover:underline"
                              >
                                Download image
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowVehicleModal(true);
                              setSelectedDriverId(d.id);
                            }}
                            className="rounded-md border border-ink-200 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 hover:bg-ink-50"
                          >
                            Add Vehicle
                          </button>
                          {d.vehicle && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVehicle(d.id)}
                              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                            >
                              Delete Vehicle
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-ink-700">
                        <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
                        {d.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <StatusBadge status={d.status} />
                        <div className="flex flex-wrap gap-2">
                          {d.status === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => handleApprovalChange(d, "enabled")}
                              className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApprovalChange(d, "pending")}
                              className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Mark pending
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleApprovalChange(d, "suspended")}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                          >
                            Suspend
                          </button>
                        </div>
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
