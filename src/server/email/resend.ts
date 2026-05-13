import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

const RESEND_API_URL = "https://api.resend.com/emails";
const EARLY_ACCESS_SUBJECT = "We saw what you just did \uD83D\uDC41\uFE0F";
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
<div style="margin:0;padding:44px 18px;background-color:#f0eeeb;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:620px;background:#ffffff;border:1px solid #dddad5;">

          <!-- top rule -->
          <tr>
            <td style="height:2px;background:#111111;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- header -->
          <tr>
            <td style="padding:44px 52px 36px 52px;text-align:center;border-bottom:1px solid #e8e5e0;">
              <p style="margin:0 0 6px 0;font-size:10px;letter-spacing:0.3em;color:#333230;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Socratic AI</p>
              <img
                src="${EARLY_ACCESS_LOGO_URL}"
                alt="Socratic AI"
                width="160"
                style="display:block;margin:0 auto;width:160px;height:auto;border:0;outline:none;text-decoration:none;"
              />
              <div style="width:28px;height:1px;background:#555350;margin:16px auto;font-size:0;line-height:0;">&nbsp;</div>
              <p style="margin:0;font-size:10px;letter-spacing:0.18em;color:#555350;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Early Access Confirmed</p>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:44px 52px 8px 52px;">

              <h1 style="margin:0 0 32px 0;font-size:26px;line-height:1.35;font-weight:400;color:#111111;font-style:italic;font-family:Georgia,'Times New Roman',serif;">
                You’ve taken the first step toward a sharper perspective.  
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.85;color:#333230;font-family:Georgia,'Times New Roman',serif;">
                You just did something most people won't. You stopped, thought, and acted. In a world full of easy answers, you chose to sign up for a challenge.
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.85;color:#333230;font-family:Georgia,'Times New Roman',serif;">
                Your spot for Socratic AI Early Access is locked in. We're handpicking who gets in first, and you're on that list. When it's your turn, we'll land in your inbox with everything: how to get in, what to explore first, all of it.
              </p>

              <p style="margin:0 0 40px 0;font-size:16px;line-height:1.85;color:#333230;font-family:Georgia,'Times New Roman',serif;">
                Most waitlists forget you exist the moment you hit "submit", but we are doing things differently. We are currently in the final stages of development, doing some touch ups. We appreciate your patience and your interest in what we're building.
              </p>

              <p style="margin:0 0 44px 0;font-size:16px;line-height:1.7;color:#333230;font-family:Georgia,'Times New Roman',serif;">
                Talk soon,<br/>
                <strong>The Socratic AI Team</strong>
              </p>

            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:24px 52px 32px 52px;border-top:1px solid #e8e5e0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#aaa9a5;font-family:Georgia,'Times New Roman',serif;">
                You received this email because you joined the Socratic AI early access list. You made a good choice. 
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
