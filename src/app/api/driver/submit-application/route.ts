import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

interface DocumentAttachment {
  label: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
}

interface DriverSubmissionPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  documents: DocumentAttachment[];
}

export async function POST(request: Request) {
  let body: DriverSubmissionPayload;

  try {
    body = (await request.json()) as DriverSubmissionPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { firstName, lastName, email, phone, gender, address, city, province, postalCode, documents } = body;

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const attachments = (documents ?? [])
        .filter((doc) => doc.dataUrl?.startsWith("data:") && doc.fileName)
        .map((doc) => {
          const base64 = doc.dataUrl.split(",")[1] ?? "";
          return {
            filename: doc.fileName,
            content: Buffer.from(base64, "base64"),
          };
        });

      const submittedAt = new Date().toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        dateStyle: "full",
        timeStyle: "short",
      });

      const docListHtml = (documents ?? [])
        .map(
          (doc) =>
            `<li style="margin-bottom:4px"><strong>${doc.label}:</strong> ${doc.fileName} (${doc.mimeType || "file"})</li>`,
        )
        .join("");

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;color:#111827;max-width:640px;margin:0 auto;padding:24px">
  <div style="background:#1d4ed8;border-radius:12px;padding:24px 28px;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:22px">🚕 New Driver Application</h1>
    <p style="color:#bfdbfe;margin:6px 0 0">Taxi LogicMoov — Driver Portal</p>
  </div>

  <h2 style="font-size:16px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px">Personal Details</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:20px">
    <tr style="background:#f9fafb">
      <td style="padding:8px 14px;font-weight:600;width:160px;color:#374151">Full Name</td>
      <td style="padding:8px 14px">${firstName} ${lastName}</td>
    </tr>
    <tr>
      <td style="padding:8px 14px;font-weight:600;color:#374151">Email</td>
      <td style="padding:8px 14px"><a href="mailto:${email}" style="color:#1d4ed8">${email}</a></td>
    </tr>
    <tr style="background:#f9fafb">
      <td style="padding:8px 14px;font-weight:600;color:#374151">Phone</td>
      <td style="padding:8px 14px">${phone || "—"}</td>
    </tr>
    <tr>
      <td style="padding:8px 14px;font-weight:600;color:#374151">Gender</td>
      <td style="padding:8px 14px">${gender || "—"}</td>
    </tr>
    <tr style="background:#f9fafb">
      <td style="padding:8px 14px;font-weight:600;color:#374151">Address</td>
      <td style="padding:8px 14px">${address || "—"}</td>
    </tr>
    <tr>
      <td style="padding:8px 14px;font-weight:600;color:#374151">City</td>
      <td style="padding:8px 14px">${city || "—"}</td>
    </tr>
    <tr style="background:#f9fafb">
      <td style="padding:8px 14px;font-weight:600;color:#374151">Province</td>
      <td style="padding:8px 14px">${province || "—"}</td>
    </tr>
    <tr>
      <td style="padding:8px 14px;font-weight:600;color:#374151">Postal Code</td>
      <td style="padding:8px 14px">${postalCode || "—"}</td>
    </tr>
  </table>

  <h2 style="font-size:16px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px">
    Documents Attached (${attachments.length} file${attachments.length === 1 ? "" : "s"})
  </h2>
  <ul style="font-size:14px;padding-left:20px;line-height:1.7">
    ${docListHtml}
  </ul>

  <p style="color:#9ca3af;font-size:12px;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:12px">
    Submitted on ${submittedAt} via the Taxi LogicMoov Driver Portal.
  </p>
</body>
</html>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Taxi LogicMoov <onboarding@resend.dev>",
        to: ["info@logicmoov.ca"],
        replyTo: email,
        subject: `New Driver Application: ${firstName} ${lastName}`,
        html,
        attachments,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log the error — do not block the driver submission
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[submit-application] Resend error:", errMsg);
    // Return ok so the driver flow is not blocked, but include the error for debugging
    return NextResponse.json({ ok: true, emailError: errMsg });
  }
}
