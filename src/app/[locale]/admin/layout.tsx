import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <AdminShell locale={locale}>{children}</AdminShell>;
}
