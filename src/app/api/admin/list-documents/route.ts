import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  "";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Admin authorization is required." }, { status: 401 });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase admin documents list is not configured for this environment." },
        { status: 500 },
      );
    }

    const payload = await request.json().catch(() => ({ driverIds: [] }));
    const driverIds = Array.isArray(payload?.driverIds)
      ? payload.driverIds.map((id: unknown) => String(id)).filter(Boolean)
      : [];

    if (driverIds.length === 0) {
      return NextResponse.json({ documents: {} });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: documentRows, error } = await adminClient
      .from("driver_documents")
      .select("id, driver_id, document_type, file_path, original_filename, status, mime_type")
      .in("driver_id", driverIds);

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to load driver documents." }, { status: 500 });
    }

    const docsByDriver: Record<string, Array<Record<string, unknown>>> = {};
    for (const item of documentRows ?? []) {
      const driverId = String(item.driver_id);
      const path = typeof item.file_path === "string" ? item.file_path : "";
      const name = typeof item.original_filename === "string" ? item.original_filename : "Document";
      const docType = String(item.document_type ?? "document");

      let signedUrl = "";
      if (path) {
        const { data: signedData } = await adminClient.storage
          .from("driver-documents")
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        signedUrl = signedData?.signedUrl ?? "";
      }

      const row = {
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

    return NextResponse.json({ documents: docsByDriver });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load driver documents." },
      { status: 500 },
    );
  }
}
