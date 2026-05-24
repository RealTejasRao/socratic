import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

const RESEND_API_URL = "https://api.resend.com/emails";
const LAUNCH_SUBJECT = "Socratic AI: Try Socratic AI now";
const SIGNUP_WELCOME_SUBJECT = "We saw what you did 👁️";
const DEFAULT_FROM_NAME = "Socratic";
const SOCRATIC_LOGO_URL = "https://www.usesocratic.com/brand/Logo_Dark.png";
const SOCRATIC_SITE_URL =
  process.env["NEXT_PUBLIC_APP_URL"]?.trim() || "https://www.usesocratic.com";
const SOCRATIC_CONTACT_EMAIL = "contact@usesocratic.com";
const SOCRATIC_LIGHT_LOGO_URL = resolveCloudinaryPublicAsset(
  "/brand/Logo_Light.png",
);
const SOCRATIC_MAIL_HERO_IMAGE_URL =
  "https://res.cloudinary.com/dz0v0p86u/image/upload/v1779654052/mail_mc3r5p.jpg";

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

type ResendMessage = {
  to: string[];
  subject: string;
  html: string;
  text: string;
};

function formatFromHeader(fromName: string, fromEmail: string) {
  if (fromEmail.includes("<") && fromEmail.includes(">")) {
    return fromEmail;
  }

  return `${fromName} <${fromEmail}>`;
}

function buildLaunchMessage(email: string): ResendMessage {
  return {
    to: [email],
    subject: LAUNCH_SUBJECT,
    html: `
<div class="sa-email-wrap" style="margin:0;padding:44px 18px;font-family:Georgia,'Times New Roman',serif;background-color:#ffffff;">
  <style>
    @media only screen and (max-width: 640px) {
      .sa-email-wrap { padding: 20px 10px !important; }
      .sa-email-shell { border-left: 0 !important; border-right: 0 !important; }
      .sa-email-header { padding: 28px 22px 24px 22px !important; }
      .sa-email-body { padding: 28px 22px 2px 22px !important; }
      .sa-email-footer { padding: 20px 22px 26px 22px !important; }
      .sa-logo { width: 132px !important; }
      .sa-title { font-size: 21px !important; line-height: 1.4 !important; margin-bottom: 24px !important; }
      .sa-body-copy { font-size: 15px !important; line-height: 1.7 !important; }
    }
  </style>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          class="sa-email-shell"
          style="max-width:620px;background:#ffffff;border:1px solid #dddad5;">
          <tr><td style="height:2px;background:#111111;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td class="sa-email-header" style="padding:44px 52px 36px 52px;text-align:center;border-bottom:1px solid #e8e5e0;">
              <p style="margin:0 0 6px 0;font-size:10px;letter-spacing:0.3em;color:#333230;text-transform:uppercase;">Socratic AI</p>
              <img src="${SOCRATIC_LOGO_URL}" alt="Socratic AI logo" width="160" class="sa-logo" style="display:block;margin:0 auto;width:160px;height:auto;border:0;" />
              <div style="width:28px;height:1px;background:#555350;margin:16px auto;">&nbsp;</div>
              <p style="margin:0;font-size:10px;letter-spacing:0.18em;color:#555350;text-transform:uppercase;">Socratic AI is live</p>
            </td>
          </tr>
          <tr>
            <td class="sa-email-body" style="padding:44px 52px 8px 52px;">
              <h1 class="sa-title" style="margin:0 0 32px 0;font-size:26px;line-height:1.35;font-weight:400;color:#111111;font-style:italic;">
                You've taken the first step toward a sharper perspective.
              </h1>
              <p class="sa-body-copy" style="margin:0 0 20px 0;font-size:16px;line-height:1.85;color:#333230;">
                You just did something most people won't. You stopped, thought, and acted. In a world full of easy answers, you chose to sign up for a challenge.
              </p>
              <p class="sa-body-copy" style="margin:0 0 20px 0;font-size:16px;line-height:1.85;color:#333230;">
                Socratic AI is now available. You can sign in and start using it right away.
              </p>
              <p class="sa-body-copy" style="margin:0 0 40px 0;font-size:16px;line-height:1.85;color:#333230;">
                Thanks for being early to this journey. We're excited to have you with us.
              </p>
              <p class="sa-body-copy" style="margin:0 0 44px 0;font-size:16px;line-height:1.7;color:#333230;">
                Talk soon,<br/>
                <strong>The Socratic AI Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td class="sa-email-footer" style="padding:24px 52px 32px 52px;border-top:1px solid #e8e5e0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#aaa9a5;">
                You received this email because you requested updates from Socratic AI.
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
      "SOCRATIC AI: TRY SOCRATIC AI NOW",
      "",
      "You've taken the first step toward a sharper perspective.",
      "",
      "You just did something most people won't. You stopped, thought, and acted. In a world full of easy answers, you chose to sign up for a challenge.",
      "",
      "Socratic AI is now available. You can sign in and start using it right away.",
      "",
      "Thanks for being early to this journey. We're excited to have you with us.",
      "",
      "Talk soon,",
      "The Socratic AI Team",
      "",
      "You received this email because you requested updates from Socratic AI.",
    ].join("\n"),
  };
}

function buildSignupWelcomeMessage(email: string): ResendMessage {
  return {
    to: [email],
    subject: SIGNUP_WELCOME_SUBJECT,
    html: `
<div style="margin:0;padding:32px 16px;background-color:#f8f6f1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#181512;">
  <style>
    @media only screen and (max-width: 640px) {
      .sa-shell { width: 100% !important; }
      .sa-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .sa-hero { height: 260px !important; }
      .sa-body { padding: 34px 24px 24px 24px !important; }
      .sa-copy { font-size: 15px !important; line-height: 1.85 !important; }
      .sa-logo { width: 154px !important; }
    }
  </style>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="sa-shell" style="width:640px;max-width:640px;background:#fffdf8;border-collapse:collapse;border:1px solid #e6e0d6;border-radius:24px;overflow:hidden;">
          <tr>
            <td
              class="sa-hero"
              align="center"
              valign="middle"
              background="${SOCRATIC_MAIL_HERO_IMAGE_URL}"
              style="height:300px;background-color:#1a1612;background-image:url('${SOCRATIC_MAIL_HERO_IMAGE_URL}');background-position:center center;background-size:cover;background-repeat:no-repeat;text-align:center;"
            >
              <table role="presentation" width="100%" height="300" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" style="padding:24px;">
                    <img src="${SOCRATIC_LIGHT_LOGO_URL}" alt="Socratic AI logo" width="172" class="sa-logo" style="display:block;width:172px;height:auto;border:0;margin:0 auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="sa-body sa-pad" style="padding:40px 44px 26px 44px;">
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:17px;line-height:1.9;color:#201c18;font-weight:600;">
                Account confirmed.
              </p>
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:16px;line-height:1.9;color:#342e28;">
                On an unrelated note, people who sign up for Socratic AI have been known to be 80% smarter, 63% more curious, and 100% awesome.
              </p>
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:16px;line-height:1.9;color:#342e28;">
                We made those stats up. But you get the idea. You're cool!
              </p>
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:16px;line-height:1.9;color:#342e28;">
                A bit about our AI: it’s not another generic chatbot. It's trained on the works of one of the greatest thinkers in history. Just use it for a week, and you'll love it.
              </p>
              <p class="sa-copy" style="margin:0 0 30px 0;font-size:16px;line-height:1.9;color:#342e28;">
                Welcome.
              </p>
              <p class="sa-copy" style="margin:0;font-size:15px;line-height:1.9;color:#5f564c;font-weight:700;">
                <strong>Socratic AI</strong><br />
                <a href="${SOCRATIC_SITE_URL}" style="color:#5f564c;text-decoration:none;font-weight:700;"><strong>usesocratic.com</strong></a>
              </p>
            </td>
          </tr>
          <tr>
            <td class="sa-pad" style="padding:0 44px 34px 44px;">
              <div style="height:1px;background:#ece7dd;margin:0 0 18px 0;">&nbsp;</div>
              <p style="margin:0;font-size:12px;line-height:1.7;color:#8d8479;">
                You received this email because you created an account at Socratic AI.
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
      "Account confirmed.",
      "",
      "On an unrelated note, people who sign up for Socratic AI have been known to be 80% smarter, 63% more curious, and 100% awesome.",
      "",
      "We made those stats up. But you get the idea. You're cool!",
      "",
      "A bit about our AI: it’s not another generic chatbot. It's trained on the works of one of the greatest thinkers in history. Just use it for a week, and you'll love it.",
      "",
      "Welcome.",
      "",
      "Socratic AI",
      "usesocratic.com",
      "",
      "You received this email because you created an account at Socratic AI.",
    ].join("\n"),
  };
}

async function sendResendMessage(message: ResendMessage): Promise<SendResult> {
  const config = getResendConfig();
  if (!config) return { ok: false, reason: "not_configured" };

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
      headers: {
        "X-Entity-Ref-ID": `${Date.now()}`,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Resend email request failed", {
      status: response.status,
    });
    return { ok: false, reason: "request_failed" };
  }

  return { ok: true };
}

export async function sendLaunchThankYouEmail(
  email: string,
): Promise<SendResult> {
  return sendResendMessage(buildLaunchMessage(email));
}

export async function sendSignupWelcomeEmail(
  email: string,
): Promise<SendResult> {
  return sendResendMessage(buildSignupWelcomeMessage(email));
}
