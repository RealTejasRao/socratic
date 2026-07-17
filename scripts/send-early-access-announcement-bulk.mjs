import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

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
  };
}

function readNumberArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = Number.parseInt(process.argv[index + 1] ?? "", 10);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadEarlyAccessEmails() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const result = await client.query(
      'SELECT "email" FROM "EarlyAccess" ORDER BY "createdAt" ASC',
    );

    return Array.from(
      new Set(
        result.rows
          .map((row) => String(row.email ?? "").trim().toLowerCase())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      ),
    );
  } finally {
    await client.end();
  }
}

async function appendLog(logFile, entry) {
  await fs.appendFile(logFile, `${JSON.stringify(entry)}\n`, "utf8");
}

async function sendResendMessage(message, apiKey) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...message,
      headers: {
        "X-Entity-Ref-ID": `early-access-bulk-${Date.now()}`,
      },
    }),
  });

  const responseText = await response.text();
  let parsed = null;

  try {
    parsed = responseText ? JSON.parse(responseText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: parsed ?? responseText,
    };
  }

  return {
    ok: true,
    status: response.status,
    id: parsed?.id ?? null,
  };
}

async function main() {
  await hydrateEnvFromFile(".env.local");
  await hydrateEnvFromFile(".env");

  const shouldSend = process.argv.includes("--send");
  const limit = readNumberArg("--limit", null);
  const delayMs = readNumberArg("--delay-ms", 800);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (shouldSend && (!apiKey || !fromEmail)) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
  }

  const assetMap = await loadAssetMap();
  const heroImageUrl = assetMap["/mail/mail-early-access.webp"];
  const logoUrl = assetMap["/brand/Logo_Light.png"];

  if (!heroImageUrl?.startsWith("https://")) {
    throw new Error("Missing public Cloudinary URL for /mail/mail-early-access.webp.");
  }

  if (!logoUrl?.startsWith("https://")) {
    throw new Error("Missing public Cloudinary URL for /brand/Logo_Light.png.");
  }

  const emails = await loadEarlyAccessEmails();
  const recipients = limit ? emails.slice(0, limit) : emails;
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const logDir = path.resolve(workspaceRoot, "logs");
  const logFile = path.join(logDir, `early-access-announcement-${runId}.jsonl`);

  console.log(`EarlyAccess recipients: ${emails.length}`);
  console.log(`Selected recipients: ${recipients.length}`);
  console.log(`Mode: ${shouldSend ? "send" : "dry-run"}`);

  if (!shouldSend) {
    console.log("Sample recipients:");
    for (const email of recipients.slice(0, 10)) {
      console.log(`- ${email}`);
    }
    console.log("Dry run only. Re-run with --send to send emails.");
    return;
  }

  await fs.mkdir(logDir, { recursive: true });
  console.log(`Log file: ${path.relative(workspaceRoot, logFile)}`);

  let sent = 0;
  let failed = 0;

  for (const [index, email] of recipients.entries()) {
    const result = await sendResendMessage(
      buildMessage({ email, heroImageUrl, logoUrl }),
      apiKey,
    );

    const entry = {
      at: new Date().toISOString(),
      index: index + 1,
      total: recipients.length,
      email,
      ...result,
    };

    await appendLog(logFile, entry);

    if (result.ok) {
      sent += 1;
      console.log(`[${index + 1}/${recipients.length}] sent ${email} (${result.id ?? "no id"})`);
    } else {
      failed += 1;
      console.error(`[${index + 1}/${recipients.length}] failed ${email} (${result.status})`);
    }

    if (index < recipients.length - 1) {
      await sleep(delayMs);
    }
  }

  console.log(`Done. Sent: ${sent}. Failed: ${failed}.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
