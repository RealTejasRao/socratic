import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

const RESEND_API_URL = "https://api.resend.com/emails";
const EARLY_ACCESS_SUBJECT = "You're in \u2014 we saw you \uD83D\uDC41\uFE0F";
const DEFAULT_FROM_NAME = "Socratic AI";
const EARLY_ACCESS_LOGO_URL = resolveCloudinaryPublicAsset("/brand/Logo_Dark.png");

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
  const logoBlock = `
    <tr>
      <td style="padding: 0 0 18px 0; text-align: center;">
        <img
          src="${EARLY_ACCESS_LOGO_URL}"
          alt="Socratic AI"
          width="164"
          style="display: inline-block; width: 164px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;"
        />
      </td>
    </tr>
  `;

  return {
    to: [email],
    subject: EARLY_ACCESS_SUBJECT,
    html: `
      <div style="margin: 0; padding: 28px 14px; background-color: #f4f4f5; color: #111827; font-family: Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px;">
                <tr>
                  <td style="height: 6px; background: linear-gradient(90deg, #8b1a1a 0%, #c64848 50%, #8b1a1a 100%); border-radius: 14px 14px 0 0;"></td>
                </tr>
                <tr>
                  <td style="padding: 26px 24px 8px 24px;">
                    ${logoBlock}
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.65;">You just did something most people won't. You stopped, thought, and acted.</p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.65;">Your spot for Socratic AI Early Access is locked in. We're handpicking who gets in first, and you're on that list. When it's your turn, we'll land in your inbox with everything: how to get in, what to explore first, all of it.</p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.65;">Most waitlists forget you exist. We promise that we won't.</p>
                    <p style="margin: 0; font-size: 16px; line-height: 1.65;">Talk soon,<br/>The Socratic AI Team</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 24px 24px 24px; color: #71717a; font-size: 12px; line-height: 1.5;">
                    You received this because you joined the Socratic AI early access list.
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
