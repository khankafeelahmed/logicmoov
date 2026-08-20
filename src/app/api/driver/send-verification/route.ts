import { NextResponse } from "next/server";
import { sendDriverVerificationEmail } from "@/lib/driverEmail";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      code?: string;
      fullName?: string;
    };

    const email = body.email?.trim();
    const code = body.code?.trim();
    const fullName = body.fullName?.trim();

    if (!email || !code) {
      return NextResponse.json(
        { ok: false, error: "Email and verification code are required." },
        { status: 400 },
      );
    }

    const result = await sendDriverVerificationEmail({ email, code, fullName });

    if (result.ok) {
      return NextResponse.json({
        ok: true,
        id: "id" in result ? result.id ?? null : null,
      });
    }

    if (result.fallback) {
      return NextResponse.json({
        ok: true,
        fallback: true,
        demoCode: code,
        message: result.message,
      });
    }

    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, fallback: true, message: "Unable to send verification email." },
      { status: 200 },
    );
  }
}
