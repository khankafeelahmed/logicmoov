import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  "";

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase admin list is not configured for this environment.",
        },
        { status: 500 },
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: drivers, error: driversError } = await adminClient
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (driversError) {
      return NextResponse.json({ ok: false, error: driversError.message }, { status: 500 });
    }

    const { data: vehicles } = await adminClient.from("vehicles").select("*");
    const { data: documents } = await adminClient.from("driver_documents").select("*");

    return NextResponse.json({
      ok: true,
      drivers: drivers ?? [],
      vehicles: vehicles ?? [],
      documents: documents ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to list drivers.",
      },
      { status: 500 },
    );
  }
}
