import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  "";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      driverId?: string;
      userId?: string;
    };

    const driverId = body.driverId?.trim();
    const userId = body.userId?.trim();

    if (!driverId && !userId) {
      return NextResponse.json(
        { ok: false, error: "Driver ID is required." },
        { status: 400 },
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin delete is not configured for this environment." },
        { status: 500 },
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    let resolvedDriverId = driverId;
    if (!resolvedDriverId && userId) {
      const { data: profileRow } = await adminClient
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      resolvedDriverId = profileRow?.id ?? null;
    }

    if (!resolvedDriverId) {
      return NextResponse.json(
        { ok: false, error: "Driver record not found." },
        { status: 404 },
      );
    }

    const { data: driverRow, error: driverLookupError } = await adminClient
      .from("drivers")
      .select("id, user_id")
      .eq("id", resolvedDriverId)
      .maybeSingle();

    if (driverLookupError || !driverRow) {
      return NextResponse.json(
        { ok: false, error: "Driver record not found." },
        { status: 404 },
      );
    }

    const { data: docs } = await adminClient
      .from("driver_documents")
      .select("file_path")
      .eq("driver_id", driverRow.id);

    const filePaths = (docs ?? [])
      .map((doc) => (typeof doc.file_path === "string" ? doc.file_path : ""))
      .filter(Boolean);

    if (filePaths.length > 0) {
      await adminClient.storage.from("driver-documents").remove(filePaths);
    }

    await adminClient.from("driver_documents").delete().eq("driver_id", driverRow.id);
    await adminClient.from("drivers").delete().eq("id", driverRow.id);

    if (driverRow.user_id) {
      await adminClient.auth.admin.deleteUser(driverRow.user_id).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, deletedDriverId: driverRow.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to delete driver.",
      },
      { status: 500 },
    );
  }
}
