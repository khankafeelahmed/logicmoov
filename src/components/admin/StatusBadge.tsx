import type { BookingStatus } from "@/lib/api";

const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  EN_ROUTE: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-cyan-100 text-cyan-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  // Driver statuses
  AVAILABLE: "bg-green-100 text-green-700",
  BUSY: "bg-amber-100 text-amber-700",
  OFFLINE: "bg-ink-100 text-ink-500",
  // Payment statuses
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-ink-100 text-ink-500",
};

export default function StatusBadge({ status }: { status: BookingStatus | string }) {
  const cls = STYLES[status] ?? "bg-ink-100 text-ink-600";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
