import { NextResponse } from "next/server";
import { sendContactFormEmail } from "@/src/server/email/resend";
import {
  consumeUserRateLimit,
  createRateLimitHeaders,
  getRequestIp,
} from "@/src/server/security/rate-limit";

const MAX_MESSAGE_WORDS = 2000;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

function sanitizeField(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(value: string) {
  const normalized = value.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}

function isValidEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!email) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;

  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) return false;
  if (email.includes("..")) return false;

  return true;
}

function getStringField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rateLimit = await consumeUserRateLimit({
    scope: "contact-form",
    userId: "anonymous",
    ip,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many messages. Please try again later." },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      },
    );
  }

  let body: Record<string, unknown>;

  try {
    const payload = (await request.json()) as unknown;
    body =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const name = sanitizeField(getStringField(body, "name"));
  const email = sanitizeField(getStringField(body, "email")).toLowerCase();
  const message = sanitizeField(getStringField(body, "message"));

  if (!name || !email || !message) {
    return NextResponse.json(
      { message: "Please complete all required fields." },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  if (!NAME_REGEX.test(name) || !isValidEmail(email)) {
    return NextResponse.json(
      { message: "Please fix highlighted fields before sending." },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  if (countWords(message) > MAX_MESSAGE_WORDS) {
    return NextResponse.json(
      { message: "Message is too long. Maximum allowed is 2000 words." },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  try {
    const result = await sendContactFormEmail({ name, email, message });

    if (!result.ok) {
      const message =
        result.reason === "not_configured"
          ? "Email service is not configured yet."
          : "Could not send right now. Please try again in a moment.";

      return NextResponse.json(
        { message },
        { status: 503, headers: createRateLimitHeaders(rateLimit) },
      );
    }

    return NextResponse.json(
      { message: "Message sent successfully. Thanks for sharing!" },
      { status: 202, headers: createRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    console.error("Contact form email failed", { error });
    return NextResponse.json(
      { message: "Could not send right now. Please try again in a moment." },
      { status: 500, headers: createRateLimitHeaders(rateLimit) },
    );
  }
}
