const RESEND_API_URL = "https://api.resend.com/emails";
const EARLY_ACCESS_SUBJECT = "Socratic AI: Your early access is confirmed";
const DEFAULT_FROM_NAME = "Tejas | Socratic AI";
const EARLY_ACCESS_LOGO_URL = "https://usesocratic.com/brand/Logo_Light.png";

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
              <img src="${EARLY_ACCESS_LOGO_URL}" alt="Socratic AI logo" width="160" class="sa-logo" style="display:block;margin:0 auto;width:160px;height:auto;border:0;" />
              <div style="width:28px;height:1px;background:#555350;margin:16px auto;">&nbsp;</div>
              <p style="margin:0;font-size:10px;letter-spacing:0.18em;color:#555350;text-transform:uppercase;">Early Access Confirmed</p>
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
                Your spot for Socratic AI Early Access is locked in. We're handpicking who gets in first, and you're on that list. When it's your turn, we'll land in your inbox with everything: how to get in, what to explore first, all of it.
              </p>
              <p class="sa-body-copy" style="margin:0 0 40px 0;font-size:16px;line-height:1.85;color:#333230;">
                Most waitlists forget you exist the moment you hit "submit", but we are doing things differently. We are currently in the final stages of development, doing some touch ups. We appreciate your patience and your interest in what we're building.
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
      "SOCRATIC AI: EARLY ACCESS CONFIRMED",
      "",
      "You've taken the first step toward a sharper perspective.",
      "",
      "You just did something most people won't. You stopped, thought, and acted. In a world full of easy answers, you chose to sign up for a challenge.",
      "",
      "Your spot for Socratic AI Early Access is locked in. We're handpicking who gets in first, and you're on that list. When it's your turn, we'll land in your inbox with everything: how to get in, what to explore first, all of it.",
      "",
      'Most waitlists forget you exist the moment you hit "submit", but we are doing things differently. We are currently in the final stages of development, doing some touch ups. We appreciate your patience and your interest in what we\'re building.',
      "",
      "Talk soon,",
      "The Socratic AI Team",
      "",
      "You received this email because you joined the Socratic AI early access list.",
    ].join("\n"),
  };
}

export async function sendEarlyAccessThankYouEmail(
  email: string,
): Promise<SendResult> {
  const config = getResendConfig();
  if (!config) return { ok: false, reason: "not_configured" };

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
      headers: {
        "X-Entity-Ref-ID": `${Date.now()}`,
      },
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
