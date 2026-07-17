import fs from "node:fs/promises";
import path from "node:path";

const workspaceRoot = process.cwd();
const RESEND_API_URL = "https://api.resend.com/emails";
const SUBJECT = "We haven't forgotten about you 😗";
const DEFAULT_FROM_NAME = "Socratic";
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.usesocratic.com";

async function hydrateEnvFromFile(fileName) {
  const filePath = path.resolve(workspaceRoot, fileName);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing env files.
  }
}

async function loadAssetMap() {
  const mapPath = path.resolve(
    workspaceRoot,
    "src/config/cloudinary-public-assets.json",
  );
  const content = await fs.readFile(mapPath, "utf8");
  return JSON.parse(content);
}

function formatFromHeader(fromName, fromEmail) {
  if (fromEmail.includes("<") && fromEmail.includes(">")) {
    return fromEmail;
  }

  return `${fromName} <${fromEmail}>`;
}

function buildMessage({ email, heroImageUrl, logoUrl }) {
  return {
    from: formatFromHeader(
      process.env.RESEND_FROM_NAME?.trim() || DEFAULT_FROM_NAME,
      process.env.RESEND_FROM_EMAIL.trim(),
    ),
    to: [email],
    subject: SUBJECT,
    html: `
<div style="margin:0;padding:32px 16px;background-color:#f8f6f1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#181512;">
  <style>
    @media only screen and (max-width: 640px) {
      .sa-shell { width: 100% !important; }
      .sa-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .sa-hero { height: 260px !important; }
      .sa-hero-table { height: 260px !important; }
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
              background="${heroImageUrl}"
              style="height:300px;background-color:#1a1612;background-image:url('${heroImageUrl}');background-position:center center;background-size:cover;background-repeat:no-repeat;text-align:center;"
            >
              <table role="presentation" width="100%" height="300" cellpadding="0" cellspacing="0" border="0" class="sa-hero-table" style="width:100%;height:300px;">
                <tr>
                  <td align="center" valign="middle" style="padding:24px;text-align:center;">
                    <img src="${logoUrl}" alt="Socratic AI logo" width="172" class="sa-logo" style="display:block;width:172px;height:auto;border:0;margin:0 auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="sa-body sa-pad" style="padding:40px 44px 26px 44px;">
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:17px;line-height:1.9;color:#201c18;font-weight:600;">
                Hey, it's been a while.
              </p>
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:16px;line-height:1.9;color:#342e28;">
                You signed up for Socratic AI early access, back when it was basically a prototype and a promise. Then we went quiet for a bit and built the actual thing.
              </p>
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:16px;line-height:1.9;color:#342e28;">
                It's fully live now. We even gathered feedback from professors and authors, and we are proud to say that many have called it <strong>"The Best AI for Philosophy"</strong>. And they definitely agreed on the part that it can certainly change and improve how the user thinks in a short period.
              </p>
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:16px;line-height:1.9;color:#342e28;">
                One important thing: this isn't just for people who already read philosophy. It's for people who just want to think sharper, argue better, and <strong>become smarter overall</strong>. You don't need to know who Nietzsche is. You just need to want a better brain.
              </p>
              <p class="sa-copy" style="margin:0 0 22px 0;font-size:16px;line-height:1.9;color:#342e28;">
                So yeah, just wanted to tell you: it's ready, and you were here before anyone else was.
              </p>
              <p class="sa-copy" style="margin:0 0 30px 0;font-size:16px;line-height:1.9;color:#342e28;">
                Your place is reserved and is waiting to be filled.
              </p>
              <p class="sa-copy" style="margin:0;font-size:15px;line-height:1.9;color:#5f564c;font-weight:700;">
                <a href="${SITE_URL}" style="color:#2563eb;text-decoration:underline;font-weight:700;"><strong>usesocratic.com</strong></a>
              </p>
            </td>
          </tr>
          <tr>
            <td class="sa-pad" style="padding:0 44px 34px 44px;">
              <div style="height:1px;background:#ece7dd;margin:0 0 18px 0;">&nbsp;</div>
              <p style="margin:0;font-size:12px;line-height:1.7;color:#8d8479;">
                You received this email because you requested early access to Socratic AI.
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
      "Hey, it's been a while.",
      "",
      "You signed up for Socratic AI early access, back when it was basically a prototype and a promise. Then we went quiet for a bit and built the actual thing.",
      "",
      'It\'s fully live now. We even gathered feedback from professors and authors, and we are proud to say that many have called it "The Best AI for Philosophy". And they definitely agreed on the part that it can certainly change and improve how the user thinks in a short period.',
      "",
      "One important thing: this isn't just for people who already read philosophy. It's for people who just want to think sharper, argue better, and become smarter overall. You don't need to know who Nietzsche is. You just need to want a better brain.",
      "",
      "So yeah, just wanted to tell you: it's ready, and you were here before anyone else was.",
      "",
      "Your place is reserved and is waiting to be filled.",
      "",
      "usesocratic.com",
      "",
      "You received this email because you requested early access to Socratic AI.",
    ].join("\n"),
    headers: {
      "X-Entity-Ref-ID": `early-access-test-${Date.now()}`,
    },
  };
}

function parseRecipient() {
  const toIndex = process.argv.indexOf("--to");
  const recipient = toIndex >= 0 ? process.argv[toIndex + 1] : process.argv[2];

  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Usage: node scripts/send-early-access-announcement-test.mjs --to email@example.com");
  }

  return recipient.trim().toLowerCase();
}

async function main() {
  await hydrateEnvFromFile(".env.local");
  await hydrateEnvFromFile(".env");

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
  }

  const recipient = parseRecipient();
  const assetMap = await loadAssetMap();
  const heroImageUrl = assetMap["/mail/mail-early-access.webp"];
  const logoUrl = assetMap["/brand/Logo_Light.png"];

  if (!heroImageUrl?.startsWith("https://")) {
    throw new Error(
      "Missing public Cloudinary URL for /mail/mail-early-access.webp. Upload it before sending the Gmail test.",
    );
  }

  if (!logoUrl?.startsWith("https://")) {
    throw new Error("Missing public Cloudinary URL for /brand/Logo_Light.png.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildMessage({ email: recipient, heroImageUrl, logoUrl })),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${responseText}`);
  }

  const result = await response.json();
  console.log(`Sent early-access announcement test to ${recipient}.`);
  console.log(`Resend id: ${result.id ?? "unknown"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
