import { Resend } from "resend";

export type DriverVerificationEmailPayload = {
  email: string;
  code: string;
  fullName?: string;
};

function buildVerificationEmailHtml(payload: DriverVerificationEmailPayload) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 16px;">Taxi LogicMoov driver verification</h2>
      <p>Hello ${payload.fullName || "Driver"},</p>
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em; margin: 16px 0;">${payload.code}</p>
      <p>Enter this code in the driver portal to verify your email address and activate your account.</p>
    </div>
  `;
}

async function sendViaPostmark(
  payload: DriverVerificationEmailPayload,
  from: string,
  serverToken: string,
) {
  const messageStream = process.env.POSTMARK_MESSAGE_STREAM || "outbound";
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": serverToken,
    },
    body: JSON.stringify({
      From: from,
      To: payload.email,
      Subject: "Verify your Taxi LogicMoov driver account",
      HtmlBody: buildVerificationEmailHtml(payload),
      MessageStream: messageStream,
    }),
  });

  const data = (await response.json()) as {
    ErrorCode?: number;
    Message?: string;
    MessageID?: string;
  };

  if (!response.ok || (typeof data.ErrorCode === "number" && data.ErrorCode !== 0)) {
    return {
      ok: false,
      fallback: false,
      message: data.Message || "Unable to send verification email via Postmark.",
    };
  }

  return {
    ok: true,
    fallback: false,
    id: data.MessageID ?? null,
  };
}

async function sendViaResend(payload: DriverVerificationEmailPayload, from: string, apiKey: string) {
  const resend = new Resend(apiKey);
  const response = await resend.emails.send({
    from,
    to: [payload.email],
    subject: "Verify your Taxi LogicMoov driver account",
    html: buildVerificationEmailHtml(payload),
  });

  if (response.error) {
    return {
      ok: false,
      fallback: false,
      message: response.error.message || "Unable to send verification email via Resend.",
    };
  }

  return {
    ok: true,
    fallback: false,
    id: response.data?.id ?? null,
  };
}

export async function sendDriverVerificationEmail(payload: DriverVerificationEmailPayload) {
  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.DRIVER_EMAIL_FROM ||
    process.env.POSTMARK_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "no-reply@logicmoov.com";

  if (!postmarkToken && !resendApiKey) {
    return {
      ok: false,
      fallback: true,
      message: "No email provider configured. Demo verification mode is active.",
    };
  }

  try {
    if (postmarkToken) {
      return await sendViaPostmark(payload, from, postmarkToken);
    }

    if (resendApiKey) {
      return await sendViaResend(payload, from, resendApiKey);
    }

    return {
      ok: false,
      fallback: true,
      message: "No email provider configured. Demo verification mode is active.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send verification email.";
    return {
      ok: false,
      fallback: false,
      message,
    };
  }
}
