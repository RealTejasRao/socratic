const RESEND_API_URL = "https://api.resend.com/emails";
const LAUNCH_SUBJECT = "Socratic AI: Try Socratic AI now";
const SIGNUP_WELCOME_SUBJECT = "Welcome to Socratic AI";
const DEFAULT_FROM_NAME = "Socratic";
const SOCRATIC_LOGO_URL = "https://www.usesocratic.com/brand/Logo_Dark.png";
const SOCRATIC_SITE_URL =
  process.env["NEXT_PUBLIC_APP_URL"]?.trim() || "https://www.usesocratic.com";
const SOCRATIC_CONTACT_EMAIL = "contact@usesocratic.com";

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
<div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1f1d1a;">
  <style>
    @media only screen and (max-width: 640px) {
      .sa-shell { width: 100% !important; }
      .sa-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .sa-hero { padding: 32px 24px 28px 24px !important; }
      .sa-body { padding: 32px 24px !important; }
      .sa-title { font-size: 28px !important; line-height: 1.2 !important; }
      .sa-copy { font-size: 15px !important; line-height: 1.75 !important; }
      .sa-button { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .sa-logo { width: 150px !important; }
    }
  </style>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="sa-shell" style="width:640px;max-width:640px;background:#ffffff;border-collapse:collapse;border:1px solid #ddd3c8;border-radius:24px;overflow:hidden;">
          <tr>
            <td class="sa-hero" style="padding:40px 44px 34px 44px;background:linear-gradient(135deg,#171411 0%,#2e2923 52%,#8f775a 100%);text-align:left;">
              <img src="${SOCRATIC_LOGO_URL}" alt="Socratic AI logo" width="164" class="sa-logo" style="display:block;width:164px;height:auto;border:0;" />
              <div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>
              <p style="margin:0 0 12px 0;font-size:11px;line-height:1.4;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,245,232,0.74);">
                Welcome to Socratic AI
              </p>
              <h1 class="sa-title" style="margin:0;font-size:34px;line-height:1.16;font-weight:700;letter-spacing:-0.03em;color:#fff7ec;">
                Thank you for signing up.
              </h1>
              <p class="sa-copy" style="margin:18px 0 0 0;max-width:472px;font-size:16px;line-height:1.75;color:rgba(255,245,232,0.86);">
                You are now part of a platform built for people who want sharper thinking, harder questions, and better conversations with ideas that matter.
              </p>
            </td>
          </tr>
          <tr>
            <td class="sa-body sa-pad" style="padding:40px 44px 18px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="padding:22px 24px;background:#f8f4ee;border:1px solid #e7ddd1;border-radius:18px;">
                    <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;letter-spacing:0.16em;text-transform:uppercase;color:#8b735c;">
                      Who we are
                    </p>
                    <p class="sa-copy" style="margin:0;font-size:16px;line-height:1.8;color:#342e28;">
                      Socratic AI is a thinking partner designed to challenge shallow conclusions. We help you examine assumptions, test arguments, and develop clearer judgment through rigorous dialogue instead of passive answer consumption.
                    </p>
                  </td>
                </tr>
              </table>
              <p class="sa-copy" style="margin:0 0 18px 0;font-size:16px;line-height:1.8;color:#342e28;">
                Inside Socratic AI, you can explore difficult questions, pressure-test your beliefs, and work through philosophy, psychology, strategy, and personal decision-making with an experience designed to make your reasoning stronger.
              </p>
              <p class="sa-copy" style="margin:0 0 18px 0;font-size:16px;line-height:1.8;color:#342e28;">
                Our goal is simple: build software that makes people think better. Not faster. Not lazier. Better.
              </p>
              <p class="sa-copy" style="margin:0 0 32px 0;font-size:16px;line-height:1.8;color:#342e28;">
                We’re glad you’re here, and we’re excited to have you with us from the beginning.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius:999px;background:#171411;">
                    <a
                      href="${SOCRATIC_SITE_URL}"
                      class="sa-button"
                      style="display:inline-block;padding:14px 24px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:0.02em;color:#fff7ec;text-decoration:none;background:#171411;"
                    >
                      Open Socratic AI
                    </a>
                  </td>
                </tr>
              </table>
              <p class="sa-copy" style="margin:0;font-size:15px;line-height:1.8;color:#5f564c;">
                If you have questions, just reach us at
                <a href="mailto:${SOCRATIC_CONTACT_EMAIL}" style="color:#5f564c;text-decoration:underline;">${SOCRATIC_CONTACT_EMAIL}</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td class="sa-pad" style="padding:0 44px 34px 44px;">
              <div style="height:1px;background:#ece2d7;margin:0 0 18px 0;">&nbsp;</div>
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
      "WELCOME TO SOCRATIC AI",
      "",
      "Thank you for signing up.",
      "",
      "Socratic AI is a thinking partner designed to challenge shallow conclusions. We help you examine assumptions, test arguments, and develop clearer judgment through rigorous dialogue instead of passive answer consumption.",
      "",
      "Inside Socratic AI, you can explore difficult questions, pressure-test your beliefs, and work through philosophy, psychology, strategy, and personal decision-making with an experience designed to make your reasoning stronger.",
      "",
      "Our goal is simple: build software that makes people think better. Not faster. Not lazier. Better.",
      "",
      `Open Socratic AI: ${SOCRATIC_SITE_URL}`,
      `Questions: ${SOCRATIC_CONTACT_EMAIL}`,
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
