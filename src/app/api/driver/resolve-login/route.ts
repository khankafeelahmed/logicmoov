import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  "";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      loginId?: string;
    };

    const loginId = String(body.loginId ?? "").trim();
    if (!loginId) {
      return NextResponse.json({ ok: false, error: "Login ID is required." }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Driver login lookup is not configured for this environment." },
        { status: 500 },
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: driver, error } = await adminClient
      .from("drivers")
      .select("id, user_id, login_id, email, first_name, last_name, phone, application_status")
      .eq("login_id", loginId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "Unable to resolve driver login." },
        { status: 500 },
      );
    }

    if (!driver) {
      return NextResponse.json({ ok: false, error: "Driver not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      driver: {
        id: driver.id,
        user_id: driver.user_id,
        userId: driver.user_id,
        login_id: driver.login_id,
        loginId: driver.login_id,
        email: driver.email,
        first_name: driver.first_name,
        firstName: driver.first_name,
        last_name: driver.last_name,
        lastName: driver.last_name,
        phone: driver.phone,
        application_status: driver.application_status,
        applicationStatus: driver.application_status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to resolve driver login.",
      },
      { status: 500 },
    );
  }
}
