import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

const RESEND_API_URL = "https://api.resend.com/emails";
const EARLY_ACCESS_SUBJECT = "You're in \u2014 we saw you \uD83D\uDC41\uFE0F";
const DEFAULT_FROM_NAME = "Socratic AI";
const EARLY_ACCESS_LOGO_URL = resolveCloudinaryPublicAsset(
  "/brand/Logo_Dark_SVG.svg",
);

type ResendConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

let cachedConfig: ResendConfig | null = null;

function getResendConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const fromEmail = process.env["RESEND_FROM_EMAIL"]?.trim();
  const fromName = process.env["RESEND_FROM_NAME"]?.trim() ?? DEFAULT_FROM_NAME;

  if (!apiKey || !fromEmail) {
    return null;
  }

  cachedConfig = { apiKey, fromEmail, fromName };
  return cachedConfig;
}

type SendResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "request_failed" };

function formatFromHeader(fromName: string, fromEmail: string) {
  if (fromEmail.includes("<") && fromEmail.includes(">")) {
    return fromEmail;
  }

  return `${fromName} <${fromEmail}>`;
}

function buildEarlyAccessMessage(email: string) {
  return {
    to: [email],
    subject: EARLY_ACCESS_SUBJECT,
    html: `
<div style="margin:0;padding:44px 18px;background-color:#ede8df;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:620px;background:#faf7f2;border:1px solid #d9d1c2;">

          <!-- top rule -->
          <tr>
            <td style="height:3px;background:#1a1209;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- header -->
          <tr>
            <td style="padding:44px 52px 36px 52px;text-align:center;border-bottom:1px solid #e0d8cc;">
              <p style="margin:0 0 18px 0;font-size:10px;letter-spacing:0.3em;color:#a09070;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Socratic AI</p>
              <img
                src="${EARLY_ACCESS_LOGO_URL}"
                alt="Socratic AI"
                width="160"
                style="display:block;margin:0 auto 18px auto;width:160px;height:auto;border:0;outline:none;text-decoration:none;"
              />
              <div style="width:32px;height:1px;background:#b08d57;margin:0 auto 18px auto;font-size:0;line-height:0;">&nbsp;</div>
              <p style="margin:0;font-size:10px;letter-spacing:0.18em;color:#c8b89a;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Early Access Confirmed</p>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:44px 52px 8px 52px;">

              <h1 style="margin:0 0 32px 0;font-size:28px;line-height:1.35;font-weight:400;color:#1a1209;font-style:italic;font-family:Georgia,'Times New Roman',serif;">
                We saw you.
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.85;color:#3d3322;font-family:Georgia,'Times New Roman',serif;">
                Most people scroll past things that make them think. You didn't. That decision says something.
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.85;color:#3d3322;font-family:Georgia,'Times New Roman',serif;">
                Your place on the Socratic AI early access list is now reserved. We're opening access carefully, in stages, while we continue refining the experience.
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.85;color:#3d3322;font-family:Georgia,'Times New Roman',serif;">
                When your access is ready, you'll receive another email with everything you need to begin. Until then, sit with a question you haven't been able to answer. We'll help you go deeper.
              </p>

              <p style="margin:0 0 36px 0;font-size:16px;line-height:1.85;color:#3d3322;font-family:Georgia,'Times New Roman',serif;">
                We appreciate your patience and your interest in what we're building.
              </p>

              <!-- quote block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="border-left:2px solid #b08d57;background:#f0e9de;margin:0 0 40px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px 0;font-size:15px;line-height:1.8;color:#5a3e1b;font-style:italic;font-family:Georgia,'Times New Roman',serif;">
                      "The unexamined life is not worth living."
                    </p>
                    <p style="margin:0;font-size:10px;letter-spacing:0.15em;color:#b08d57;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Socrates</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 44px 0;font-size:16px;line-height:1.7;color:#3d3322;font-family:Georgia,'Times New Roman',serif;">
                &mdash; Socratic AI
              </p>

            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:24px 52px 32px 52px;border-top:1px solid #e0d8cc;">
              <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:0.15em;color:#b0a090;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">usesocratic.com</p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#b0a090;font-family:Georgia,'Times New Roman',serif;">
                You received this email because you joined the Socratic AI early access list.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</div>
`,
    text: [
      "You just did something most people won't. You stopped, thought, and acted.",
      "",
      "Your spot for Socratic AI Early Access is locked in. We're handpicking who gets in first, and you're on that list. When it's your turn, we'll land in your inbox with everything: how to get in, what to explore first, all of it.",
      "",
      "Most waitlists forget you exist. We promise that we won't.",
      "",
      "Talk soon,",
      "The Socratic AI Team",
    ].join("\n"),
  };
}

export async function sendEarlyAccessThankYouEmail(
  email: string,
): Promise<SendResult> {
  const config = getResendConfig();

  if (!config) {
    return { ok: false, reason: "not_configured" };
  }

  const message = buildEarlyAccessMessage(email);
  const from = formatFromHeader(config.fromName, config.fromEmail);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Resend early-access email failed", {
      status: response.status,
    });
    return { ok: false, reason: "request_failed" };
  }

  return { ok: true };
}
